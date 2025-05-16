from django.shortcuts import render
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import StudentProfile, TeacherProfile
from .serializers import (
    UserSerializer, 
    StudentProfileSerializer,
    TeacherProfileSerializer,
    StudentProfileUpdateSerializer,
    TeacherProfileUpdateSerializer,
    UserRegistrationSerializer,
    ChangePasswordSerializer,
    UserProfileUpdateSerializer
)

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    """用户视图集"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all()
        user_type = self.request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        return queryset
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """获取当前用户信息"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put'], url_path='update-profile')
    def update_profile(self, request, pk=None):
        """更新用户个人资料"""
        user = self.get_object()
        if user != request.user and not request.user.is_staff:
            return Response({"detail": "您没有权限修改此用户资料"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'], url_path='change-password')
    def change_password(self, request, pk=None):
        """修改密码"""
        user = self.get_object()
        if user != request.user and not request.user.is_staff:
            return Response({"detail": "您没有权限修改此用户密码"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            # 验证旧密码
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": "旧密码不正确"}, status=status.HTTP_400_BAD_REQUEST)
            
            # 设置新密码
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"detail": "密码修改成功"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserRegistrationView(generics.CreateAPIView):
    """用户注册视图"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # 生成令牌
        refresh = RefreshToken.for_user(user)
        
        data = {
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        return Response(data, status=status.HTTP_201_CREATED)

class StudentProfileViewSet(viewsets.ModelViewSet):
    """学生资料视图集"""
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'destroy':
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return StudentProfileUpdateSerializer
        return self.serializer_class

class TeacherProfileViewSet(viewsets.ModelViewSet):
    """教师资料视图集"""
    queryset = TeacherProfile.objects.all()
    serializer_class = TeacherProfileSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'destroy':
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return TeacherProfileUpdateSerializer
        return self.serializer_class
