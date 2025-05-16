from rest_framework import serializers
from .models import LiveEvent, LiveEnrollment, LiveChat
from accounts.serializers import UserSerializer

class LiveChatSerializer(serializers.ModelSerializer):
    """直播聊天序列化器"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = LiveChat
        fields = ['id', 'live_event', 'user', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']

class LiveEnrollmentSerializer(serializers.ModelSerializer):
    """直播报名序列化器"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = LiveEnrollment
        fields = ['id', 'user', 'live_event', 'enrolled_at', 'attended']
        read_only_fields = ['id', 'enrolled_at']

class LiveEventSerializer(serializers.ModelSerializer):
    """直播活动序列化器"""
    instructor = UserSerializer(read_only=True)
    enrollments_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    
    class Meta:
        model = LiveEvent
        fields = [
            'id', 'title', 'description', 'instructor', 'course',
            'scheduled_start_time', 'scheduled_end_time',
            'actual_start_time', 'actual_end_time', 'status',
            'play_url', 'viewer_count', 'max_viewer_count',
            'created_at', 'updated_at', 'enrollments_count', 'is_enrolled',
            'pre_recorded_video_url'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'viewer_count', 'max_viewer_count']
    
    def get_enrollments_count(self, obj):
        return obj.enrollments.count()
    
    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(user=request.user).exists()
        return False

class LiveEventCreateSerializer(serializers.ModelSerializer):
    """直播活动创建序列化器"""
    class Meta:
        model = LiveEvent
        fields = [
            'id', 'title', 'description', 'course',
            'scheduled_start_time', 'scheduled_end_time',
            'status', 'stream_key', 'rtmp_url', 'play_url',
            'pre_recorded_video_url'
        ]
        read_only_fields = ['id', 'stream_key', 'rtmp_url', 'play_url']
    
    def validate(self, data):
        """验证直播数据"""
        print("验证直播数据:", data)
        
        # 验证开始时间和结束时间
        start_time = data.get('scheduled_start_time')
        end_time = data.get('scheduled_end_time')
        
        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError({"scheduled_end_time": "结束时间必须晚于开始时间"})
        
        # 验证课程是否存在
        course = data.get('course')
        if course:
            print(f"验证课程: {course}, 类型: {type(course)}")
            from courses.models import Course
            try:
                # 如果传入的是ID（整数）
                if isinstance(course, int):
                    course_obj = Course.objects.get(id=course)
                    print(f"找到关联课程: {course_obj.id} - {course_obj.title}")
                # 如果传入的是课程对象
                elif hasattr(course, 'id'):
                    course_obj = Course.objects.get(id=course.id)
                    print(f"找到关联课程(对象): {course_obj.id} - {course_obj.title}")
                else:
                    raise serializers.ValidationError({"course": f"无效的课程格式: {course}"})
            except Course.DoesNotExist:
                course_id = course if isinstance(course, int) else getattr(course, 'id', course)
                raise serializers.ValidationError({"course": f"ID为{course_id}的课程不存在"})
        
        return data
    
    def create(self, validated_data):
        print("创建直播 - 验证后数据:", validated_data)
        # 自动设置讲师为当前用户
        validated_data['instructor'] = self.context['request'].user
        return super().create(validated_data) 