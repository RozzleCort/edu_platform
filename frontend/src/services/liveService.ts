import api from './api';
import { LiveEvent } from '../types';

// 获取直播活动列表
export const getLiveEvents = async (params?: any) => {
  try {
    console.log('API调用: 获取直播列表', params ? `参数: ${JSON.stringify(params)}` : '');
    const response = await api.get('/live/events/', { params });
    console.log('API响应: 直播列表获取成功', response.status);
    return response.data;
  } catch (error: any) {
    console.error('API错误: 获取直播列表失败', error.response?.status);
    throw error;
  }
};

// 获取教师的直播列表
export const getTeacherLiveEvents = async () => {
  try {
    console.log('API调用: 获取教师直播列表');
    const response = await api.get('/live/events/');
    console.log('API响应: 教师直播列表获取成功', response.status, '数据条数:', response.data.results?.length);
    return response.data;
  } catch (error: any) {
    console.error('API错误: 获取教师直播列表失败', error.response?.status, error.message);
    throw error;
  }
};

// 获取单个直播活动详情
export const getLiveEventDetail = async (eventId: number) => {
  try {
    console.log(`API调用: 获取直播详情 ID=${eventId}`);
    const response = await api.get(`/live/events/${eventId}/`);
    console.log(`API响应: 直播详情获取成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 获取直播详情失败 ID=${eventId}`, error.response?.status);
    throw error;
  }
};

// 创建直播活动
export const createLiveEvent = async (liveData: any) => {
  try {
    console.log('API调用: 创建直播活动', JSON.stringify(liveData, null, 2));
    const response = await api.post('/live/events/', liveData);
    console.log('API响应: 直播创建成功', response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error('API错误: 创建直播失败', error.response?.status, error.response?.data);
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw error;
  }
};

// 更新直播活动
export const updateLiveEvent = async (eventId: number, liveData: any) => {
  try {
    console.log(`API调用: 更新直播 ID=${eventId}`, liveData);
    const response = await api.put(`/live/events/${eventId}/`, liveData);
    console.log(`API响应: 直播更新成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 更新直播失败 ID=${eventId}`, error.response?.status);
    throw error;
  }
};

// 删除直播活动
export const deleteLiveEvent = async (eventId: number) => {
  try {
    console.log(`API调用: 删除直播 ID=${eventId}`);
    const response = await api.delete(`/live/events/${eventId}/`);
    console.log(`API响应: 直播删除成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 删除直播失败 ID=${eventId}`, error.response?.status);
    throw error;
  }
};

// 开始直播
export const startLiveEvent = async (eventId: number) => {
  try {
    console.log(`API调用: 开始直播 ID=${eventId}`);
    const response = await api.post(`/live/events/${eventId}/start_live/`);
    console.log(`API响应: 直播开始成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 开始直播失败 ID=${eventId}`, error.response?.status);
    throw error;
  }
};

// 结束直播
export const endLiveEvent = async (eventId: number) => {
  try {
    console.log(`API调用: 结束直播 ID=${eventId}`);
    const response = await api.post(`/live/events/${eventId}/end_live/`);
    console.log(`API响应: 直播结束成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 结束直播失败 ID=${eventId}`, error.response?.status);
    throw error;
  }
};

// 报名直播
export const enrollLiveEvent = async (eventId: number) => {
  try {
    console.log(`API调用: 报名直播 ID=${eventId}`);
    const response = await api.post(`/live/events/${eventId}/enroll/`);
    console.log(`API响应: 直播报名成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 报名直播失败 ID=${eventId}`, error.response?.status);
    throw error;
  }
};

// 获取直播聊天记录
export const getLiveChatMessages = async (eventId: number) => {
  try {
    console.log(`API调用: 获取直播聊天记录 ID=${eventId}`);
    const response = await api.get(`/live/events/${eventId}/chat_messages/`);
    console.log(`API响应: 聊天记录获取成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 获取聊天记录失败 ID=${eventId}`, error.response?.status);
    throw error;
  }
};

// 发送直播聊天消息
export const sendLiveChatMessage = async (eventId: number, message: string) => {
  try {
    console.log(`API调用: 发送直播聊天消息 ID=${eventId}`, message);
    
    // 检查消息长度
    if (!message || message.trim().length === 0) {
      throw new Error('消息内容不能为空');
    }
    
    // 确保包含正确的数据格式
    const requestData = { 
      message: message,
      live_event: eventId  // 修改为正确的字段名live_event
    };
    
    console.log('发送数据:', JSON.stringify(requestData));
    
    const response = await api.post(`/live/events/${eventId}/chat/`, requestData);
    console.log(`API响应: 消息发送成功 ID=${eventId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 发送消息失败 ID=${eventId}`, error.response?.status);
    // 输出详细错误信息
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}; 