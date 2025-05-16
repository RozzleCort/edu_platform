from rest_framework import serializers
from .models import Video, LiveStreaming, VideoWatchHistory, LiveStreamingAttendance
from courses.serializers import LessonSerializer
from accounts.serializers import UserSerializer

class VideoSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)
    
    class Meta:
        model = Video
        fields = ['id', 'lesson', 'title', 'file', 'thumbnail', 'duration', 
                 'status', 'is_downloadable', 'upload_date']
        read_only_fields = ['status', 'upload_date']

class VideoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['lesson', 'title', 'file', 'thumbnail', 'duration', 'is_downloadable']
        
    def validate_lesson(self, value):
        """确保用户是课程的创建者"""
        user = self.context['request'].user
        if value.section.course.instructor != user and not user.is_staff:
            raise serializers.ValidationError("您没有权限为此课时添加视频")
        return value

class LiveStreamingSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)
    
    class Meta:
        model = LiveStreaming
        fields = ['id', 'lesson', 'title', 'description', 'scheduled_start_time', 
                 'scheduled_end_time', 'actual_start_time', 'actual_end_time', 
                 'status', 'stream_url']
        read_only_fields = ['actual_start_time', 'actual_end_time', 'stream_key']

class LiveStreamingCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveStreaming
        fields = ['lesson', 'title', 'description', 'scheduled_start_time', 
                 'scheduled_end_time', 'status']
                 
    def validate_lesson(self, value):
        """确保用户是课程的创建者"""
        user = self.context['request'].user
        if value.section.course.instructor != user and not user.is_staff:
            raise serializers.ValidationError("您没有权限为此课时创建直播")
        return value

class VideoWatchHistorySerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = VideoWatchHistory
        fields = ['id', 'user', 'video', 'watched_duration', 'last_position', 
                 'completed', 'watch_date']
        read_only_fields = ['watch_date']

class VideoWatchHistoryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoWatchHistory
        fields = ['watched_duration', 'last_position', 'completed']

class LiveStreamingAttendanceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    live_streaming = LiveStreamingSerializer(read_only=True)
    
    class Meta:
        model = LiveStreamingAttendance
        fields = ['id', 'user', 'live_streaming', 'join_time', 'leave_time', 'duration']
        read_only_fields = ['join_time'] 