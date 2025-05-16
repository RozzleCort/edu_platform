from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Comment, CommentLike, Notification
from accounts.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    reply_count = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'content_type', 'object_id', 
                 'parent', 'is_public', 'is_removed', 'created_at', 
                 'updated_at', 'reply_count', 'like_count', 'is_liked']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_reply_count(self, obj):
        return obj.replies.filter(is_public=True, is_removed=False).count()
    
    def get_like_count(self, obj):
        return obj.likes.count()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

class CommentCreateSerializer(serializers.ModelSerializer):
    content_type_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = Comment
        fields = ['content', 'content_type_name', 'object_id', 'parent']
    
    def validate(self, data):
        content_type_name = data.pop('content_type_name')
        try:
            app_label, model = content_type_name.split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
            data['content_type'] = content_type
        except (ValueError, ContentType.DoesNotExist):
            raise serializers.ValidationError({'content_type_name': '无效的内容类型'})
        
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CommentLikeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'sender', 'notification_type', 
                 'content_type', 'object_id', 'message', 'is_read',
                 'created_at']
        read_only_fields = ['recipient', 'sender', 'notification_type', 
                          'content_type', 'object_id', 'message', 'created_at']
    
    def update(self, instance, validated_data):
        """只允许更新已读状态"""
        instance.is_read = validated_data.get('is_read', instance.is_read)
        instance.save()
        return instance 