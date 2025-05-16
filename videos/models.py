from django.db import models
from courses.models import Lesson
from accounts.models import User

class Video(models.Model):
    """视频资源"""
    STATUS_CHOICES = (
        ('processing', '处理中'),
        ('ready', '就绪'),
        ('error', '错误'),
    )
    
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='video', verbose_name='关联课时')
    title = models.CharField(max_length=200, verbose_name='视频标题')
    file = models.FileField(upload_to='videos/', verbose_name='视频文件')
    thumbnail = models.ImageField(upload_to='video_thumbnails/', blank=True, null=True, verbose_name='缩略图')
    duration = models.PositiveIntegerField(default=0, verbose_name='时长(秒)')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='processing', verbose_name='状态')
    is_downloadable = models.BooleanField(default=False, verbose_name='是否可下载')
    upload_date = models.DateTimeField(auto_now_add=True, verbose_name='上传日期')
    
    class Meta:
        verbose_name = '视频'
        verbose_name_plural = '视频'
    
    def __str__(self):
        return self.title

class LiveStreaming(models.Model):
    """直播课程"""
    STATUS_CHOICES = (
        ('scheduled', '计划中'),
        ('live', '正在直播'),
        ('ended', '已结束'),
        ('cancelled', '已取消'),
    )
    
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='live_stream', verbose_name='关联课时')
    title = models.CharField(max_length=200, verbose_name='直播标题')
    description = models.TextField(blank=True, null=True, verbose_name='直播描述')
    scheduled_start_time = models.DateTimeField(verbose_name='计划开始时间')
    scheduled_end_time = models.DateTimeField(verbose_name='计划结束时间')
    actual_start_time = models.DateTimeField(blank=True, null=True, verbose_name='实际开始时间')
    actual_end_time = models.DateTimeField(blank=True, null=True, verbose_name='实际结束时间')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='scheduled', verbose_name='状态')
    stream_key = models.CharField(max_length=100, blank=True, null=True, verbose_name='流密钥')
    stream_url = models.URLField(blank=True, null=True, verbose_name='流地址')
    
    class Meta:
        verbose_name = '直播课程'
        verbose_name_plural = '直播课程'
    
    def __str__(self):
        return self.title

class VideoWatchHistory(models.Model):
    """视频观看历史"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='video_history', verbose_name='用户')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='watch_history', verbose_name='视频')
    watched_duration = models.PositiveIntegerField(default=0, verbose_name='观看时长(秒)')
    last_position = models.PositiveIntegerField(default=0, verbose_name='上次位置(秒)')
    completed = models.BooleanField(default=False, verbose_name='是否完成')
    watch_date = models.DateTimeField(auto_now=True, verbose_name='观看日期')
    
    class Meta:
        verbose_name = '视频观看历史'
        verbose_name_plural = '视频观看历史'
        unique_together = ['user', 'video']
    
    def __str__(self):
        return f"{self.user.username} - {self.video.title}"

class LiveStreamingAttendance(models.Model):
    """直播出席记录"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='live_attendances', verbose_name='用户')
    live_streaming = models.ForeignKey(LiveStreaming, on_delete=models.CASCADE, related_name='attendances', verbose_name='直播课')
    join_time = models.DateTimeField(auto_now_add=True, verbose_name='加入时间')
    leave_time = models.DateTimeField(blank=True, null=True, verbose_name='离开时间')
    duration = models.PositiveIntegerField(default=0, verbose_name='在线时长(分钟)')
    
    class Meta:
        verbose_name = '直播出席记录'
        verbose_name_plural = '直播出席记录'
    
    def __str__(self):
        return f"{self.user.username} - {self.live_streaming.title}"
