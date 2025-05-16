from django.contrib import admin
from .models import Category, Course, Section, Lesson, Enrollment, LessonProgress

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')

class SectionInline(admin.StackedInline):
    model = Section
    extra = 1

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'category', 'status', 'price', 'is_free', 'created_at')
    list_filter = ('status', 'is_free', 'category', 'created_at')
    search_fields = ('title', 'description', 'instructor__username')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [SectionInline]

class LessonInline(admin.StackedInline):
    model = Lesson
    extra = 1

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    search_fields = ('title', 'description', 'course__title')
    inlines = [LessonInline]

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'lesson_type', 'duration', 'order', 'is_free_preview')
    list_filter = ('lesson_type', 'is_free_preview', 'section__course')
    search_fields = ('title', 'content', 'section__title', 'section__course__title')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'status', 'enrolled_at', 'completed_at')
    list_filter = ('status', 'enrolled_at')
    search_fields = ('student__username', 'course__title')
    date_hierarchy = 'enrolled_at'

@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'lesson', 'status', 'progress_percent', 'last_accessed')
    list_filter = ('status', 'last_accessed')
    search_fields = ('enrollment__student__username', 'lesson__title')
