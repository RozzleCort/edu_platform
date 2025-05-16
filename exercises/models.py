from django.db import models
from courses.models import Lesson
from accounts.models import User
from django.conf import settings

class Quiz(models.Model):
    """测验"""
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz', 
                               null=True, blank=True, verbose_name='关联课时')
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_quizzes', 
                               null=True, blank=True, verbose_name='创建者')
    title = models.CharField(max_length=200, verbose_name='测验标题')
    description = models.TextField(blank=True, null=True, verbose_name='测验描述')
    time_limit = models.PositiveIntegerField(default=0, help_text='分钟, 0表示不限时', verbose_name='时间限制')
    pass_score = models.PositiveIntegerField(default=60, verbose_name='及格分数')
    allow_multiple_attempts = models.BooleanField(default=True, verbose_name='允许多次尝试')
    max_attempts = models.PositiveIntegerField(default=3, help_text='0表示不限制次数', verbose_name='最大尝试次数')
    randomize_questions = models.BooleanField(default=False, verbose_name='随机题目顺序')
    show_correct_answers = models.BooleanField(default=True, verbose_name='显示正确答案')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '测验'
        verbose_name_plural = '测验'
    
    def __str__(self):
        return self.title

class Question(models.Model):
    """问题"""
    QUESTION_TYPE_CHOICES = (
        ('single_choice', '单选题'),
        ('multiple_choice', '多选题'),
        ('true_false', '判断题'),
        ('short_answer', '简答题'),
    )
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions', verbose_name='所属测验')
    question_text = models.TextField(verbose_name='问题文本')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, verbose_name='问题类型')
    points = models.PositiveIntegerField(default=1, verbose_name='分值')
    explanation = models.TextField(blank=True, null=True, verbose_name='解释')
    order = models.PositiveIntegerField(default=0, verbose_name='排序')
    
    class Meta:
        verbose_name = '问题'
        verbose_name_plural = '问题'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.quiz.title} - {self.question_text[:50]}"

class Choice(models.Model):
    """选项"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices', verbose_name='所属问题')
    choice_text = models.CharField(max_length=255, verbose_name='选项文本')
    is_correct = models.BooleanField(default=False, verbose_name='是否正确')
    
    class Meta:
        verbose_name = '选项'
        verbose_name_plural = '选项'
    
    def __str__(self):
        return self.choice_text

class QuizAttempt(models.Model):
    """测验尝试"""
    STATUS_CHOICES = (
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('timed_out', '超时'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts', verbose_name='用户')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts', verbose_name='测验')
    start_time = models.DateTimeField(auto_now_add=True, verbose_name='开始时间')
    end_time = models.DateTimeField(blank=True, null=True, verbose_name='结束时间')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='in_progress', verbose_name='状态')
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='得分')
    passed = models.BooleanField(default=False, verbose_name='是否通过')
    attempt_number = models.PositiveIntegerField(default=1, verbose_name='尝试次数')
    
    class Meta:
        verbose_name = '测验尝试'
        verbose_name_plural = '测验尝试'
        unique_together = ['user', 'quiz', 'attempt_number']
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} - 尝试 {self.attempt_number}"

class Answer(models.Model):
    """答案"""
    quiz_attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers', verbose_name='测验尝试')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers', verbose_name='问题')
    selected_choices = models.ManyToManyField(Choice, blank=True, related_name='selected_in_answers', verbose_name='选择的选项')
    text_answer = models.TextField(blank=True, null=True, verbose_name='文本答案')
    is_correct = models.BooleanField(default=False, verbose_name='是否正确')
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='得分')
    feedback = models.TextField(blank=True, null=True, verbose_name='反馈')
    
    class Meta:
        verbose_name = '答案'
        verbose_name_plural = '答案'
        unique_together = ['quiz_attempt', 'question']
    
    def __str__(self):
        return f"{self.quiz_attempt.user.username} - {self.question.question_text[:30]}"
