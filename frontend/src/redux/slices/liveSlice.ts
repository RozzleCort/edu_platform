import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as liveService from '../../services/liveService';
import { LiveEvent, LiveChatMessage } from '../../types';

// 定义直播状态类型
interface LiveState {
  liveEvents: LiveEvent[];
  currentLiveEvent: LiveEvent | null;
  chatMessages: LiveChatMessage[];
  loading: boolean;
  error: string | null;
  totalEvents: number;
  totalPages: number;
  currentPage: number;
}

// 初始状态
const initialState: LiveState = {
  liveEvents: [],
  currentLiveEvent: null,
  chatMessages: [],
  loading: false,
  error: null,
  totalEvents: 0,
  totalPages: 0,
  currentPage: 1
};

// 异步 Thunks
// 获取直播列表
export const fetchLiveEvents = createAsyncThunk(
  'live/fetchLiveEvents',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await liveService.getLiveEvents(params);
      return {
        liveEvents: response.results,
        count: response.count,
        totalPages: Math.ceil(response.count / 10),
        currentPage: params.page || 1
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取直播列表失败');
    }
  }
);

// 获取教师直播列表
export const fetchTeacherLiveEvents = createAsyncThunk(
  'live/fetchTeacherLiveEvents',
  async (_, { rejectWithValue, getState }) => {
    try {
      console.log('准备获取教师直播列表');
      const response = await liveService.getTeacherLiveEvents();
      console.log('直播API响应:', response);
      
      // 获取当前用户ID
      const state = getState() as any;
      const currentUserId = state.auth.user?.id;
      console.log('当前用户ID:', currentUserId);
      
      // 在前端过滤属于当前教师的直播
      const filteredEvents = currentUserId 
        ? response.results.filter((event: any) => {
            console.log('直播:', event.title, '教师ID:', event.instructor?.id);
            return event.instructor?.id === currentUserId;
          })
        : response.results;
      
      console.log('过滤后的直播数量:', filteredEvents.length);
      return {
        liveEvents: filteredEvents,
        count: filteredEvents.length,
        totalPages: Math.ceil(filteredEvents.length / 10),
        currentPage: 1
      };
    } catch (error: any) {
      console.error('获取教师直播列表失败:', error);
      return rejectWithValue(error.response?.data?.detail || '获取教师直播列表失败');
    }
  }
);

// 获取直播详情
export const fetchLiveEventDetail = createAsyncThunk(
  'live/fetchLiveEventDetail',
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response = await liveService.getLiveEventDetail(eventId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取直播详情失败');
    }
  }
);

// 创建直播
export const createLiveEvent = createAsyncThunk(
  'live/createLiveEvent',
  async (liveData: any, { rejectWithValue }) => {
    try {
      console.log('Thunk - 创建直播请求数据:', JSON.stringify(liveData, null, 2));
      const response = await liveService.createLiveEvent(liveData);
      console.log('Thunk - 创建直播响应结果:', response);
      return response;
    } catch (error: any) {
      console.error('Thunk - 创建直播失败:', error);
      // 尝试提取错误详情
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('服务器错误详情:', errorData);
        
        // 错误可能是对象或字符串
        if (typeof errorData === 'object') {
          // 将对象中的错误转换为字符串形式
          const errorMessages = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          return rejectWithValue(errorMessages);
        }
        
        return rejectWithValue(errorData);
      }
      
      return rejectWithValue(error.message || '创建直播失败');
    }
  }
);

// 报名直播
export const enrollLiveEvent = createAsyncThunk(
  'live/enrollLiveEvent',
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response = await liveService.enrollLiveEvent(eventId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '报名直播失败');
    }
  }
);

// 获取聊天消息
export const fetchChatMessages = createAsyncThunk(
  'live/fetchChatMessages',
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response = await liveService.getLiveChatMessages(eventId);
      return response.results || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取聊天消息失败');
    }
  }
);

