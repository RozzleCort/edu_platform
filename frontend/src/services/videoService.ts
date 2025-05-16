import api from './api';
import { Video, LiveStreaming, VideoWatchHistory } from '../types';

// 获取视频详情
export const getVideoDetail = async (videoId: number) => {
  const response = await api.get(`/videos/videos/${videoId}/`);
  return response.data;
};

// 观看视频并更新进度
export const watchVideo = async (videoId: number, watchData?: { watched_duration: number, last_position: number, completed: boolean }) => {
  if (watchData) {
    const response = await api.post(`/videos/videos/${videoId}/watch/`, watchData);
    return response.data;
  } else {
    const response = await api.get(`/videos/videos/${videoId}/watch/`);
    return response.data;
  }
};

// 获取直播详情
export const getLiveStreamingDetail = async (liveId: number) => {
  try {
    // 使用正确的API路径
    console.log(`API调用: 获取直播详情 ID=${liveId} (使用live API)`);
    const response = await api.get(`/live/events/${liveId}/`);
    console.log(`API响应: 直播详情获取成功 ID=${liveId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 获取直播详情失败 ID=${liveId}`, error.response?.status);
    throw error;
  }
};

// 开始直播（教师操作）
export const startLiveStreaming = async (liveId: number) => {
  try {
    console.log(`API调用: 开始直播 ID=${liveId} (使用live API)`);
    const response = await api.post(`/live/events/${liveId}/start_live/`);
    console.log(`API响应: 直播开始成功 ID=${liveId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 开始直播失败 ID=${liveId}`, error.response?.status);
    throw error;
  }
};

// 结束直播（教师操作）
export const endLiveStreaming = async (liveId: number) => {
  try {
    console.log(`API调用: 结束直播 ID=${liveId} (使用live API)`);
    const response = await api.post(`/live/events/${liveId}/end_live/`);
    console.log(`API响应: 直播结束成功 ID=${liveId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 结束直播失败 ID=${liveId}`, error.response?.status);
    throw error;
  }
};

// 加入直播（学生操作）
export const joinLiveStreaming = async (liveId: number) => {
  try {
    console.log(`API调用: 报名直播 ID=${liveId} (使用live API)`);
    const response = await api.post(`/live/events/${liveId}/enroll/`);
    console.log(`API响应: 直播报名成功 ID=${liveId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 报名直播失败 ID=${liveId}`, error.response?.status);
    throw error;
  }
};

// 离开直播（学生操作）
export const leaveLiveStreaming = async (liveId: number) => {
  try {
    console.log(`API调用: 离开直播 ID=${liveId} (使用live API)`);
    // 注意：后端可能尚未实现该接口，可能需要创建
    const response = await api.post(`/live/events/${liveId}/leave/`);
    console.log(`API响应: 离开直播成功 ID=${liveId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 离开直播失败 ID=${liveId}`, error.response?.status);
    throw error;
  }
};

// 获取直播出席记录（教师操作）
export const getLiveStreamingAttendances = async (liveId: number) => {
  try {
    console.log(`API调用: 获取直播出席记录 ID=${liveId} (使用live API)`);
    // 注意：后端可能尚未实现该接口，可能需要创建
    const response = await api.get(`/live/events/${liveId}/attendances/`);
    console.log(`API响应: 获取出席记录成功 ID=${liveId}`, response.status);
    return response.data;
  } catch (error: any) {
    console.error(`API错误: 获取出席记录失败 ID=${liveId}`, error.response?.status);
    throw error;
  }
};

// 获取视频观看历史
export const getVideoWatchHistory = async () => {
  const response = await api.get('/videos/watch-history/');
  return response.data;
}; 