import axios from 'axios';

// API基础URL
const API_BASE_URL = 'http://localhost:8000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 如果是登录或注册响应，自动触发数据刷新
    if (response.config.url?.includes('/accounts/token/')) {
      console.log('检测到登录/注册操作，将在响应后刷新数据');
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是401错误并且不是刷新token的请求
    if (error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/accounts/token/refresh/') {
      originalRequest._retry = true;
      
      try {
        // 尝试刷新token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // 如果没有刷新令牌，清除登录状态并重定向到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const res = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
          refresh: refreshToken,
        });
        
        if (res.data.access) {
          // 更新token
          localStorage.setItem('token', res.data.access);
          // 更新请求头部并重试原始请求
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 刷新token失败，清除登录状态并重定向到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 