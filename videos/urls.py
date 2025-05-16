from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VideoViewSet, LiveStreamingViewSet, VideoWatchHistoryViewSet

router = DefaultRouter()
router.register(r'videos', VideoViewSet)
router.register(r'livestreams', LiveStreamingViewSet)
router.register(r'watch-history', VideoWatchHistoryViewSet, basename='watch-history')

urlpatterns = [
    path('', include(router.urls)),
] 