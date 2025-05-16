import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Video, LiveStreaming, VideoWatchHistory } from '../../types';
import * as videoService from '../../services/videoService';

interface VideoState {
  currentVideo: Video | null;
  currentLiveStream: LiveStreaming | null;
  watchHistory: VideoWatchHistory[];
  liveAttendances: any[];
  loading: boolean;
  error: string | null;
  currentProgress: {
    watched_duration: number;
    last_position: number;
    completed: boolean;
  } | null;
}

const initialState: VideoState = {
  currentVideo: null,
  currentLiveStream: null,
  watchHistory: [],
  liveAttendances: [],
  loading: false,
  error: null,
  currentProgress: null,
};

// 获取视频详情
export const fetchVideoDetail = createAsyncThunk(
  'video/fetchVideoDetail',
  async (videoId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.getVideoDetail(videoId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取视频详情失败');
    }
  }
);

// 获取视频观看历史和进度
export const fetchVideoProgress = createAsyncThunk(
  'video/fetchVideoProgress',
  async (videoId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.watchVideo(videoId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取视频进度失败');
    }
  }
);

// 更新视频观看进度
export const updateVideoProgress = createAsyncThunk(
  'video/updateVideoProgress',
  async (
    { videoId, watchData }: { videoId: number; watchData: { watched_duration: number; last_position: number; completed: boolean } },
    { rejectWithValue }
  ) => {
    try {
      const response = await videoService.watchVideo(videoId, watchData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '更新视频进度失败');
    }
  }
);

// 获取直播详情
export const fetchLiveStreamDetail = createAsyncThunk(
  'video/fetchLiveStreamDetail',
  async (liveId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.getLiveStreamingDetail(liveId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取直播详情失败');
    }
  }
);

// 开始直播
export const startLiveStream = createAsyncThunk(
  'video/startLiveStream',
  async (liveId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.startLiveStreaming(liveId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '开始直播失败');
    }
  }
);

// 结束直播
export const endLiveStream = createAsyncThunk(
  'video/endLiveStream',
  async (liveId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.endLiveStreaming(liveId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '结束直播失败');
    }
  }
);

// 加入直播
export const joinLiveStream = createAsyncThunk(
  'video/joinLiveStream',
  async (liveId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.joinLiveStreaming(liveId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '加入直播失败');
    }
  }
);

// 离开直播
export const leaveLiveStream = createAsyncThunk(
  'video/leaveLiveStream',
  async (liveId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.leaveLiveStreaming(liveId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '离开直播失败');
    }
  }
);

// 获取直播出席记录
export const fetchLiveAttendances = createAsyncThunk(
  'video/fetchLiveAttendances',
  async (liveId: number, { rejectWithValue }) => {
    try {
      const response = await videoService.getLiveStreamingAttendances(liveId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取出席记录失败');
    }
  }
);

// 获取视频观看历史
export const fetchVideoWatchHistory = createAsyncThunk(
  'video/fetchVideoWatchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await videoService.getVideoWatchHistory();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取观看历史失败');
    }
  }
);

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    clearVideoState: (state) => {
      state.currentVideo = null;
      state.currentLiveStream = null;
      state.currentProgress = null;
    },
    clearVideoError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 获取视频详情
    builder.addCase(fetchVideoDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchVideoDetail.fulfilled, (state, action: PayloadAction<Video>) => {
      state.loading = false;
      state.currentVideo = action.payload;
    });
    builder.addCase(fetchVideoDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取视频观看进度
    builder.addCase(fetchVideoProgress.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchVideoProgress.fulfilled, (state, action: PayloadAction<VideoWatchHistory>) => {
      state.loading = false;
      state.currentProgress = {
        watched_duration: action.payload.watched_duration,
        last_position: action.payload.last_position,
        completed: action.payload.completed,
      };
    });
    builder.addCase(fetchVideoProgress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 更新视频观看进度
    builder.addCase(updateVideoProgress.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateVideoProgress.fulfilled, (state, action: PayloadAction<VideoWatchHistory>) => {
      state.loading = false;
      state.currentProgress = {
        watched_duration: action.payload.watched_duration,
        last_position: action.payload.last_position,
        completed: action.payload.completed,
      };
    });
    builder.addCase(updateVideoProgress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取直播详情
    builder.addCase(fetchLiveStreamDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchLiveStreamDetail.fulfilled, (state, action: PayloadAction<LiveStreaming>) => {
      state.loading = false;
      state.currentLiveStream = action.payload;
    });
    builder.addCase(fetchLiveStreamDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 开始直播
    builder.addCase(startLiveStream.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(startLiveStream.fulfilled, (state, action: PayloadAction<LiveStreaming>) => {
      state.loading = false;
      state.currentLiveStream = action.payload;
    });
    builder.addCase(startLiveStream.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 结束直播
    builder.addCase(endLiveStream.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(endLiveStream.fulfilled, (state, action: PayloadAction<LiveStreaming>) => {
      state.loading = false;
      state.currentLiveStream = action.payload;
    });
    builder.addCase(endLiveStream.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 加入直播
    builder.addCase(joinLiveStream.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(joinLiveStream.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      // 可以在这里添加加入直播的状态更新
    });
    builder.addCase(joinLiveStream.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 离开直播
    builder.addCase(leaveLiveStream.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(leaveLiveStream.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      // 可以在这里添加离开直播的状态更新
    });
    builder.addCase(leaveLiveStream.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取直播出席记录
    builder.addCase(fetchLiveAttendances.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchLiveAttendances.fulfilled, (state, action: PayloadAction<any[]>) => {
      state.loading = false;
      state.liveAttendances = action.payload;
    });
    builder.addCase(fetchLiveAttendances.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取视频观看历史
    builder.addCase(fetchVideoWatchHistory.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchVideoWatchHistory.fulfilled, (state, action: PayloadAction<VideoWatchHistory[]>) => {
      state.loading = false;
      state.watchHistory = action.payload;
    });
    builder.addCase(fetchVideoWatchHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearVideoState, clearVideoError } = videoSlice.actions;
export default videoSlice.reducer; 