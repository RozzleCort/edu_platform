from django.db import models
from accounts.models import User

class Category(models.Model):
    """课程分类"""
    name = models.CharField(max_length=100, verbose_name='分类名称')
    description = models.TextField(blank=True, null=True, verbose_name='分类描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '课程分类'
        verbose_name_plural = '课程分类'
    
    def __str__(self):
        return self.name

class Course(models.Model):
    """课程"""
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('published', '已发布'),
        ('archived', '已归档'),
    )
    
    title = models.CharField(max_length=200, verbose_name='课程标题')
    slug = models.SlugField(max_length=200, unique=True, blank=True, verbose_name='URL别名')
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses', verbose_name='讲师')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='courses', verbose_name='分类')
    cover_image = models.ImageField(upload_to='course_covers/', blank=True, null=True, verbose_name='封面图')
    video_url = models.URLField(max_length=500, blank=True, null=True, verbose_name='课程视频URL')
    description = models.TextField(verbose_name='课程描述')
    learning_objectives = models.TextField(blank=True, null=True, verbose_name='学习目标')
    prerequisites = models.TextField(blank=True, null=True, verbose_name='预备知识')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name='价格')
    is_free = models.BooleanField(default=False, verbose_name='是否免费')
    students = models.ManyToManyField(User, through='Enrollment', related_name='enrolled_courses', verbose_name='学生')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '课程'
        verbose_name_plural = '课程'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

    @property
    def average_rating(self):
        """获取课程平均评分"""
        ratings = self.ratings.all()
        if not ratings:
            return 0
        return sum(rating.score for rating in ratings) / ratings.count()

class Section(models.Model):
    """课程章节"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections', verbose_name='所属课程')
    title = models.CharField(max_length=200, verbose_name='章节标题')
    description = models.TextField(blank=True, null=True, verbose_name='章节描述')
    order = models.PositiveIntegerField(default=0, verbose_name='排序')
    
    class Meta:
        verbose_name = '课程章节'
        verbose_name_plural = '课程章节'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Lesson(models.Model):
    """课程课时"""
    LESSON_TYPE_CHOICES = (
        ('video', '视频'),
        ('document', '文档'),
        ('quiz', '测验'),
    )
    
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='lessons', verbose_name='所属章节')
    title = models.CharField(max_length=200, verbose_name='课时标题')
    lesson_type = models.CharField(max_length=10, choices=LESSON_TYPE_CHOICES, default='video', verbose_name='课时类型')
    content = models.TextField(blank=True, null=True, verbose_name='课时内容')
    duration = models.PositiveIntegerField(default=0, verbose_name='时长(分钟)')
    order = models.PositiveIntegerField(default=0, verbose_name='排序')
    is_free_preview = models.BooleanField(default=False, verbose_name='是否免费预览')
    
    class Meta:
        verbose_name = '课程课时'
        verbose_name_plural = '课程课时'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.section.course.title} - {self.section.title} - {self.title}"

class Enrollment(models.Model):
    """课程报名"""
    STATUS_CHOICES = (
        ('active', '有效'),
        ('completed', '已完成'),
        ('expired', '已过期'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments', verbose_name='学生')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments', verbose_name='课程')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active', verbose_name='状态')
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name='报名时间')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='完成时间')
    
    class Meta:
        verbose_name = '课程报名'
        verbose_name_plural = '课程报名'
        unique_together = ['student', 'course']
    
    def __str__(self):
        return f"{self.student.username} - {self.course.title}"

class LessonProgress(models.Model):
    """课时学习进度"""
    STATUS_CHOICES = (
        ('not_started', '未开始'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
    )
    
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='progress', verbose_name='报名记录')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress', verbose_name='课时')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='not_started', verbose_name='状态')
    progress_percent = models.PositiveIntegerField(default=0, verbose_name='进度百分比')
    last_position = models.PositiveIntegerField(default=0, verbose_name='上次位置(秒)')
    last_accessed = models.DateTimeField(auto_now=True, verbose_name='最后访问时间')
    
    class Meta:
        verbose_name = '课时进度'
        verbose_name_plural = '课时进度'
        unique_together = ['enrollment', 'lesson']
    
    def __str__(self):
        return f"{self.enrollment.student.username} - {self.lesson.title}"

class CourseRating(models.Model):
    """课程评分"""
    SCORE_CHOICES = (
        (1, '1分'),
        (2, '2分'),
        (3, '3分'),
        (4, '4分'),
        (5, '5分'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings', verbose_name='用户')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='ratings', verbose_name='课程')
    score = models.PositiveSmallIntegerField(choices=SCORE_CHOICES, verbose_name='评分')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='评分时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '课程评分'
        verbose_name_plural = '课程评分'
        unique_together = ['user', 'course']
        
    def __str__(self):
        return f"{self.user.username}对{self.course.title}的评分：{self.score}分"
