from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from accounts.models import User

class Comment(models.Model):
    """评论模型，支持评论任何内容"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments', verbose_name='用户')
    content = models.TextField(verbose_name='内容')
    
    # 通用外键，可以关联到任何模型（如课程、视频、测验等）
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, verbose_name='内容类型')
    object_id = models.PositiveIntegerField(verbose_name='对象ID')
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # 回复功能支持
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies', verbose_name='父评论')
    
    # 评论状态
    is_public = models.BooleanField(default=True, verbose_name='是否公开')
    is_removed = models.BooleanField(default=False, verbose_name='是否删除')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '评论'
        verbose_name_plural = '评论'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}的评论: {self.content[:50]}"

class CommentLike(models.Model):
    """评论点赞"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes', verbose_name='用户')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes', verbose_name='评论')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '评论点赞'
        verbose_name_plural = '评论点赞'
        unique_together = ['user', 'comment']
    
    def __str__(self):
        return f"{self.user.username}点赞了{self.comment.user.username}的评论"

class Notification(models.Model):
    """通知模型"""
    NOTIFICATION_TYPES = (
        ('comment', '评论'),
        ('reply', '回复'),
        ('like', '点赞'),
        ('course', '课程更新'),
        ('system', '系统通知'),
    )
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='接收者')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sent_notifications', verbose_name='发送者')
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES, verbose_name='通知类型')
    
    # 通用外键，可以关联到任何模型
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True, verbose_name='内容类型')
    object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name='对象ID')
    content_object = GenericForeignKey('content_type', 'object_id')
    
    message = models.TextField(verbose_name='消息内容')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '通知'
        verbose_name_plural = '通知'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.recipient.username}的{self.get_notification_type_display()}通知"
