from django.contrib import admin
from .models import Quiz, Question, Choice, QuizAttempt, Answer

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 3

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'quiz', 'question_type', 'points', 'order')
    list_filter = ('question_type', 'quiz')
    search_fields = ('question_text', 'explanation', 'quiz__title')
    inlines = [ChoiceInline]

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1
    show_change_link = True

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'time_limit', 'pass_score', 'allow_multiple_attempts', 'max_attempts', 'created_at')
    list_filter = ('allow_multiple_attempts', 'randomize_questions', 'show_correct_answers', 'created_at')
    search_fields = ('title', 'description', 'lesson__title', 'lesson__section__course__title')
    date_hierarchy = 'created_at'
    inlines = [QuestionInline]

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('choice_text', 'question', 'is_correct')
    list_filter = ('is_correct', 'question__quiz')
    search_fields = ('choice_text', 'question__question_text')

class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    readonly_fields = ('question', 'selected_choices', 'text_answer', 'is_correct', 'score')
    can_delete = False

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'status', 'score', 'passed', 'attempt_number', 'start_time', 'end_time')
    list_filter = ('status', 'passed', 'start_time')
    search_fields = ('user__username', 'quiz__title')
    date_hierarchy = 'start_time'
    readonly_fields = ('user', 'quiz', 'start_time', 'end_time', 'status', 'score', 'passed', 'attempt_number')
    inlines = [AnswerInline]

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('quiz_attempt', 'question', 'is_correct', 'score')
    list_filter = ('is_correct',)
    search_fields = ('quiz_attempt__user__username', 'question__question_text', 'text_answer', 'feedback')
    readonly_fields = ('quiz_attempt', 'question', 'selected_choices', 'text_answer', 'is_correct', 'score', 'feedback')
