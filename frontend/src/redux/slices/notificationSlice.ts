import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';
import * as commentService from '../../services/commentService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
};

// 获取通知列表
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await commentService.getNotifications();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取通知失败');
    }
  }
);

// 获取未读通知数量
export const fetchUnreadNotificationCount = createAsyncThunk(
  'notification/fetchUnreadNotificationCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await commentService.getUnreadNotificationCount();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取未读通知数量失败');
    }
  }
);

// 标记通知为已读
export const markNotificationAsRead = createAsyncThunk(
  'notification/markNotificationAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const response = await commentService.markNotificationAsRead(notificationId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '标记通知为已读失败');
    }
  }
);

// 标记所有通知为已读
export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await commentService.markAllNotificationsAsRead();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '标记所有通知为已读失败');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 获取通知列表
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.notifications = action.payload.results;
      state.totalPages = Math.ceil(action.payload.count / 10); // 假设每页10条
      state.currentPage = action.payload.current_page || 1;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取未读通知数量
    builder.addCase(fetchUnreadNotificationCount.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUnreadNotificationCount.fulfilled, (state, action: PayloadAction<{ unread_count: number }>) => {
      state.loading = false;
      state.unreadCount = action.payload.unread_count;
    });
    builder.addCase(fetchUnreadNotificationCount.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 标记通知为已读
    builder.addCase(markNotificationAsRead.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
      state.loading = false;
      // 更新通知状态
      const notification = state.notifications.find((n) => n.id === action.payload.id);
      if (notification) {
        notification.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });
    builder.addCase(markNotificationAsRead.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 标记所有通知为已读
    builder.addCase(markAllNotificationsAsRead.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.loading = false;
      // 更新所有通知为已读
      state.notifications.forEach((notification) => {
        notification.is_read = true;
      });
      state.unreadCount = 0;
    });
    builder.addCase(markAllNotificationsAsRead.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer; 