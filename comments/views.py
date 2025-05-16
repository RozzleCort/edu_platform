from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from .models import Comment, CommentLike, Notification
from .serializers import (
    CommentSerializer,
    CommentCreateSerializer,
    CommentLikeSerializer,
    NotificationSerializer
)

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    自定义权限：只允许创建者编辑
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user

class CommentViewSet(viewsets.ModelViewSet):
    """评论视图集"""
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        queryset = Comment.objects.filter(is_public=True, is_removed=False)
        
        # 按内容类型和对象ID过滤
        content_type_name = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        
        if content_type_name and object_id:
            try:
                app_label, model = content_type_name.split('.')
                content_type = ContentType.objects.get(app_label=app_label, model=model)
                queryset = queryset.filter(content_type=content_type, object_id=object_id)
            except (ValueError, ContentType.DoesNotExist):
                pass
                
        # 按父评论过滤，获取顶层评论或回复
        parent = self.request.query_params.get('parent')
        if parent == 'null':
            queryset = queryset.filter(parent__isnull=True)
        elif parent:
            queryset = queryset.filter(parent=parent)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'like', 'unlike']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        comment = serializer.save()
        
        # 创建通知
        if comment.parent:
            # 如果是回复，通知被回复的评论的作者
            recipient = comment.parent.user
            if recipient != comment.user:  # 不通知自己
                Notification.objects.create(
                    recipient=recipient,
                    sender=comment.user,
                    notification_type='reply',
                    content_type=ContentType.objects.get_for_model(Comment),
                    object_id=comment.id,
                    message=f"{comment.user.username} 回复了您的评论: {comment.content[:50]}"
                )
        else:
            # 如果是对内容的评论，通知内容作者
            content_obj = comment.content_object
            if hasattr(content_obj, 'instructor'):  # 课程
                recipient = content_obj.instructor
                if recipient != comment.user:  # 不通知自己
                    Notification.objects.create(
                        recipient=recipient,
                        sender=comment.user,
                        notification_type='comment',
                        content_type=comment.content_type,
                        object_id=comment.object_id,
                        message=f"{comment.user.username} 评论了您的课程: {comment.content[:50]}"
                    )
    
    def perform_destroy(self, instance):
        # 软删除评论
        instance.is_removed = True
        instance.save()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """点赞评论"""
        comment = self.get_object()
        user = request.user
        
        # 检查是否已点赞
        if CommentLike.objects.filter(user=user, comment=comment).exists():
            return Response({"detail": "您已经点赞过此评论"}, status=status.HTTP_400_BAD_REQUEST)
        
        like = CommentLike.objects.create(user=user, comment=comment)
        
        # 创建通知
        if comment.user != user:  # 不通知自己
            Notification.objects.create(
                recipient=comment.user,
                sender=user,
                notification_type='like',
                content_type=ContentType.objects.get_for_model(Comment),
                object_id=comment.id,
                message=f"{user.username} 点赞了您的评论"
            )
        
        return Response(CommentLikeSerializer(like).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlike(self, request, pk=None):
        """取消点赞评论"""
        comment = self.get_object()
        user = request.user
        
        try:
            like = CommentLike.objects.get(user=user, comment=comment)
            like.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CommentLike.DoesNotExist:
            return Response({"detail": "您未点赞此评论"}, status=status.HTTP_400_BAD_REQUEST)

class NotificationViewSet(viewsets.ModelViewSet):
    """通知视图集"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(recipient=user).order_by('-created_at')
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_all_read(self, request):
        """标记所有通知为已读"""
        user = request.user
        Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)
        return Response({"detail": "所有通知已标记为已读"})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        """标记单个通知为已读"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def unread_count(self, request):
        """获取未读通知数量"""
        user = request.user
        count = Notification.objects.filter(recipient=user, is_read=False).count()
        return Response({"unread_count": count}) 