from django.contrib import admin
from .models import Video, LiveStreaming, VideoWatchHistory, LiveStreamingAttendance

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'status', 'duration', 'is_downloadable', 'upload_date')
    list_filter = ('status', 'is_downloadable', 'upload_date')
    search_fields = ('title', 'lesson__title', 'lesson__section__course__title')
    date_hierarchy = 'upload_date'

@admin.register(LiveStreaming)
class LiveStreamingAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'status', 'scheduled_start_time', 'actual_start_time', 'actual_end_time')
    list_filter = ('status', 'scheduled_start_time')
    search_fields = ('title', 'description', 'lesson__title', 'lesson__section__course__title')
    date_hierarchy = 'scheduled_start_time'

@admin.register(VideoWatchHistory)
class VideoWatchHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'video', 'watched_duration', 'last_position', 'completed', 'watch_date')
    list_filter = ('completed', 'watch_date')
    search_fields = ('user__username', 'video__title')
    date_hierarchy = 'watch_date'

@admin.register(LiveStreamingAttendance)
class LiveStreamingAttendanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'live_streaming', 'join_time', 'leave_time', 'duration')
    list_filter = ('join_time',)
    search_fields = ('user__username', 'live_streaming__title')
    date_hierarchy = 'join_time'
