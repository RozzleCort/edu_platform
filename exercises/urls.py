from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QuizViewSet,
    QuestionViewSet,
    ChoiceViewSet,
    QuizAttemptViewSet,
    AnswerViewSet
)

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'choices', ChoiceViewSet)
router.register(r'attempts', QuizAttemptViewSet, basename='attempt')
router.register(r'answers', AnswerViewSet, basename='answer')

urlpatterns = [
    path('', include(router.urls)),
] 