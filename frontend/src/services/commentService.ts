import api from './api';
import { Comment, Notification } from '../types';

// 获取评论列表
export const getComments = async (params?: any) => {
  const response = await api.get('/comments/comments/', { params });
  return response.data;
};

// 创建评论
export const createComment = async (commentData: {
  content: string;
  content_type_name: string;
  object_id: number;
  parent?: number;
}) => {
  const response = await api.post('/comments/comments/', commentData);
  return response.data;
};

// 点赞评论
export const likeComment = async (commentId: number) => {
  const response = await api.post(`/comments/comments/${commentId}/like/`);
  return response.data;
};

// 取消点赞评论
export const unlikeComment = async (commentId: number) => {
  const response = await api.post(`/comments/comments/${commentId}/unlike/`);
  return response.data;
};

// 获取通知列表
export const getNotifications = async () => {
  const response = await api.get('/comments/notifications/');
  return response.data;
};

// 获取未读通知数量
export const getUnreadNotificationCount = async () => {
  const response = await api.get('/comments/notifications/unread_count/');
  return response.data;
};

// 标记通知为已读
export const markNotificationAsRead = async (notificationId: number) => {
  const response = await api.post(`/comments/notifications/${notificationId}/mark_read/`);
  return response.data;
};

// 标记所有通知为已读
export const markAllNotificationsAsRead = async () => {
  const response = await api.post('/comments/notifications/mark_all_read/');
  return response.data;
}; 