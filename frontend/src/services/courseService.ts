import api from './api';
import { Course, Category, Enrollment, LessonProgress } from '../types';

// 获取所有课程分类
export const getCategories = async () => {
  const response = await api.get('/courses/categories/');
  return response.data;
};

// 获取课程列表
export const getCourses = async (params?: any) => {
  const response = await api.get('/courses/courses/', { params });
  return response.data;
};

// 获取教师创建的课程
export const getTeacherCourses = async () => {
  try {
    console.log('API调用: 获取教师课程');
    const response = await api.get('/courses/courses/teacher_courses/');
    console.log('API响应: 教师课程获取成功', response.status);
    return response.data;
  } catch (error: any) {
    console.error('API错误: 获取教师课程失败', error.response?.status, error.message);
    // 重新抛出错误，让上层组件处理
    throw error;
  }
};

// 创建新课程
export const createCourse = async (courseData: any) => {
  try {
    console.log('Service - 发送的课程数据:', courseData);
    // 处理默认值，防止null/undefined导致的问题
    const processedData = {
      ...courseData,
      category: courseData.category || null,
      status: courseData.status || 'draft'
    };
    
    const response = await api.post('/courses/courses/', processedData);
    console.log('Service - 创建课程API响应:', response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error('Service - 创建课程错误:', error);
    console.error('Service - 创建课程错误状态:', error.response?.status);
    console.error('Service - 创建课程错误详情:', error.response?.data || error.message);
    throw error;
  }
};

// 更新课程
export const updateCourse = async (courseId: number, courseData: any) => {
  try {
    console.log('更新课程前的原始数据:', courseData);
    
    // 创建一个新对象，避免直接修改原始数据
    const processedData = {
      ...courseData,
    };

    // 简化处理：确保video_url和cover_image是字符串或null
    if (processedData.video_url && typeof processedData.video_url === 'object') {
      console.log('将video_url对象转换为null');
      processedData.video_url = null;
    }

    if (processedData.cover_image && typeof processedData.cover_image === 'object') {
      console.log('将cover_image对象转换为null');
      processedData.cover_image = null;
    }
    
    console.log('发送的更新课程数据(处理后):', processedData);
    const response = await api.put(`/courses/courses/${courseId}/`, processedData);
    return response.data;
  } catch (error: any) {
    console.error('更新课程错误详情:', error.response?.data || error.message);
    throw error;
  }
};

// 获取课程详情
export const getCourseDetail = async (courseId: number) => {
  try {
    console.log(`API调用: 获取课程详情 ID=${courseId}`);
    const response = await api.get(`/courses/courses/${courseId}/`);
    console.log(`API响应: 课程详情获取成功 ID=${courseId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 获取课程详情失败 ID=${courseId}`, error.response?.status);
    if (error.response?.status === 404) {
      console.error(`课程不存在: ID=${courseId}`);
    }
    throw error;
  }
};

// 报名课程
export const enrollCourse = async (courseId: number) => {
  const response = await api.post(`/courses/courses/${courseId}/enroll/`);
  return response.data;
};

// 获取课程学习进度
export const getCourseProgress = async (courseId: number) => {
  const response = await api.get(`/courses/courses/${courseId}/my_progress/`);
  return response.data;
};

// 获取章节详情
export const getSectionDetail = async (sectionId: number) => {
  const response = await api.get(`/courses/sections/${sectionId}/`);
  return response.data;
};

// 获取课时详情
export const getLessonDetail = async (lessonId: number) => {
  const response = await api.get(`/courses/lessons/${lessonId}/`);
  return response.data;
};

// 更新课时学习进度
export const updateLessonProgress = async (lessonId: number, progressData: { progress_percent: number, last_position: number }) => {
  const response = await api.post(`/courses/lessons/${lessonId}/update_progress/`, progressData);
  return response.data;
};

// 获取用户报名的课程
export const getUserEnrollments = async () => {
  const response = await api.get('/courses/enrollments/');
  return response.data;
};

// 获取课程评论
export const getCourseComments = async (courseId: number, params?: any) => {
  try {
    console.log(`API调用: 获取课程评论 ID=${courseId}`, params ? `参数: ${JSON.stringify(params)}` : '');
    const response = await api.get(`/courses/courses/${courseId}/comments/`, { params });
    console.log(`API响应: 课程评论获取成功 ID=${courseId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 获取课程评论失败 ID=${courseId}`, error.response?.status);
    throw error;
  }
};

// 添加课程评论
export const addCourseComment = async (courseId: number, content: string, parentId?: number) => {
  try {
    console.log(`API调用: 添加课程评论 ID=${courseId}${parentId ? ` 回复ID=${parentId}` : ''}`);
    const data = {
      content,
      parent: parentId
    };
    const response = await api.post(`/courses/courses/${courseId}/comments/`, data);
    console.log(`API响应: 课程评论添加成功 ID=${courseId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 添加课程评论失败 ID=${courseId}`, error.response?.status);
    throw error;
  }
};

// 删除评论
export const deleteComment = async (commentId: number) => {
  try {
    console.log(`API调用: 删除评论 ID=${commentId}`);
    const response = await api.delete(`/comments/comments/${commentId}/`);
    console.log(`API响应: 评论删除成功 ID=${commentId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 删除评论失败 ID=${commentId}`, error.response?.status);
    throw error;
  }
};

// 评分课程
export const rateCourse = async (courseId: number, score: number) => {
  try {
    console.log(`API调用: 评分课程 ID=${courseId}, 分数=${score}`);
    const data = { score };
    const response = await api.post(`/courses/courses/${courseId}/rate/`, data);
    console.log(`API响应: 课程评分成功 ID=${courseId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 评分课程失败 ID=${courseId}`, error.response?.status);
    throw error;
  }
};

// 获取课程评分列表
export const getCourseRatings = async (courseId: number) => {
  try {
    console.log(`API调用: 获取课程评分列表 ID=${courseId}`);
    const response = await api.get(`/courses/courses/${courseId}/ratings/`);
    console.log(`API响应: 课程评分列表获取成功 ID=${courseId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 获取课程评分列表失败 ID=${courseId}`, error.response?.status);
    throw error;
  }
};

// 删除课程
export const deleteCourse = async (courseId: number) => {
  try {
    console.log(`API调用: 删除课程 ID=${courseId}`);
    const response = await api.delete(`/courses/courses/${courseId}/`);
    console.log(`API响应: 课程删除成功 ID=${courseId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 删除课程失败 ID=${courseId}`, error.response?.status);
    throw error;
  }
}; 