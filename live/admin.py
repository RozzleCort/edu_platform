from django.contrib import admin
from .models import LiveEvent, LiveEnrollment, LiveChat

@admin.register(LiveEvent)
class LiveEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'course', 'status', 'scheduled_start_time', 'scheduled_end_time')
    list_filter = ('status', 'instructor', 'course')
    search_fields = ('title', 'description', 'instructor__username', 'course__title')
    readonly_fields = ('created_at', 'updated_at', 'viewer_count', 'max_viewer_count')
    date_hierarchy = 'scheduled_start_time'
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'description', 'instructor', 'course')
        }),
        ('时间信息', {
            'fields': ('scheduled_start_time', 'scheduled_end_time', 'actual_start_time', 'actual_end_time')
        }),
        ('状态和配置', {
            'fields': ('status', 'stream_key', 'rtmp_url', 'play_url')
        }),
        ('统计信息', {
            'fields': ('viewer_count', 'max_viewer_count', 'created_at', 'updated_at')
        }),
    )

@admin.register(LiveEnrollment)
class LiveEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'live_event', 'enrolled_at', 'attended')
    list_filter = ('attended', 'live_event')
    search_fields = ('user__username', 'live_event__title')
    readonly_fields = ('enrolled_at',)

@admin.register(LiveChat)
class LiveChatAdmin(admin.ModelAdmin):
    list_display = ('user', 'live_event', 'message', 'created_at')
    list_filter = ('live_event',)
    search_fields = ('user__username', 'message', 'live_event__title')
    readonly_fields = ('created_at',)
