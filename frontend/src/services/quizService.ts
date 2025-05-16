import api from './api';
import { Quiz, QuizAttempt, Answer } from '../types';

// 获取测验列表
export const getQuizzes = async (params?: any) => {
  const response = await api.get('/exercises/quizzes/', { params });
  return response.data;
};

// 获取教师创建的测验列表
export const getTeacherQuizzes = async () => {
  const response = await api.get('/exercises/quizzes/');
  console.log('API响应: 教师测验列表获取成功', response.status);
  return response.data;
};

// 创建新测验
export const createQuiz = async (quizData: any) => {
  try {
    console.log('API调用: 创建测验', JSON.stringify(quizData, null, 2));
    const response = await api.post('/exercises/quizzes/', quizData);
    console.log('API响应: 测验创建成功', response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error('API错误: 创建测验失败', error.response?.status, error.response?.data);
    throw error;
  }
};

// 获取测验详情
export const getQuizDetail = async (quizId: number) => {
  try {
    console.log('API调用: 获取测验详情', quizId);
    const response = await api.get(`/exercises/quizzes/${quizId}/`, {
      params: {
        include_questions: true,
        detailed: true,
        include_answers: true
      }
    });
    console.log('API响应: 测验详情获取成功', response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error('API错误: 获取测验详情失败', error.response?.status, error.response?.data);
    throw error;
  }
};

// 删除测验
export const deleteQuiz = async (quizId: number) => {
  try {
    console.log(`API调用: 删除测验 ID=${quizId}`);
    const response = await api.delete(`/exercises/quizzes/${quizId}/`);
    console.log(`API响应: 测验删除成功 ID=${quizId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 删除测验失败 ID=${quizId}`, error.response?.status, error.response?.data);
    throw error;
  }
};

// 开始测验尝试
export const startQuizAttempt = async (quizId: number) => {
  try {
    console.log('API调用: 开始测验尝试', quizId);
    const response = await api.post(`/exercises/quizzes/${quizId}/start_attempt/`);
    console.log('API响应: 测验尝试开始成功', response.status, response.data);
    return response.data;
  } catch (error: any) {
    let errorData = '未知错误';
    
    if (error.response) {
      // 服务器返回了响应，但状态码不在2xx范围内
      console.error('API错误: 开始测验尝试失败', error.response.status, error.response.data);
      errorData = error.response.data;
    } else if (error.request) {
      // 请求已发出，但未收到响应
      console.error('API错误: 开始测验尝试未收到响应', error.request);
      errorData = '服务器未响应，请检查网络连接';
    } else {
      // 设置请求时发生错误
      console.error('API错误: 开始测验尝试请求配置错误', error.message);
      errorData = error.message;
    }
    
    throw {
      ...error,
      response: {
        ...error.response,
        data: errorData
      }
    };
  }
};

// 获取测验尝试详情
export const getQuizAttemptDetail = async (attemptId: number) => {
  try {
    console.log('API调用: 获取测验尝试详情', attemptId);
    const response = await api.get(`/exercises/attempts/${attemptId}/`);
    console.log('API响应: 测验尝试详情获取成功', response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error('API错误: 获取测验尝试详情失败', error.response?.status, error.response?.data);
    throw error;
  }
};

// 提交答案
export const submitAnswer = async (answerData: {
  quiz_attempt: number;
  question: number;
  text_answer?: string;
  selected_choice_ids?: number[];
}) => {
  const response = await api.post('/exercises/answers/', answerData);
  return response.data;
};

// 提交测验
export const submitQuizAttempt = async (attemptId: number) => {
  const response = await api.post(`/exercises/attempts/${attemptId}/submit/`);
  return response.data;
};

// 获取用户的测验尝试列表
export const getUserQuizAttempts = async () => {
  const response = await api.get('/exercises/attempts/');
  return response.data;
};

// 获取问题详情
export const getQuestionDetail = async (questionId: number) => {
  const response = await api.get(`/exercises/questions/${questionId}/`);
  return response.data;
};

// 教师为简答题评分
export const gradeShortAnswer = async (gradeData: {
  answer_id: number;
  score: number;
  feedback?: string;
}) => {
  const response = await api.post('/exercises/answers/grade_short_answer/', gradeData);
  return response.data;
};

// 获取测验统计数据 (教师功能)
export const getQuizStatistics = async (quizId: number) => {
  const response = await api.get(`/exercises/quizzes/${quizId}/statistics/`);
  return response.data;
};

// 获取学生测验表现
export const getStudentPerformance = async () => {
  const response = await api.get('/exercises/attempts/student_performance/');
  return response.data;
};

// 获取问题的所有答案
export const getQuestionAnswers = async (questionId: number) => {
  try {
    console.log('API调用: 获取问题的所有答案', questionId);
    // 从答案列表API筛选特定问题的答案，添加更多筛选条件
    const response = await api.get('/exercises/answers/', {
      params: { 
        question: questionId,
        limit: 100, // 获取足够多的答案
        // 包含已完成的尝试
        quiz_attempt__status: 'completed'
      }
    });
    
    // 检查响应是否包含结果
    if (response.data && response.data.results) {
      console.log(`API响应: 获取问题 ${questionId} 的答案成功，共 ${response.data.results.length} 条`, response.status);
      return response.data.results || [];
    } else {
      console.warn(`API响应: 问题 ${questionId} 没有答案`, response.data);
      return [];
    }
  } catch (error: any) {
    console.error('API错误: 获取问题答案失败', error.response?.status, error.response?.data);
    throw error;
  }
};

// 获取指定测验尝试中所有简答题的答案
export const getAttemptShortAnswers = async (attemptId: number) => {
  try {
    console.log('API调用: 获取测验尝试的简答题答案', attemptId);
    const response = await api.get('/exercises/answers/', {
      params: {
        quiz_attempt: attemptId,
        question__question_type: 'short_answer'
      }
    });
    console.log(`API响应: 获取尝试 ${attemptId} 的简答题答案成功，共 ${response.data.results?.length || 0} 条`, response.status);
    return response.data.results || [];
  } catch (error: any) {
    console.error('API错误: 获取尝试简答题答案失败', error.response?.status, error.response?.data);
    throw error;
  }
};

// 获取用户对特定测验的尝试次数
export const getUserQuizAttemptsCount = async (quizId: number) => {
  try {
    console.log('API调用: 获取用户测验尝试次数', quizId);
    const response = await api.get(`/exercises/attempts/`, {
      params: { quiz: quizId }
    });
    console.log('API响应: 获取用户测验尝试次数成功', response.status, response.data);
    // 返回尝试次数
    return response.data.results ? response.data.results.length : 0;
  } catch (error: any) {
    console.error('API错误: 获取用户测验尝试次数失败', error.response?.status, error.response?.data);
    throw error;
  }
}; 