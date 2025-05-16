import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, LoginRequest, RegisterRequest, User } from '../../types';
import * as authService from '../../services/authService';

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null,
};

// 异步Action: 登录
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.login(credentials);
      // 保存token到localStorage
      localStorage.setItem('token', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      
      console.log('登录成功，正在触发数据刷新');
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '登录失败');
    }
  }
);

// 异步Action: 注册
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      // 注册成功后自动登录
      localStorage.setItem('token', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || '注册失败');
    }
  }
);

// 异步Action: 获取当前用户信息
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取用户信息失败');
    }
  }
);

// 异步Action: 更新用户资料
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: any, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.user) {
        throw new Error('用户未登录');
      }
      const response = await authService.updateProfile(state.auth.user.id, profileData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || '更新资料失败');
    }
  }
);

// 认证Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 登录
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.access;
      state.refreshToken = action.payload.refresh;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 注册
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.access;
      state.refreshToken = action.payload.refresh;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 加载用户信息
    builder.addCase(loadUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    });
    builder.addCase(loadUser.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload as string;
    });

    // 更新用户资料
    builder.addCase(updateProfile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 