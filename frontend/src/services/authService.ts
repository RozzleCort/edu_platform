import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

// 登录服务
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/accounts/token/', credentials);
  return response.data;
};

// 注册服务
export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/accounts/register/', userData);
  return response.data;
};

// 刷新令牌
export const refreshToken = async (refreshToken: string): Promise<{access: string}> => {
  const response = await api.post<{access: string}>('/accounts/token/refresh/', { refresh: refreshToken });
  return response.data;
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  const response = await api.get('/accounts/users/me/');
  return response.data;
};

// 修改用户资料
export const updateProfile = async (userId: number, profileData: any) => {
  const response = await api.put(`/accounts/users/${userId}/update-profile/`, profileData);
  return response.data;
};

// 修改密码
export const changePassword = async (userId: number, passwordData: {old_password: string, new_password: string, confirm_password: string}) => {
  const response = await api.put(`/accounts/users/${userId}/change-password/`, passwordData);
  return response.data;
}; 