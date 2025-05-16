import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Comment } from '../../types';
import * as commentService from '../../services/commentService';

interface CommentState {
  comments: Comment[];
  replies: { [parentId: number]: Comment[] };
  loading: boolean;
  error: string | null;
  totalComments: number;
  totalPages: number;
  currentPage: number;
}

const initialState: CommentState = {
  comments: [],
  replies: {},
  loading: false,
  error: null,
  totalComments: 0,
  totalPages: 1,
  currentPage: 1,
};

// 获取评论列表
export const fetchComments = createAsyncThunk(
  'comment/fetchComments',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await commentService.getComments(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取评论失败');
    }
  }
);

// 创建评论
export const createComment = createAsyncThunk(
  'comment/createComment',
  async (
    commentData: {
      content: string;
      content_type_name: string;
      object_id: number;
      parent?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await commentService.createComment(commentData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '创建评论失败');
    }
  }
);

// 点赞评论
export const likeComment = createAsyncThunk(
  'comment/likeComment',
  async (commentId: number, { rejectWithValue }) => {
    try {
      const response = await commentService.likeComment(commentId);
      return { commentId, response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '点赞评论失败');
    }
  }
);

// 取消点赞评论
export const unlikeComment = createAsyncThunk(
  'comment/unlikeComment',
  async (commentId: number, { rejectWithValue }) => {
    try {
      await commentService.unlikeComment(commentId);
      return commentId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '取消点赞失败');
    }
  }
);

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    clearCommentState: (state) => {
      state.comments = [];
      state.replies = {};
      state.currentPage = 1;
    },
    clearCommentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 获取评论列表
    builder.addCase(fetchComments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchComments.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      // 如果获取的是顶级评论
      if (!action.payload.parent || action.payload.parent === 'null') {
        state.comments = action.payload.results;
        state.totalComments = action.payload.count;
        state.totalPages = Math.ceil(action.payload.count / 10); // 假设每页10条
        state.currentPage = action.payload.current_page || 1;
      } else {
        // 如果获取的是回复
        const parentId = parseInt(action.payload.parent);
        state.replies[parentId] = action.payload.results;
      }
    });
    builder.addCase(fetchComments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 创建评论
    builder.addCase(createComment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(createComment.fulfilled, (state, action: PayloadAction<Comment>) => {
      state.loading = false;
      if (!action.payload.parent) {
        // 顶级评论
        state.comments = [action.payload, ...state.comments];
        state.totalComments += 1;
      } else {
        // 回复
        const parentId = action.payload.parent;
        if (state.replies[parentId]) {
          state.replies[parentId] = [action.payload, ...state.replies[parentId]];
        } else {
          state.replies[parentId] = [action.payload];
        }
        // 更新评论中的回复计数
        const parentComment = state.comments.find((c) => c.id === parentId);
        if (parentComment) {
          parentComment.reply_count += 1;
        }
      }
    });
    builder.addCase(createComment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 点赞评论
    builder.addCase(likeComment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(likeComment.fulfilled, (state, action: PayloadAction<{ commentId: number; response: any }>) => {
      state.loading = false;
      const { commentId } = action.payload;
      // 更新评论的点赞状态
      const updateComment = (comment: Comment) => {
        if (comment.id === commentId) {
          comment.is_liked = true;
          comment.like_count += 1;
          return true;
        }
        return false;
      };

      // 查找并更新顶级评论
      const foundInComments = state.comments.some(updateComment);

      // 如果不在顶级评论中，查找回复
      if (!foundInComments) {
        Object.keys(state.replies).forEach((parentId) => {
          state.replies[parseInt(parentId)].some(updateComment);
        });
      }
    });
    builder.addCase(likeComment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 取消点赞评论
    builder.addCase(unlikeComment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(unlikeComment.fulfilled, (state, action: PayloadAction<number>) => {
      state.loading = false;
      const commentId = action.payload;
      // 更新评论的点赞状态
      const updateComment = (comment: Comment) => {
        if (comment.id === commentId) {
          comment.is_liked = false;
          comment.like_count -= 1;
          return true;
        }
        return false;
      };

      // 查找并更新顶级评论
      const foundInComments = state.comments.some(updateComment);

      // 如果不在顶级评论中，查找回复
      if (!foundInComments) {
        Object.keys(state.replies).forEach((parentId) => {
          state.replies[parseInt(parentId)].some(updateComment);
        });
      }
    });
    builder.addCase(unlikeComment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearCommentState, clearCommentError } = commentSlice.actions;
export default commentSlice.reducer; 