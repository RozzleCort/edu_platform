# Generated by Django 4.2.6 on 2025-05-06 01:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0003_courserating'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='video_url',
            field=models.FileField(blank=True, null=True, upload_to='course_videos/', verbose_name='课程视频'),
        ),
    ]