// 发送聊天消息
export const sendChatMessage = createAsyncThunk(
  'live/sendChatMessage',
  async ({ eventId, message }: { eventId: number, message: string }, { rejectWithValue, getState }) => {
    try {
      // 检查消息是否为空
      if (!message || message.trim().length === 0) {
        return rejectWithValue('消息内容不能为空');
      }
      
      // 检查是否已经获取了直播详情
      const state = getState() as any;
      const currentLiveEvent = state.live.currentLiveEvent;
      
      if (!currentLiveEvent) {
        return rejectWithValue('未获取直播信息，无法发送消息');
      }
      
      // 检查直播状态
      if (currentLiveEvent.status !== 'live') {
        return rejectWithValue('只有在直播进行中才能发送消息');
      }
      
      // 检查是否已报名
      if (!currentLiveEvent.is_enrolled) {
        return rejectWithValue('请先报名参加直播后再发送消息');
      }
      
      console.log(`Thunk - 发送消息: ID=${eventId}, 内容="${message}"`);
      const response = await liveService.sendLiveChatMessage(eventId, message);
      console.log('Thunk - 发送消息成功:', response);
      return response;
    } catch (error: any) {
      console.error('Thunk - 发送消息失败:', error);
      // 尝试提取错误信息
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('服务器错误详情:', errorData);
        
        if (typeof errorData === 'object') {
          // 将错误对象转换为字符串形式
          const errorMessages = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          return rejectWithValue(errorMessages);
        }
        
        return rejectWithValue(errorData);
      }
      
      return rejectWithValue(error.message || '发送消息失败');
    }
  }
);

// 开始直播
export const startLiveEvent = createAsyncThunk(
  'live/startLiveEvent',
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response = await liveService.startLiveEvent(eventId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '开始直播失败');
    }
  }
);

// 结束直播
export const endLiveEvent = createAsyncThunk(
  'live/endLiveEvent',
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response = await liveService.endLiveEvent(eventId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '结束直播失败');
    }
  }
);

// 删除直播
export const deleteLiveEvent = createAsyncThunk(
  'live/deleteLiveEvent',
  async (eventId: number, { rejectWithValue, dispatch }) => {
    try {
      console.log('准备删除直播:', eventId);
      await liveService.deleteLiveEvent(eventId);
      
      // 删除成功后重新获取直播列表
      dispatch(fetchTeacherLiveEvents());
      
      return eventId;
    } catch (error: any) {
      console.error('删除直播失败:', error);
      return rejectWithValue(error.response?.data?.detail || '删除直播失败');
    }
  }
);

// 创建 slice
const liveSlice = createSlice({
  name: 'live',
  initialState,
  reducers: {
    clearLiveEventDetail: (state) => {
      state.currentLiveEvent = null;
    },
    clearLiveEvents: (state) => {
      state.liveEvents = [];
    },
    clearChatMessages: (state) => {
      state.chatMessages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取直播列表
      .addCase(fetchLiveEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveEvents.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.liveEvents = action.payload.liveEvents;
        state.totalEvents = action.payload.count;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchLiveEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 获取教师直播列表
      .addCase(fetchTeacherLiveEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherLiveEvents.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.liveEvents = action.payload.liveEvents;
        state.totalEvents = action.payload.count;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTeacherLiveEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 获取直播详情
      .addCase(fetchLiveEventDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveEventDetail.fulfilled, (state, action: PayloadAction<LiveEvent>) => {
        state.loading = false;
        state.currentLiveEvent = action.payload;
      })
      .addCase(fetchLiveEventDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 创建直播
      .addCase(createLiveEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLiveEvent.fulfilled, (state, action: PayloadAction<LiveEvent>) => {
        state.loading = false;
        state.currentLiveEvent = action.payload;
      })
      .addCase(createLiveEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 报名直播
      .addCase(enrollLiveEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enrollLiveEvent.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentLiveEvent) {
          state.currentLiveEvent.is_enrolled = true;
          state.currentLiveEvent.enrollments_count += 1;
        }
      })
      .addCase(enrollLiveEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 获取聊天消息
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action: PayloadAction<LiveChatMessage[]>) => {
        state.loading = false;
        state.chatMessages = action.payload;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 发送聊天消息
      .addCase(sendChatMessage.fulfilled, (state, action: PayloadAction<LiveChatMessage>) => {
        state.chatMessages.push(action.payload);
      })
      
      // 开始直播
      .addCase(startLiveEvent.fulfilled, (state, action: PayloadAction<LiveEvent>) => {
        state.currentLiveEvent = action.payload;
        // 更新直播列表中的该直播状态
        const index = state.liveEvents.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.liveEvents[index] = action.payload;
        }
      })
      
      // 结束直播
      .addCase(endLiveEvent.fulfilled, (state, action: PayloadAction<LiveEvent>) => {
        state.currentLiveEvent = action.payload;
        // 更新直播列表中的该直播状态
        const index = state.liveEvents.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.liveEvents[index] = action.payload;
        }
      })
      .addCase(endLiveEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 删除直播
      .addCase(deleteLiveEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLiveEvent.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        // 从本地数组中删除这个直播
        state.liveEvents = state.liveEvents.filter(event => event.id !== action.payload);
      })
      .addCase(deleteLiveEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出 actions
export const { clearLiveEventDetail, clearLiveEvents, clearChatMessages } = liveSlice.actions;

// 导出 reducer
export default liveSlice.reducer; 