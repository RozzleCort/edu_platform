from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
import uuid
import datetime

from .models import LiveEvent, LiveEnrollment, LiveChat
from .serializers import (
    LiveEventSerializer, 
    LiveEventCreateSerializer, 
    LiveEnrollmentSerializer, 
    LiveChatSerializer
)

class IsInstructorOrReadOnly(permissions.BasePermission):
    """只有讲师可以编辑"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.instructor == request.user

class LiveEventViewSet(viewsets.ModelViewSet):
    """直播活动视图集"""
    serializer_class = LiveEventSerializer
    
    def get_queryset(self):
        queryset = LiveEvent.objects.all()
        
        # 过滤状态
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # 过滤课程
        course_param = self.request.query_params.get('course')
        if course_param:
            queryset = queryset.filter(course=course_param)
        
        # 过滤讲师
        instructor_param = self.request.query_params.get('instructor')
        if instructor_param == 'me' and self.request.user.is_authenticated:
            queryset = queryset.filter(instructor=self.request.user)
        elif instructor_param:
            queryset = queryset.filter(instructor=instructor_param)
        
        # 过滤已报名的直播
        enrolled_param = self.request.query_params.get('enrolled')
        if enrolled_param == 'true' and self.request.user.is_authenticated:
            queryset = queryset.filter(enrollments__user=self.request.user)
        
        # 过滤近期直播
        upcoming_param = self.request.query_params.get('upcoming')
        if upcoming_param == 'true':
            now = timezone.now()
            queryset = queryset.filter(
                Q(status='scheduled') & 
                Q(scheduled_start_time__gte=now)
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LiveEventCreateSerializer
        return LiveEventSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy', 'start_live', 'end_live']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """创建直播，添加调试信息"""
        print("=" * 80)
        print("创建直播 - 请求数据类型:", type(request.data))
        print("创建直播 - 请求数据:", request.data)
        print("创建直播 - 请求方法:", request.method)
        print("创建直播 - 请求用户:", request.user)
        print("=" * 80)
        
        # 获取序列化器
        serializer = self.get_serializer(data=request.data)
        
        # 验证失败时打印详细错误
        if not serializer.is_valid():
            print("验证错误:", serializer.errors)
            for field, errors in serializer.errors.items():
                print(f"字段 '{field}' 错误: {errors}")
            
            # 返回详细的错误信息
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 继续正常处理
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print("创建过程中出错:", str(e))
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_create(self, serializer):
        # 添加调试日志
        print("创建直播 - 请求数据:", self.request.data)
        print("创建直播 - 经过验证的数据:", serializer.validated_data)
        
        # 生成唯一的推流密钥
        stream_key = str(uuid.uuid4())
        # 这里假设使用RTMP协议
        rtmp_url = f"rtmp://your-rtmp-server.com/live/{stream_key}"
        play_url = f"https://your-video-server.com/live/{stream_key}/index.m3u8"
        
        try:
            live_event = serializer.save(
                instructor=self.request.user,
                stream_key=stream_key,
                rtmp_url=rtmp_url,
                play_url=play_url
            )
            print("直播创建成功:", live_event.id, live_event.title)
        except Exception as e:
            print("直播创建失败:", str(e))
            raise
    
    @action(detail=True, methods=['post'], permission_classes=[IsInstructorOrReadOnly])
    def start_live(self, request, pk=None):
        """开始直播"""
        live_event = self.get_object()
        
        if live_event.status != 'scheduled':
            return Response({"detail": "只有未开始的直播才能开始"}, status=status.HTTP_400_BAD_REQUEST)
        
        live_event.status = 'live'
        live_event.actual_start_time = timezone.now()
        live_event.save()
        
        return Response(LiveEventSerializer(live_event, context={'request': request}).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsInstructorOrReadOnly])
    def end_live(self, request, pk=None):
        """结束直播"""
        live_event = self.get_object()
        
        if live_event.status != 'live':
            return Response({"detail": "只有正在直播的活动才能结束"}, status=status.HTTP_400_BAD_REQUEST)
        
        live_event.status = 'ended'
        live_event.actual_end_time = timezone.now()
        live_event.save()
        
        return Response(LiveEventSerializer(live_event, context={'request': request}).data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        """报名直播"""
        live_event = self.get_object()
        user = request.user
        
        # 检查是否已报名
        if LiveEnrollment.objects.filter(user=user, live_event=live_event).exists():
            return Response({"detail": "您已经报名过此直播"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查直播状态
        if live_event.status == 'ended' or live_event.status == 'canceled':
            return Response({"detail": "直播已结束或取消，不能报名"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 创建报名记录
        enrollment = LiveEnrollment.objects.create(user=user, live_event=live_event)
        
        return Response(
            LiveEnrollmentSerializer(enrollment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def chat_messages(self, request, pk=None):
        """获取直播聊天记录"""
        live_event = self.get_object()
        messages = live_event.chat_messages.all()
        
        # 分页
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = LiveChatSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = LiveChatSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

class LiveChatViewSet(viewsets.ModelViewSet):
    """直播聊天视图集"""
    serializer_class = LiveChatSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LiveChat.objects.filter(live_event=self.kwargs.get('live_event_pk'))
    
    def perform_create(self, serializer):
        live_event_id = self.kwargs.get('live_event_pk')
        serializer.save(user=self.request.user, live_event_id=live_event_id)
