from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from courses.views import IsInstructorOrReadOnly
from .models import Video, LiveStreaming, VideoWatchHistory, LiveStreamingAttendance
from .serializers import (
    VideoSerializer,
    VideoCreateUpdateSerializer,
    LiveStreamingSerializer,
    LiveStreamingCreateUpdateSerializer,
    VideoWatchHistorySerializer,
    VideoWatchHistoryUpdateSerializer,
    LiveStreamingAttendanceSerializer
)

class VideoViewSet(viewsets.ModelViewSet):
    """视频视图集"""
    queryset = Video.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VideoCreateUpdateSerializer
        return VideoSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post', 'get'], permission_classes=[permissions.IsAuthenticated])
    def watch(self, request, pk=None):
        """观看视频并更新观看历史"""
        video = self.get_object()
        user = request.user
        
        # 检查用户是否有权限观看视频
        if not video.lesson.is_free_preview and not video.lesson.section.course.is_free:
            if not video.lesson.section.course.enrollments.filter(student=user).exists():
                return Response({"detail": "您需要先报名课程才能观看此视频"}, status=status.HTTP_403_FORBIDDEN)
        
        # 获取或创建观看记录
        watch_history, created = VideoWatchHistory.objects.get_or_create(
            user=user,
            video=video,
            defaults={
                'watched_duration': 0,
                'last_position': 0,
                'completed': False
            }
        )
        
        if request.method == 'POST':
            # 更新观看记录
            watched_duration = request.data.get('watched_duration', watch_history.watched_duration)
            last_position = request.data.get('last_position', watch_history.last_position)
            completed = request.data.get('completed', watch_history.completed)
            
            watch_history.watched_duration = watched_duration
            watch_history.last_position = last_position
            watch_history.completed = completed
            watch_history.save()
        
        return Response(VideoWatchHistorySerializer(watch_history).data)

class LiveStreamingViewSet(viewsets.ModelViewSet):
    """直播视图集"""
    queryset = LiveStreaming.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LiveStreamingCreateUpdateSerializer
        return LiveStreamingSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsInstructorOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        """开始直播"""
        live_streaming = self.get_object()
        user = request.user
        
        # 检查是否是课程创建者
        if live_streaming.lesson.section.course.instructor != user and not user.is_staff:
            return Response({"detail": "只有课程创建者才能开始直播"}, status=status.HTTP_403_FORBIDDEN)
        
        # 更新直播状态
        if live_streaming.status not in ['scheduled', 'cancelled']:
            return Response({"detail": "当前状态无法开始直播"}, status=status.HTTP_400_BAD_REQUEST)
        
        live_streaming.status = 'live'
        live_streaming.actual_start_time = timezone.now()
        live_streaming.save()
        
        return Response(LiveStreamingSerializer(live_streaming).data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def end(self, request, pk=None):
        """结束直播"""
        live_streaming = self.get_object()
        user = request.user
        
        # 检查是否是课程创建者
        if live_streaming.lesson.section.course.instructor != user and not user.is_staff:
            return Response({"detail": "只有课程创建者才能结束直播"}, status=status.HTTP_403_FORBIDDEN)
        
        # 更新直播状态
        if live_streaming.status != 'live':
            return Response({"detail": "直播未开始"}, status=status.HTTP_400_BAD_REQUEST)
        
        live_streaming.status = 'ended'
        live_streaming.actual_end_time = timezone.now()
        live_streaming.save()
        
        # 更新所有观看者的离开时间和观看时长
        attendances = LiveStreamingAttendance.objects.filter(
            live_streaming=live_streaming,
            leave_time__isnull=True
        )
        for attendance in attendances:
            attendance.leave_time = timezone.now()
            if attendance.join_time:
                duration_seconds = (attendance.leave_time - attendance.join_time).total_seconds()
                attendance.duration = int(duration_seconds / 60)  # 转换为分钟
            attendance.save()
        
        return Response(LiveStreamingSerializer(live_streaming).data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        """加入直播"""
        live_streaming = self.get_object()
        user = request.user
        
        # 检查用户是否有权限观看直播
        course = live_streaming.lesson.section.course
        if not course.is_free and not course.enrollments.filter(student=user).exists():
            return Response({"detail": "您需要先报名课程才能观看此直播"}, status=status.HTTP_403_FORBIDDEN)
        
        # 检查直播状态
        if live_streaming.status != 'live':
            return Response({"detail": "直播未开始或已结束"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 记录观看者
        attendance, created = LiveStreamingAttendance.objects.get_or_create(
            user=user,
            live_streaming=live_streaming,
            defaults={
                'join_time': timezone.now(),
                'duration': 0
            }
        )
        
        # 如果已经有记录但已经离开，更新为重新加入
        if not created and attendance.leave_time:
            attendance.join_time = timezone.now()
            attendance.leave_time = None
            attendance.save()
        
        return Response(LiveStreamingAttendanceSerializer(attendance).data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        """离开直播"""
        live_streaming = self.get_object()
        user = request.user
        
        try:
            attendance = LiveStreamingAttendance.objects.get(
                user=user,
                live_streaming=live_streaming,
                leave_time__isnull=True
            )
        except LiveStreamingAttendance.DoesNotExist:
            return Response({"detail": "您未加入此直播或已离开"}, status=status.HTTP_400_BAD_REQUEST)
        
        attendance.leave_time = timezone.now()
        if attendance.join_time:
            duration_seconds = (attendance.leave_time - attendance.join_time).total_seconds()
            attendance.duration = int(duration_seconds / 60)  # 转换为分钟
        attendance.save()
        
        return Response(LiveStreamingAttendanceSerializer(attendance).data)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def attendances(self, request, pk=None):
        """获取直播出席记录"""
        live_streaming = self.get_object()
        user = request.user
        
        # 只有课程创建者或管理员可以查看所有出席记录
        if live_streaming.lesson.section.course.instructor != user and not user.is_staff:
            return Response({"detail": "只有课程创建者才能查看出席记录"}, status=status.HTTP_403_FORBIDDEN)
        
        attendances = LiveStreamingAttendance.objects.filter(live_streaming=live_streaming)
        return Response(LiveStreamingAttendanceSerializer(attendances, many=True).data)

class VideoWatchHistoryViewSet(viewsets.ModelViewSet):
    """视频观看历史视图集"""
    serializer_class = VideoWatchHistorySerializer
    
    def get_queryset(self):
        user = self.request.user
        # 用户只能查看自己的观看历史
        return VideoWatchHistory.objects.filter(user=user)
    
    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return VideoWatchHistoryUpdateSerializer
        return self.serializer_class
