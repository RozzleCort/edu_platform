# 在线教育平台

这是一个基于Django和Django REST framework开发的在线教育平台后端API，支持课程管理、视频学习、直播教学、练习测验和评论交流等功能。

## 技术栈

- Python 3.9+
- Django 4.2
- Django REST Framework 
- JWT认证
- SQLite数据库（开发环境）

## 功能特点

- **用户管理**：支持学生、教师和管理员角色，JWT身份认证
- **课程管理**：课程、章节、课时的创建与管理，支持多种课时类型
- **视频学习**：点播视频、学习进度跟踪
- **直播教学**：课程直播、实时互动、出席记录
- **练习测验**：多种题型测验、自动评分、学习报告
- **评论交流**：课程评论、回复、点赞、通知提醒

## 安装

1. 克隆项目：

```bash
git clone https://github.com/yourusername/edu_platform.git
cd edu_platform
```

2. 创建并激活虚拟环境：

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

3. 安装依赖：

```bash
pip install -r requirements.txt
```

4. 数据库迁移：

```bash
python manage.py makemigrations
python manage.py migrate
```

5. 创建超级用户：

```bash
python manage.py createsuperuser
```

6. 运行开发服务器：

```bash
python manage.py runserver
```

## API文档

启动服务器后，可以在以下地址访问API文档：

- API文档: http://localhost:8000/api-docs/

## 主要API端点

- 用户认证: `/api/accounts/token/`
- 用户注册: `/api/accounts/register/`
- 用户管理: `/api/accounts/users/`
- 课程列表: `/api/courses/courses/`
- 课程详情: `/api/courses/courses/{id}/`
- 报名课程: `/api/courses/courses/{id}/enroll/`
- 课程进度: `/api/courses/courses/{id}/my_progress/`
- 章节管理: `/api/courses/sections/`
- 课时管理: `/api/courses/lessons/`
- 视频资源: `/api/videos/videos/`
- 视频观看: `/api/videos/videos/{id}/watch/`
- 直播管理: `/api/videos/livestreams/`
- 开始直播: `/api/videos/livestreams/{id}/start/`
- 结束直播: `/api/videos/livestreams/{id}/end/`
- 加入直播: `/api/videos/livestreams/{id}/join/`
- 离开直播: `/api/videos/livestreams/{id}/leave/`
- 测验管理: `/api/exercises/quizzes/`
- 开始测验: `/api/exercises/quizzes/{id}/start_attempt/`
- 提交答案: `/api/exercises/answers/`
- 提交测验: `/api/exercises/attempts/{id}/submit/`
- 评论管理: `/api/comments/comments/`
- 点赞评论: `/api/comments/comments/{id}/like/`
- 通知管理: `/api/comments/notifications/`
- 未读通知数: `/api/comments/notifications/unread_count/`

## 部署

### 生产环境配置

1. 修改 `settings.py` 中的生产环境配置：

```python
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# 配置媒体文件存储，可使用云存储服务
```

2. 收集静态文件：

```bash
python manage.py collectstatic
```

3. 使用 Gunicorn 和 Nginx 部署（推荐）

## 许可证

本项目采用 MIT 许可证。 