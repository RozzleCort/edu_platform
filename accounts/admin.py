from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, StudentProfile, TeacherProfile

# 定义内联模型
class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False

class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    can_delete = False

# 自定义用户管理
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('user_type', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('个人信息', {'fields': ('email', 'phone', 'first_name', 'last_name', 'avatar', 'bio')}),
        ('权限', {'fields': ('user_type', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('重要日期', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'user_type', 'password1', 'password2'),
        }),
    )
    
    def get_inlines(self, request, obj=None):
        if not obj:
            return []
        if obj.user_type == 'student':
            return [StudentProfileInline]
        elif obj.user_type == 'teacher':
            return [TeacherProfileInline]
        return []

# 注册其他模型
@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'student_id')
    search_fields = ('user__username', 'user__email', 'student_id')

@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'department')
    search_fields = ('user__username', 'user__email', 'title', 'department')
