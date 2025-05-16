from rest_framework import serializers
from .models import Quiz, Question, Choice, QuizAttempt, Answer
from courses.serializers import LessonSerializer
from accounts.serializers import UserSerializer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'question', 'choice_text', 'is_correct']
        read_only_fields = ['is_correct']  # 对学生隐藏正确答案

class TeacherChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'question', 'choice_text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'question_text', 'question_type', 'points', 'order', 'choices']
        read_only_fields = ['explanation']  # 对学生隐藏解释

class TeacherQuestionSerializer(serializers.ModelSerializer):
    choices = TeacherChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'question_text', 'question_type', 'points', 'explanation', 'order', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'description', 'time_limit', 'pass_score',
                 'allow_multiple_attempts', 'max_attempts', 'randomize_questions',
                 'show_correct_answers', 'created_at', 'updated_at', 'questions']

class TeacherQuizSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)
    questions = TeacherQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'description', 'time_limit', 'pass_score',
                 'allow_multiple_attempts', 'max_attempts', 'randomize_questions',
                 'show_correct_answers', 'created_at', 'updated_at', 'questions']

class QuizCreateUpdateSerializer(serializers.ModelSerializer):
    # 添加一个嵌套的questions字段
    questions = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    
    class Meta:
        model = Quiz
        fields = ['lesson', 'title', 'description', 'time_limit', 'pass_score',
                 'allow_multiple_attempts', 'max_attempts', 'randomize_questions',
                 'show_correct_answers', 'questions']
        
    def validate_lesson(self, value):
        """确保用户是课程的创建者"""
        if value is None:  # 如果没有选择课时，则不需要验证
            return value
            
        user = self.context['request'].user
        if value.section.course.instructor != user and not user.is_staff:
            raise serializers.ValidationError("您没有权限为此课时创建测验")
        return value
        
    def create(self, validated_data):
        """创建测验及其关联的问题和选项"""
        # 提取questions数据
        questions_data = validated_data.pop('questions', [])
        
        # 添加创建者
        validated_data['instructor'] = self.context['request'].user
        
        # 创建测验
        quiz = super().create(validated_data)
        
        # 创建关联的问题和选项
        for question_data in questions_data:
            # 提取choices数据
            choices_data = question_data.pop('choices', [])
            
            # 创建问题
            question = Question.objects.create(
                quiz=quiz,
                **question_data
            )
            
            # 创建选项
            for choice_data in choices_data:
                Choice.objects.create(
                    question=question,
                    **choice_data
                )
        
        return quiz
        
    def update(self, instance, validated_data):
        """更新测验及其关联的问题和选项"""
        # 提取questions数据
        questions_data = validated_data.pop('questions', [])
        
        # 更新测验基本信息
        instance = super().update(instance, validated_data)
        
        # 如果提供了问题数据，则更新问题
        if questions_data:
            # 删除现有问题和选项（级联删除）
            instance.questions.all().delete()
            
            # 创建新问题和选项
            for question_data in questions_data:
                choices_data = question_data.pop('choices', [])
                
                question = Question.objects.create(
                    quiz=instance,
                    **question_data
                )
                
                for choice_data in choices_data:
                    Choice.objects.create(
                        question=question,
                        **choice_data
                    )
                    
        return instance

class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['quiz', 'question_text', 'question_type', 'points', 'explanation', 'order']
        
    def validate_quiz(self, value):
        """确保用户是课程的创建者"""
        user = self.context['request'].user
        
        # 如果Quiz没有关联课时，则检查Quiz的创建者是否是当前用户
        if value.lesson is None:
            if value.instructor != user and not user.is_staff:
                raise serializers.ValidationError("您没有权限为此测验添加问题")
            return value
            
        # 如果Quiz关联了课时，则检查课时所属课程的创建者是否是当前用户
        if value.lesson.section.course.instructor != user and not user.is_staff:
            raise serializers.ValidationError("您没有权限为此测验添加问题")
        return value

class ChoiceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['question', 'choice_text', 'is_correct']
        
    def validate_question(self, value):
        """确保用户是课程的创建者"""
        user = self.context['request'].user
        
        # 处理quiz.lesson为None的情况
        if value.quiz.lesson is None:
            # 如果测验没有关联课时，则检查测验创建者是否是当前用户
            if value.quiz.instructor != user and not user.is_staff:
                raise serializers.ValidationError("您没有权限为此问题添加选项")
            return value
        
        # 正常检查课时所属课程的创建者
        if value.quiz.lesson.section.course.instructor != user and not user.is_staff:
            raise serializers.ValidationError("您没有权限为此问题添加选项")
        return value

class AnswerSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    selected_choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Answer
        fields = ['id', 'quiz_attempt', 'question', 'selected_choices', 'text_answer',
                 'is_correct', 'score', 'feedback']
        read_only_fields = ['is_correct', 'score', 'feedback']

class AnswerCreateUpdateSerializer(serializers.ModelSerializer):
    selected_choice_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Answer
        fields = ['quiz_attempt', 'question', 'text_answer', 'selected_choice_ids']
    
    def validate(self, data):
        """验证答案格式"""
        question = data.get('question')
        selected_choice_ids = data.get('selected_choice_ids', [])
        text_answer = data.get('text_answer', '')
        
        # 根据问题类型验证答案格式
        if question.question_type in ['single_choice', 'multiple_choice', 'true_false']:
            if not selected_choice_ids:
                raise serializers.ValidationError("选择题需要选择选项")
            if question.question_type == 'single_choice' and len(selected_choice_ids) > 1:
                raise serializers.ValidationError("单选题只能选择一个选项")
                
            # 验证选项属于该问题
            for choice_id in selected_choice_ids:
                if not Choice.objects.filter(id=choice_id, question=question).exists():
                    raise serializers.ValidationError(f"选项 {choice_id} 不属于该问题")
                
        elif question.question_type == 'short_answer':
            if not text_answer:
                raise serializers.ValidationError("简答题需要填写答案")
        
        return data
    
    def create(self, validated_data):
        """创建答案"""
        selected_choice_ids = validated_data.pop('selected_choice_ids', [])
        answer = Answer.objects.create(**validated_data)
        
        # 添加选择的选项
        if selected_choice_ids:
            choices = Choice.objects.filter(id__in=selected_choice_ids)
            answer.selected_choices.set(choices)
            
            # 自动评分
            question = answer.question
            if question.question_type in ['single_choice', 'multiple_choice', 'true_false']:
                # 获取正确选项
                correct_choices = set(Choice.objects.filter(question=question, is_correct=True).values_list('id', flat=True))
                selected_choices = set(selected_choice_ids)
                
                if question.question_type == 'single_choice' or question.question_type == 'true_false':
                    # 单选题/判断题，完全匹配才给分
                    is_correct = correct_choices == selected_choices
                    score = question.points if is_correct else 0
                else:
                    # 多选题，部分给分
                    correct_selected = selected_choices.intersection(correct_choices)
                    incorrect_selected = selected_choices - correct_choices
                    
                    # 计算得分，正确选项加分，错误选项减分
                    if correct_choices:
                        correct_percent = len(correct_selected) / len(correct_choices)
                        incorrect_penalty = len(incorrect_selected) / len(correct_choices) if correct_choices else 0
                        score_percent = max(0, correct_percent - incorrect_penalty)
                        score = question.points * score_percent
                    else:
                        score = 0
                    
                    is_correct = score >= question.points * 0.5  # 超过50%算对
                
                answer.is_correct = is_correct
                answer.score = score
                answer.save()
        
        return answer

class QuizAttemptSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    quiz = QuizSerializer(read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ['id', 'user', 'quiz', 'start_time', 'end_time', 'status',
                 'score', 'passed', 'attempt_number', 'answers']

class QuizAttemptCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ['quiz']
        
    def create(self, validated_data):
        user = self.context['request'].user
        quiz = validated_data.get('quiz')
        
        # 处理quiz.lesson为None的情况
        if quiz.lesson is None:
            # 如果测验没有关联课时，则检查测验创建者是否是当前用户或用户是管理员
            if quiz.instructor == user or user.is_staff:
                # 教师或管理员可以直接参加他们创建的测验
                pass
            else:
                # 对于普通学生，检查他们是否有权限参加未关联课时的测验
                # 这里默认任何用户都可以参加无课时关联的测验（可根据需求调整）
                pass
        else:
            # 验证用户是否有权限参加测验（关联了课时的情况）
            course = quiz.lesson.section.course
            if not course.is_free and not course.enrollments.filter(student=user).exists():
                raise serializers.ValidationError("您需要先报名课程才能参加测验")
        
        # 检查测验次数限制
        if quiz.max_attempts > 0:
            attempts_count = QuizAttempt.objects.filter(user=user, quiz=quiz).count()
            if attempts_count >= quiz.max_attempts:
                raise serializers.ValidationError("您已达到测验最大尝试次数")
        
        # 确定当前尝试次数
        attempt_number = QuizAttempt.objects.filter(user=user, quiz=quiz).count() + 1
        
        return QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            status='in_progress',
            attempt_number=attempt_number
        ) 