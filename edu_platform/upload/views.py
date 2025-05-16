from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    """
    上传图片接口
    """
    if 'file' not in request.FILES:
        return Response({'error': '没有提供文件'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    
    # 验证文件类型
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    if file.content_type not in allowed_types:
        return Response({'error': '只允许上传JPEG、PNG或GIF图片'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 限制文件大小
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        return Response({'error': '图片大小不能超过10MB'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 生成唯一文件名
    ext = os.path.splitext(file.name)[1]
    file_name = f"{uuid.uuid4().hex}{ext}"
    
    # 构建保存路径
    upload_path = os.path.join('upload', 'images', file_name)
    
    # 保存文件
    path = default_storage.save(upload_path, ContentFile(file.read()))
    
    # 构建URL
    url = default_storage.url(path)
    
    return Response({'url': url}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_video(request):
    """
    上传视频接口
    """
    if 'file' not in request.FILES:
        return Response({'error': '没有提供文件'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    
    # 验证文件类型
    allowed_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    if file.content_type not in allowed_types:
        return Response({'error': '只允许上传MP4、MOV或AVI视频'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 限制文件大小
    max_size = 500 * 1024 * 1024  # 500MB
    if file.size > max_size:
        return Response({'error': '视频大小不能超过500MB'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 生成唯一文件名
    ext = os.path.splitext(file.name)[1]
    file_name = f"{uuid.uuid4().hex}{ext}"
    
    # 构建保存路径
    upload_path = os.path.join('upload', 'videos', file_name)
    
    # 保存文件
    path = default_storage.save(upload_path, ContentFile(file.read()))
    
    # 构建URL
    url = default_storage.url(path)
    
    return Response({'url': url}, status=status.HTTP_201_CREATED) 