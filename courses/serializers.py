from rest_framework import serializers
from .models import Category, Course, Section, Lesson, Enrollment, LessonProgress, CourseRating
from accounts.serializers import UserSerializer
from django.contrib.contenttypes.models import ContentType
from comments.models import Comment
from comments.serializers import CommentSerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'section', 'title', 'lesson_type', 'content', 'duration', 'order', 'is_free_preview']

class SectionSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'course', 'title', 'description', 'order', 'lessons']

class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ['id', 'enrollment', 'lesson', 'status', 'progress_percent', 'last_position', 'last_accessed']

class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'status', 'enrolled_at', 'completed_at']
        read_only_fields = ['enrolled_at', 'completed_at']

class CourseListSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'slug', 'instructor', 'category', 'cover_image', 
                  'description', 'price', 'is_free', 'status', 'created_at', 'students_count']
    
    def get_students_count(self, obj):
        return obj.students.count()

class CourseRatingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CourseRating
        fields = ['id', 'user', 'course', 'score', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        # 检查用户是否已经评分过这个课程
        user = validated_data['user']
        course = validated_data['course']
        
        # 如果已经存在评分，则更新而不是创建新的
        try:
            rating = CourseRating.objects.get(user=user, course=course)
            rating.score = validated_data['score']
            rating.save()
            return rating
        except CourseRating.DoesNotExist:
            return super().create(validated_data)

class CourseDetailSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    sections = SectionSerializer(many=True, read_only=True)
    students_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    ratings_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'slug', 'instructor', 'category', 'cover_image', 
                  'video_url', 'description', 'learning_objectives', 'prerequisites', 
                  'price', 'is_free', 'status', 'created_at', 'updated_at',
                  'sections', 'students_count', 'is_enrolled', 'average_rating',
                  'ratings_count', 'user_rating', 'comments']
    
    def get_students_count(self, obj):
        return obj.students.count()
    
    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False
    
    def get_ratings_count(self, obj):
        return obj.ratings.count()
    
    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                rating = CourseRating.objects.get(user=request.user, course=obj)
                return CourseRatingSerializer(rating).data
            except CourseRating.DoesNotExist:
                return None
        return None
        
    def get_comments(self, obj):
        """获取课程的评论"""
        # 获取当前课程的ContentType
        content_type = ContentType.objects.get_for_model(Course)
        # 查询与当前课程相关的评论
        comments = Comment.objects.filter(
            content_type=content_type,
            object_id=obj.id,
            parent=None,  # 只获取顶级评论，不包括回复
            is_public=True,
            is_removed=False
        ).select_related('user').prefetch_related('likes', 'replies')[:10]  # 限制最多返回10条评论
        
        return CommentSerializer(comments, many=True, context=self.context).data

class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    slug = serializers.SlugField(required=False, allow_blank=True)
    
    class Meta:
        model = Course
        fields = ['title', 'slug', 'category', 'cover_image', 'video_url', 'description', 
                  'learning_objectives', 'prerequisites', 'price', 'is_free', 'status']
    
    def validate_slug(self, value):
        """验证slug的唯一性"""
        # 如果没有提供slug，直接返回空值
        if not value:
            return value
            
        instance = self.instance
        if value and Course.objects.filter(slug=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("此URL别名已被使用")
        return value
    
    def validate(self, data):
        """自动生成slug（如果没有提供）"""
        # 如果没有提供slug，则自动从标题生成
        if 'slug' not in data or not data['slug']:
            title = data.get('title', '')
            if title:
                import re
                from django.utils.text import slugify
                # 先使用django的slugify处理标题
                slug = slugify(title)
                # 如果生成的slug为空（全是非拉丁字符），则使用标题拼音的首字母
                if not slug:
                    try:
                        from pypinyin import lazy_pinyin
                        slug = ''.join(lazy_pinyin(title, style=0))
                    except ImportError:
                        # 如果没有安装pypinyin，则使用标题的哈希值
                        import hashlib
                        slug = hashlib.md5(title.encode()).hexdigest()[:10]
                
                # 确保slug的唯一性
                original_slug = slug
                counter = 1
                instance_id = self.instance.id if self.instance else None
                while Course.objects.filter(slug=slug).exclude(id=instance_id).exists():
                    slug = f"{original_slug}-{counter}"
                    counter += 1
                
                data['slug'] = slug
        
        return data
    
    def create(self, validated_data):
        validated_data['instructor'] = self.context['request'].user
        return super().create(validated_data)

class SectionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['course', 'title', 'description', 'order']
    
    def validate_course(self, value):
        """确保用户是课程的创建者"""
        user = self.context['request'].user
        if value.instructor != user and not user.is_staff:
            raise serializers.ValidationError("您没有权限为此课程添加章节")
        return value

class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['section', 'title', 'lesson_type', 'content', 'duration', 'order', 'is_free_preview']
    
    def validate_section(self, value):
        """确保用户是课程的创建者"""
        user = self.context['request'].user
        if value.course.instructor != user and not user.is_staff:
            raise serializers.ValidationError("您没有权限为此章节添加课时")
        return value 