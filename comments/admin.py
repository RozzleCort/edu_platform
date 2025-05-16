from django.contrib import admin
from .models import Comment, CommentLike, Notification

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_type', 'object_id', 'parent', 'is_public', 'is_removed', 'created_at')
    list_filter = ('is_public', 'is_removed', 'created_at')
    search_fields = ('user__username', 'content')
    date_hierarchy = 'created_at'

@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'comment', 'created_at')
    search_fields = ('user__username', 'comment__content')
    date_hierarchy = 'created_at'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'sender', 'notification_type', 'content_type', 'object_id', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'sender__username', 'message')
    date_hierarchy = 'created_at'
