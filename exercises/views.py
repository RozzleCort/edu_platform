from django.shortcuts import render
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Avg, Count, Q
from courses.views import IsInstructorOrReadOnly
from .models import Quiz, Question, Choice, QuizAttempt, Answer
from .serializers import (
    QuizSerializer,
    TeacherQuizSerializer,
    QuizCreateUpdateSerializer,
    QuestionSerializer,
    TeacherQuestionSerializer,
    QuestionCreateUpdateSerializer,
    ChoiceSerializer,
    TeacherChoiceSerializer,
    ChoiceCreateUpdateSerializer,
    QuizAttemptSerializer,
    QuizAttemptCreateSerializer,
    AnswerSerializer,
    AnswerCreateUpdateSerializer
)

class IsInstructorOrReadOnly(permissions.BasePermission):
    """自定义权限：只允许课程创建者编辑"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 处理Quiz对象
        if hasattr(obj, 'lesson'):
            if obj.lesson is None:
                # 如果测验没有关联课时，检查创建者权限
                return obj.instructor == request.user or request.user.is_staff
            # 有关联课时，检查课时所属课程创建者权限
            return obj.lesson.section.course.instructor == request.user or request.user.is_staff
        
        # 处理Question或Choice对象
        elif hasattr(obj, 'quiz') and hasattr(obj.quiz, 'lesson'):
            if obj.quiz.lesson is None:
                # 如果测验没有关联课时，检查创建者权限
                return obj.quiz.instructor == request.user or request.user.is_staff
            # 有关联课时，检查课时所属课程创建者权限
            return obj.quiz.lesson.section.course.instructor == request.user or request.user.is_staff
        
        return False

class QuizViewSet(viewsets.ModelViewSet):
    """测验视图集"""
    queryset = Quiz.objects.all()
    
    def get_queryset(self):
        """
        重写查询集方法，实现：
        - 教师只能看到自己创建的测验
        - 管理员可以看到所有测验
        - 学生可以看到自己有权限访问的测验
        """
        user = self.request.user
        if not user.is_authenticated:
            return Quiz.objects.none()
            
        if user.is_staff:
            return Quiz.objects.all()
            
        if user.user_type == 'teacher':
            # 返回教师创建的测验或与教师相关课程关联的测验
            return Quiz.objects.filter(
                Q(instructor=user) | 
                Q(lesson__section__course__instructor=user)
            ).distinct()
            
        # 学生只能看到已报名课程的测验
        enrolled_courses = user.enrolled_courses.all()
        return Quiz.objects.filter(
            Q(lesson__section__course__in=enrolled_courses)
        ).distinct()
    
    def get_serializer_class(self):
        user = self.request.user
        if self.action in ['create', 'update', 'partial_update']:
            return QuizCreateUpdateSerializer
        
        # 教师和管理员可以看到完整信息
        if user.is_authenticated and (user.user_type == 'teacher' or user.is_staff):
            return TeacherQuizSerializer
        return QuizSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """创建测验时设置instructor为当前用户"""
        serializer.save(instructor=self.request.user)
    
    def retrieve(self, request, *args, **kwargs):
        """获取测验详情，支持include_questions和detailed参数"""
        instance = self.get_object()
        
        # 获取查询参数
        include_questions = request.query_params.get('include_questions', '').lower() == 'true'
        detailed = request.query_params.get('detailed', '').lower() == 'true'
        
        # 使用合适的序列化器
        serializer_class = self.get_serializer_class()
        
        # 如果需要包含问题，确保问题包含在序列化结果中
        if include_questions:
            # 预加载问题和选项以提高性能
            queryset = Quiz.objects.filter(pk=instance.pk).prefetch_related(
                'questions', 
                'questions__choices'
            )
            if queryset.exists():
                instance = queryset.first()
        
        # 序列化数据
        serializer = serializer_class(instance, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_attempt(self, request, pk=None):
        """开始测验尝试"""
        quiz = self.get_object()
        
        serializer = QuizAttemptCreateSerializer(data={'quiz': quiz.id}, context={'request': request})
        if serializer.is_valid():
            quiz_attempt = serializer.save()
            return Response(QuizAttemptSerializer(quiz_attempt).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[IsInstructorOrReadOnly])
    def statistics(self, request, pk=None):
        """获取测验统计数据"""
        quiz = self.get_object()
        
        # 获取测验所有的尝试记录
        quiz_attempts = QuizAttempt.objects.filter(quiz=quiz)
        
        # 基本统计数据
        total_attempts = quiz_attempts.count()
        completed_attempts = quiz_attempts.filter(status='completed').count()
        passed_attempts = quiz_attempts.filter(passed=True).count()
        avg_score = quiz_attempts.filter(status='completed').aggregate(avg_score=Avg('score'))['avg_score'] or 0
        
        # 各得分段人数
        score_ranges = {
            '0-20': quiz_attempts.filter(score__gte=0, score__lt=20).count(),
            '20-40': quiz_attempts.filter(score__gte=20, score__lt=40).count(),
            '40-60': quiz_attempts.filter(score__gte=40, score__lt=60).count(),
            '60-80': quiz_attempts.filter(score__gte=60, score__lt=80).count(),
            '80-100': quiz_attempts.filter(score__gte=80, score__lte=100).count(),
        }
        
        # 每个问题的答对率
        questions = Question.objects.filter(quiz=quiz).order_by('order')
        question_stats = []
        
        for question in questions:
            answers = Answer.objects.filter(question=question, quiz_attempt__status='completed')
            total_answers = answers.count()
            correct_answers = answers.filter(is_correct=True).count()
            correct_rate = (correct_answers / total_answers * 100) if total_answers > 0 else 0
            
            # 针对选择题，计算各选项的选择率
            choice_stats = []
            if question.question_type in ['single_choice', 'multiple_choice', 'true_false']:
                choices = Choice.objects.filter(question=question)
                for choice in choices:
                    choice_selections = answers.filter(selected_choices=choice).count()
                    selection_rate = (choice_selections / total_answers * 100) if total_answers > 0 else 0
                    
                    choice_stats.append({
                        'id': choice.id,
                        'text': choice.choice_text,
                        'is_correct': choice.is_correct,
                        'selection_count': choice_selections,
                        'selection_rate': selection_rate
                    })
            
            question_stats.append({
                'id': question.id,
                'text': question.question_text,
                'type': question.question_type,
                'points': question.points,
                'total_answers': total_answers,
                'correct_answers': correct_answers,
                'correct_rate': correct_rate,
                'choices': choice_stats
            })
        
        # 完成测验的平均时间(秒)
        completed_attempts_with_times = quiz_attempts.filter(
            status='completed', 
            start_time__isnull=False, 
            end_time__isnull=False
        )
        
        from django.db.models import F, ExpressionWrapper, fields
        average_completion_time = completed_attempts_with_times.annotate(
            completion_time=ExpressionWrapper(
                F('end_time') - F('start_time'),
                output_field=fields.DurationField()
            )
        ).aggregate(avg_time=Avg('completion_time'))['avg_time']
        
        avg_completion_seconds = 0
        if average_completion_time:
            avg_completion_seconds = average_completion_time.total_seconds()
        
        # 响应数据
        statistics = {
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'total_attempts': total_attempts,
            'completed_attempts': completed_attempts,
            'passed_attempts': passed_attempts,
            'pass_rate': (passed_attempts / completed_attempts * 100) if completed_attempts > 0 else 0,
            'average_score': round(avg_score, 2),
            'score_distribution': score_ranges,
            'average_completion_time': avg_completion_seconds,
            'questions': question_stats
        }
        
        return Response(statistics)

class QuestionViewSet(viewsets.ModelViewSet):
    """问题视图集"""
    queryset = Question.objects.all()
    
    def get_serializer_class(self):
        user = self.request.user
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateUpdateSerializer
        
        # 教师和管理员可以看到完整信息
        if user.is_authenticated and (user.user_type == 'teacher' or user.is_staff):
            return TeacherQuestionSerializer
        return QuestionSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

class ChoiceViewSet(viewsets.ModelViewSet):
    """选项视图集"""
    queryset = Choice.objects.all()
    
    def get_serializer_class(self):
        user = self.request.user
        if self.action in ['create', 'update', 'partial_update']:
            return ChoiceCreateUpdateSerializer
        
        # 教师和管理员可以看到完整信息
        if user.is_authenticated and (user.user_type == 'teacher' or user.is_staff):
            return TeacherChoiceSerializer
        return ChoiceSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

class QuizAttemptViewSet(viewsets.ModelViewSet):
    """测验尝试视图集"""
    serializer_class = QuizAttemptSerializer
    
    def get_queryset(self):
        user = self.request.user
        # 学生只能查看自己的测验尝试
        if user.user_type == 'student':
            return QuizAttempt.objects.filter(user=user)
        # 教师可以查看自己课程的测验尝试以及自己创建的不关联课时的测验
        elif user.user_type == 'teacher':
            return QuizAttempt.objects.filter(
                Q(quiz__lesson__section__course__instructor=user) |  # 关联课时的测验
                Q(quiz__instructor=user, quiz__lesson__isnull=True)   # 不关联课时的测验
            )
        # 管理员可以查看所有记录
        return QuizAttempt.objects.all()
    
    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def student_performance(self, request):
        """获取学生测验表现"""
        user = request.user
        
        # 验证用户是学生
        if user.user_type != 'student':
            return Response({"detail": "只有学生可以查看自己的测验表现"}, status=status.HTTP_403_FORBIDDEN)
            
        # 获取学生的所有测验尝试
        attempts = QuizAttempt.objects.filter(user=user, status='completed')
        
        # 计算统计数据
        total_quizzes = attempts.values('quiz').distinct().count()
        total_attempts = attempts.count()
        passed_quizzes = attempts.filter(passed=True).values('quiz').distinct().count()
        average_score = attempts.aggregate(avg_score=Avg('score'))['avg_score'] or 0
        
        # 计算最近5次测验表现趋势
        recent_attempts = attempts.order_by('-end_time')[:5]
        trend_data = []
        
        for attempt in recent_attempts:
            trend_data.append({
                'quiz_title': attempt.quiz.title,
                'score': attempt.score,
                'date': attempt.end_time,
                'passed': attempt.passed
            })
        
        # 各科目测验表现
        courses_performance = []
        from django.db.models import Count, Avg
        
        course_stats = attempts.values(
            'quiz__lesson__section__course__id',
            'quiz__lesson__section__course__title'
        ).annotate(
            total=Count('id'),
            avg_score=Avg('score'),
            passed=Count('id', filter=models.Q(passed=True))
        ).order_by('quiz__lesson__section__course__id')
        
        for stat in course_stats:
            courses_performance.append({
                'course_id': stat['quiz__lesson__section__course__id'],
                'course_title': stat['quiz__lesson__section__course__title'],
                'total_attempts': stat['total'],
                'average_score': round(stat['avg_score'], 2),
                'passed_attempts': stat['passed'],
                'pass_rate': round((stat['passed'] / stat['total'] * 100), 2) if stat['total'] > 0 else 0
            })
        
        performance_data = {
            'total_quizzes': total_quizzes,
            'total_attempts': total_attempts,
            'passed_quizzes': passed_quizzes,
            'average_score': round(average_score, 2),
            'pass_rate': round((passed_quizzes / total_quizzes * 100), 2) if total_quizzes > 0 else 0,
            'recent_trend': trend_data,
            'courses_performance': courses_performance
        }
        
        return Response(performance_data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        """提交测验"""
        quiz_attempt = self.get_object()
        user = request.user
        
        # 验证用户身份
        if quiz_attempt.user != user:
            return Response({"detail": "您无权提交此测验"}, status=status.HTTP_403_FORBIDDEN)
        
        # 验证测验状态
        if quiz_attempt.status != 'in_progress':
            return Response({"detail": "此测验已经提交或超时"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 更新测验状态
        quiz_attempt.status = 'completed'
        quiz_attempt.end_time = timezone.now()
        
        # 计算总分
        total_score = Answer.objects.filter(quiz_attempt=quiz_attempt).aggregate(Sum('score'))['score__sum'] or 0
        quiz_attempt.score = total_score
        
        # 判断是否通过
        quiz_attempt.passed = total_score >= quiz_attempt.quiz.pass_score
        quiz_attempt.save()
        
        return Response(QuizAttemptSerializer(quiz_attempt).data)

class AnswerViewSet(viewsets.ModelViewSet):
    """答案视图集"""
    serializer_class = AnswerSerializer
    
    def get_queryset(self):
        user = self.request.user
        # 学生只能查看自己的答案
        if user.user_type == 'student':
            return Answer.objects.filter(quiz_attempt__user=user)
        # 教师可以查看自己课程的答案
        elif user.user_type == 'teacher':
            return Answer.objects.filter(quiz_attempt__quiz__lesson__section__course__instructor=user)
        # 管理员可以查看所有记录
        return Answer.objects.all()
    
    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AnswerCreateUpdateSerializer
        return AnswerSerializer
    
    def create(self, request, *args, **kwargs):
        """提交答案"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quiz_attempt = serializer.validated_data.get('quiz_attempt')
        user = request.user
        
        # 验证用户身份
        if quiz_attempt.user != user:
            return Response({"detail": "您无权为此测验提交答案"}, status=status.HTTP_403_FORBIDDEN)
        
        # 验证测验状态
        if quiz_attempt.status != 'in_progress':
            return Response({"detail": "此测验已经提交或超时"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查是否已回答过这个问题
        question = serializer.validated_data.get('question')
        if Answer.objects.filter(quiz_attempt=quiz_attempt, question=question).exists():
            return Response({"detail": "您已经回答过这个问题"}, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def grade_short_answer(self, request):
        """为简答题评分（教师操作）"""
        answer_id = request.data.get('answer_id')
        score = request.data.get('score')
        feedback = request.data.get('feedback')
        
        if not answer_id or score is None:
            return Response({"detail": "需要提供answer_id和score"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            answer = Answer.objects.get(id=answer_id)
        except Answer.DoesNotExist:
            return Response({"detail": "找不到指定的答案"}, status=status.HTTP_404_NOT_FOUND)
        
        # 验证权限
        user = request.user
        if answer.quiz_attempt.quiz.lesson.section.course.instructor != user and not user.is_staff:
            return Response({"detail": "您无权为此答案评分"}, status=status.HTTP_403_FORBIDDEN)
        
        # 仅简答题需要手动评分
        if answer.question.question_type != 'short_answer':
            return Response({"detail": "只有简答题需要手动评分"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 更新评分
        answer.score = min(max(0, float(score)), answer.question.points)  # 确保分数在有效范围内
        answer.is_correct = answer.score >= answer.question.points * 0.5  # 超过50%算对
        if feedback:
            answer.feedback = feedback
        answer.save()
        
        # 更新测验尝试的总分
        quiz_attempt = answer.quiz_attempt
        if quiz_attempt.status == 'completed':
            total_score = Answer.objects.filter(quiz_attempt=quiz_attempt).aggregate(Sum('score'))['score__sum'] or 0
            quiz_attempt.score = total_score
            quiz_attempt.passed = total_score >= quiz_attempt.quiz.pass_score
            quiz_attempt.save()
        
        return Response(AnswerSerializer(answer).data)
