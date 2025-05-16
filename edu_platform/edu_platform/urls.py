from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/comments/', include('comments.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/exercises/', include('exercises.urls')),
    path('api/videos/', include('videos.urls')),
    path('api/live/', include('live.urls')),
    path('api/upload/', include('upload.urls')),  # 新增上传URL
]

# 添加媒体文件URL配置
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 