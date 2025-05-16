import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import videoReducer from './slices/videoSlice';
import quizReducer from './slices/quizSlice';
import commentReducer from './slices/commentSlice';
import notificationReducer from './slices/notificationSlice';
import liveReducer from './slices/liveSlice';

// 创建并配置Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    course: courseReducer,
    video: videoReducer,
    quiz: quizReducer,
    comment: commentReducer,
    notification: notificationReducer,
    live: liveReducer,
  },
  // 添加中间件配置以修复TypeScript dispatch类型问题
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 