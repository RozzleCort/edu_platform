from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LiveEventViewSet, LiveChatViewSet

router = DefaultRouter()
router.register(r'events', LiveEventViewSet, basename='live-events')
router.register(r'events/(?P<live_event_pk>[^/.]+)/chat', LiveChatViewSet, basename='live-chat')

urlpatterns = [
    path('', include(router.urls)),
] 