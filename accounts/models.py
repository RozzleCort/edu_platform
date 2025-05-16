from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', '学生'),
        ('teacher', '教师'),
        ('admin', '管理员'),
    )
    
    email = models.EmailField(unique=True, verbose_name='邮箱')
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name='电话')
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student', verbose_name='用户类型')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='头像')
    bio = models.TextField(blank=True, null=True, verbose_name='个人简介')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
    
    def __str__(self):
        return self.username

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile', verbose_name='用户')
    student_id = models.CharField(max_length=20, blank=True, null=True, verbose_name='学号')
    
    class Meta:
        verbose_name = '学生资料'
        verbose_name_plural = '学生资料'
    
    def __str__(self):
        return f"{self.user.username}的学生资料"

class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile', verbose_name='用户')
    title = models.CharField(max_length=100, blank=True, null=True, verbose_name='职称')
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name='院系')
    
    class Meta:
        verbose_name = '教师资料'
        verbose_name_plural = '教师资料'
    
    def __str__(self):
        return f"{self.user.username}的教师资料"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """当创建新用户时，根据用户类型自动创建对应的资料"""
    if created:
        if instance.user_type == 'student':
            StudentProfile.objects.create(user=instance)
        elif instance.user_type == 'teacher':
            TeacherProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """保存用户时，同时保存对应的资料"""
    if instance.user_type == 'student' and hasattr(instance, 'student_profile'):
        instance.student_profile.save()
    elif instance.user_type == 'teacher' and hasattr(instance, 'teacher_profile'):
        instance.teacher_profile.save()
