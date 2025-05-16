from django.urls import path
from . import views

urlpatterns = [
    path('image/', views.upload_image, name='upload_image'),
    path('video/', views.upload_video, name='upload_video'),
] 