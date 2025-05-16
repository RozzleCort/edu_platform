from django.db import models
from accounts.models import User
from courses.models import Course

class LiveEvent(models.Model):
    """直播活动模型"""
    LIVE_STATUS = (
        ('scheduled', '未开始'),
        ('live', '直播中'),
        ('ended', '已结束'),
        ('canceled', '已取消'),
    )
    
    title = models.CharField(max_length=255, verbose_name='直播标题')
    description = models.TextField(blank=True, null=True, verbose_name='直播描述')
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='live_events', verbose_name='讲师')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='live_events', verbose_name='关联课程')
    
    # 直播时间
    scheduled_start_time = models.DateTimeField(verbose_name='计划开始时间')
    scheduled_end_time = models.DateTimeField(verbose_name='计划结束时间')
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name='实际开始时间')
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name='实际结束时间')
    
    # 直播状态
    status = models.CharField(max_length=20, choices=LIVE_STATUS, default='scheduled', verbose_name='直播状态')
    
    # 直播配置
    stream_key = models.CharField(max_length=100, blank=True, null=True, verbose_name='推流密钥')
    rtmp_url = models.CharField(max_length=255, blank=True, null=True, verbose_name='RTMP推流地址')
    play_url = models.CharField(max_length=255, blank=True, null=True, verbose_name='播放地址')
    pre_recorded_video_url = models.URLField(max_length=500, blank=True, null=True, verbose_name='预录制视频URL')
    
    # 直播统计
    viewer_count = models.PositiveIntegerField(default=0, verbose_name='观看人数')
    max_viewer_count = models.PositiveIntegerField(default=0, verbose_name='最高观看人数')
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '直播活动'
        verbose_name_plural = '直播活动'
        ordering = ['-scheduled_start_time']
    
    def __str__(self):
        return self.title
    
    def is_upcoming(self):
        """是否即将开始"""
        import datetime
        now = datetime.datetime.now()
        return self.status == 'scheduled' and self.scheduled_start_time > now

class LiveEnrollment(models.Model):
    """直播报名记录"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='live_enrollments', verbose_name='用户')
    live_event = models.ForeignKey(LiveEvent, on_delete=models.CASCADE, related_name='enrollments', verbose_name='直播活动')
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name='报名时间')
    attended = models.BooleanField(default=False, verbose_name='是否参与')
    
    class Meta:
        verbose_name = '直播报名'
        verbose_name_plural = '直播报名'
        unique_together = ['user', 'live_event']
    
    def __str__(self):
        return f"{self.user.username} - {self.live_event.title}"

class LiveChat(models.Model):
    """直播聊天记录"""
    live_event = models.ForeignKey(LiveEvent, on_delete=models.CASCADE, related_name='chat_messages', verbose_name='直播活动')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='live_chat_messages', verbose_name='用户')
    message = models.TextField(verbose_name='消息内容')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='发送时间')
    
    class Meta:
        verbose_name = '直播聊天'
        verbose_name_plural = '直播聊天'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username}: {self.message[:20]}..."
