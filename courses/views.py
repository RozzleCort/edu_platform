from django.shortcuts import render
from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from .models import Category, Course, Section, Lesson, Enrollment, LessonProgress, CourseRating
from .serializers import (
    CategorySerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    SectionSerializer,
    SectionCreateUpdateSerializer,
    LessonSerializer,
    LessonCreateUpdateSerializer,
    EnrollmentSerializer,
    LessonProgressSerializer,
    CourseRatingSerializer
)
from comments.models import Comment
from comments.serializers import CommentSerializer, CommentCreateSerializer

class IsInstructorOrReadOnly(permissions.BasePermission):
    """自定义权限：只允许课程创建者编辑"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 课程创建者或管理员可以编辑
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user or request.user.is_staff
        elif hasattr(obj, 'course'):
            return obj.course.instructor == request.user or request.user.is_staff
        elif hasattr(obj, 'section') and hasattr(obj.section, 'course'):
            return obj.section.course.instructor == request.user or request.user.is_staff
        return False

class CategoryViewSet(viewsets.ModelViewSet):
    """课程分类视图集"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

class CourseViewSet(viewsets.ModelViewSet):
    """课程视图集"""
    queryset = Course.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'price']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Course.objects.all()
        user = self.request.user
        
        # 判断是否是详情页面的请求（通过URL中是否有pk参数判断）
        is_detail_request = self.kwargs.get('pk') is not None
        
        # 教师可以看到自己的所有课程，即使是草稿状态
        if user.is_authenticated and user.user_type == 'teacher' and not user.is_staff:
            if is_detail_request:
                # 如果是获取单个课程详情，允许教师查看任何状态的自己的课程
                course_id = self.kwargs.get('pk')
                # 先尝试看是否是教师自己的课程
                teacher_course = queryset.filter(instructor=user, id=course_id).first()
                if teacher_course:
                    return Course.objects.filter(id=course_id)
                # 如果不是自己的课程，则只能看已发布的
                return queryset.filter(status='published')
            else:
                # 如果是列表请求，根据是否有特定参数决定返回自己的课程还是已发布课程
                instructor_param = self.request.query_params.get('instructor', None)
                # 处理instructor_param可能为'true'的情况，表示获取当前教师的课程
                if instructor_param == 'true' or (instructor_param and instructor_param.isdigit() and int(instructor_param) == user.id):
                    # 如果明确要求查看自己的课程，则返回所有自己的课程
                    return queryset.filter(instructor=user)
                # 默认只显示已发布课程
                return queryset.filter(status='published')
        
        # 管理员可以看到所有课程
        if user.is_authenticated and user.is_staff:
            return queryset
        
        # 未登录用户或学生只能看到已发布课程
        return queryset.filter(status='published')
        
        # 根据分类过滤
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__id=category)
        
        # 根据讲师过滤
        instructor = self.request.query_params.get('instructor', None)
        if instructor:
            queryset = queryset.filter(instructor__id=instructor)
            
        # 根据价格过滤
        is_free = self.request.query_params.get('is_free', None)
        if is_free is not None:
            is_free = is_free.lower() == 'true'
            queryset = queryset.filter(is_free=is_free)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CourseCreateUpdateSerializer
        return CourseDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        """报名课程"""
        course = self.get_object()
        user = request.user
        
        # 检查是否已报名
        if Enrollment.objects.filter(student=user, course=course).exists():
            return Response({"detail": "您已经报名了此课程"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 如果是付费课程，这里应该有支付逻辑
        if not course.is_free and course.price > 0:
            return Response({"detail": "此课程需要付费，请先购买"}, status=status.HTTP_402_PAYMENT_REQUIRED)
        
        # 创建报名记录
        enrollment = Enrollment.objects.create(
            student=user,
            course=course,
            status='active'
        )
        
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_progress(self, request, pk=None):
        """获取当前用户在本课程的学习进度"""
        course = self.get_object()
        user = request.user
        
        # 检查是否已报名
        try:
            enrollment = Enrollment.objects.get(student=user, course=course)
        except Enrollment.DoesNotExist:
            return Response({"detail": "您还未报名此课程"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 获取所有课时进度
        progress_list = LessonProgress.objects.filter(enrollment=enrollment)
        
        # 计算总进度
        total_lessons = Lesson.objects.filter(section__course=course).count()
        completed_lessons = progress_list.filter(status='completed').count()
        
        if total_lessons > 0:
            overall_progress = (completed_lessons / total_lessons) * 100
        else:
            overall_progress = 0
        
        # 获取最近学习的课时
        last_accessed = progress_list.order_by('-last_accessed').first()
        
        data = {
            'enrollment': EnrollmentSerializer(enrollment).data,
            'progress': LessonProgressSerializer(progress_list, many=True).data,
            'overall_progress': overall_progress,
            'completed_lessons': completed_lessons,
            'total_lessons': total_lessons,
            'last_accessed_lesson': LessonSerializer(last_accessed.lesson).data if last_accessed else None
        }
        
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def teacher_courses(self, request):
        """获取当前教师创建的所有课程"""
        user = request.user
        
        # 检查是否为教师
        if user.user_type != 'teacher':
            return Response({"detail": "只有教师可以访问此接口"}, status=status.HTTP_403_FORBIDDEN)
        
        # 获取该教师创建的所有课程
        courses = Course.objects.filter(instructor=user)
        
        # 使用CourseListSerializer序列化
        serializer = CourseListSerializer(courses, many=True, context={'request': request})
        
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """删除课程，确保只有课程创建者或管理员可以删除"""
        instance = self.get_object()
        
        # 检查是否为课程创建者或管理员
        if instance.instructor != request.user and not request.user.is_staff:
            return Response(
                {"detail": "您没有权限删除此课程"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # 如果有学生报名，可能需要额外处理，比如给学生发送通知等
        enrolled_count = instance.enrollments.count()
        if enrolled_count > 0:
            # 记录日志，可以根据需要发送通知等
            print(f"警告：删除的课程 '{instance.title}' 有 {enrolled_count} 名学生报名")
            
        # 执行删除
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        """获取课程详情，包括评分信息"""
        instance = self.get_object()
        # 不需要赋值，average_rating是一个property，会在序列化时自动调用
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """对课程进行评分"""
        course = self.get_object()
        user = request.user
        
        # 检查用户是否已报名此课程
        if not Enrollment.objects.filter(student=user, course=course).exists():
            return Response({"detail": "您需要先报名此课程才能评分"}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # 验证评分
        serializer = CourseRatingSerializer(data={'course': course.id, 'score': request.data.get('score')},
                                           context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def ratings(self, request, pk=None):
        """获取课程的所有评分"""
        course = self.get_object()
        ratings = CourseRating.objects.filter(course=course)
        page = self.paginate_queryset(ratings)
        if page is not None:
            serializer = CourseRatingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = CourseRatingSerializer(ratings, many=True)
        return Response(serializer.data)
        
    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        """获取或添加课程评论"""
        course = self.get_object()
        
        if request.method == 'GET':
            # 获取课程的ContentType
            content_type = ContentType.objects.get_for_model(Course)
            # 查询与当前课程相关的评论
            comments = Comment.objects.filter(
                content_type=content_type,
                object_id=course.id,
                parent=None,  # 只获取顶级评论，不包括回复
                is_public=True,
                is_removed=False
            ).select_related('user').prefetch_related('likes', 'replies')
            
            page = self.paginate_queryset(comments)
            if page is not None:
                serializer = CommentSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            serializer = CommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # 检查用户是否已报名此课程
            if not Enrollment.objects.filter(student=request.user, course=course).exists() and not course.instructor == request.user:
                return Response({"detail": "您需要先报名此课程才能评论"}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            # 创建评论
            data = {
                'content': request.data.get('content'),
                'content_type_name': 'courses.course',
                'object_id': course.id,
                'parent': request.data.get('parent')
            }
            serializer = CommentCreateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                comment = serializer.save()
                return Response(CommentSerializer(comment, context={'request': request}).data, 
                                status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SectionViewSet(viewsets.ModelViewSet):
    """章节视图集"""
    queryset = Section.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SectionCreateUpdateSerializer
        return SectionSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

class LessonViewSet(viewsets.ModelViewSet):
    """课时视图集"""
    queryset = Lesson.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LessonCreateUpdateSerializer
        return LessonSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_progress(self, request, pk=None):
        """更新课时学习进度"""
        lesson = self.get_object()
        user = request.user
        
        # 检查是否已报名课程
        try:
            enrollment = Enrollment.objects.get(student=user, course=lesson.section.course)
        except Enrollment.DoesNotExist:
            return Response({"detail": "您还未报名此课程"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 获取或创建进度记录
        progress, created = LessonProgress.objects.get_or_create(
            enrollment=enrollment,
            lesson=lesson,
            defaults={
                'status': 'not_started',
                'progress_percent': 0,
                'last_position': 0
            }
        )
        
        # 更新进度
        progress_percent = request.data.get('progress_percent', progress.progress_percent)
        last_position = request.data.get('last_position', progress.last_position)
        
        progress.progress_percent = progress_percent
        progress.last_position = last_position
        
        # 如果进度达到95%以上，标记为已完成
        if progress_percent >= 95:
            progress.status = 'completed'
        else:
            progress.status = 'in_progress'
            
        progress.save()
        
        # 检查是否所有课时都已完成，如果是，则更新报名状态为已完成
        total_lessons = Lesson.objects.filter(section__course=lesson.section.course).count()
        completed_lessons = LessonProgress.objects.filter(
            enrollment=enrollment,
            status='completed'
        ).count()
        
        if total_lessons > 0 and completed_lessons == total_lessons:
            enrollment.status = 'completed'
            enrollment.completed_at = timezone.now()
            enrollment.save()
        
        return Response(LessonProgressSerializer(progress).data)

class EnrollmentViewSet(viewsets.ModelViewSet):
    """报名视图集"""
    serializer_class = EnrollmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        # 学生只能查看自己的报名记录，教师可以查看自己课程的报名记录
        if user.user_type == 'student':
            return Enrollment.objects.filter(student=user)
        elif user.user_type == 'teacher':
            return Enrollment.objects.filter(course__instructor=user)
        # 管理员可以查看所有记录
        return Enrollment.objects.all()
    
    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
