import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Course, Category, Enrollment, Section, Lesson } from '../../types';
import * as courseService from '../../services/courseService';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  categories: Category[];
  enrollments: Enrollment[];
  currentSection: Section | null;
  currentLesson: Lesson | null;
  courseProgress: any | null;
  loading: boolean;
  error: null | string | {
    message: string;
    statusCode?: number;
    notFound?: boolean;
  };
  totalPages: number;
  currentPage: number;
}

const initialState: CourseState = {
  courses: [],
  currentCourse: null,
  categories: [],
  enrollments: [],
  currentSection: null,
  currentLesson: null,
  courseProgress: null,
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
};

// 获取课程列表
export const fetchCourses = createAsyncThunk(
  'course/fetchCourses',
  async (params: any = { page: 1 }, { rejectWithValue }) => {
    try {
      const response = await courseService.getCourses(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取课程列表失败');
    }
  }
);

// 获取教师创建的课程
export const fetchTeacherCourses = createAsyncThunk(
  'course/fetchTeacherCourses',
  async (_, { rejectWithValue }) => {
    try {
      console.log('获取教师课程列表...');
      const response = await courseService.getTeacherCourses();
      console.log('教师课程获取成功:', response);
      return response;
    } catch (error: any) {
      console.error('获取教师课程失败:', error);
      // 如果是404错误，返回空数组，这样UI可以显示一个空列表而不是错误信息
      if (error.response?.status === 404) {
        console.log('API端点不存在，返回空数组');
        return [];
      }
      
      const errorMessage = error.response?.data?.detail 
        || (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : null)
        || error.message
        || '获取教师课程失败';
      return rejectWithValue(errorMessage);
    }
  }
);

// 创建新课程
export const createCourse = createAsyncThunk(
  'course/createCourse',
  async (courseData: any, { rejectWithValue }) => {
    try {
      console.log('Redux - 开始创建课程:', courseData);
      const response = await courseService.createCourse(courseData);
      console.log('Redux - 课程创建成功:', response);
      return response;
    } catch (error: any) {
      // 提取更详细的错误信息
      const errorResponse = error.response?.data;
      const errorMessage = error.response?.data?.detail 
        || (typeof errorResponse === 'object' ? JSON.stringify(errorResponse) : null)
        || error.message
        || '创建课程失败';
      console.error('Redux - 创建课程失败. 错误响应:', errorResponse);
      console.error('Redux - 创建课程失败. 错误消息:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// 更新课程
export const updateCourse = createAsyncThunk(
  'course/updateCourse',
  async ({ courseId, courseData }: { courseId: number; courseData: any }, { rejectWithValue }) => {
    try {
      const response = await courseService.updateCourse(courseId, courseData);
      return response;
    } catch (error: any) {
      // 提取更详细的错误信息
      const errorMessage = error.response?.data?.detail 
        || (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : null)
        || error.message
        || '更新课程失败';
      console.error('详细错误内容:', error.response?.data);
      return rejectWithValue(errorMessage);
    }
  }
);

// 获取课程详情
export const fetchCourseDetail = createAsyncThunk(
  'course/fetchCourseDetail',
  async (courseId: number, { rejectWithValue }) => {
    try {
      console.log(`Redux调用: 获取课程详情 ID=${courseId}`);
      const response = await courseService.getCourseDetail(courseId);
      console.log(`Redux成功: 课程详情获取成功 ID=${courseId}`);
      return response;
    } catch (error: any) {
      console.error(`Redux错误: 获取课程详情失败 ID=${courseId}`);
      // 如果是404错误，返回特殊的错误对象，便于UI处理
      if (error.response?.status === 404) {
        return rejectWithValue({
          message: '课程不存在或已被删除',
          statusCode: 404,
          notFound: true
        });
      }
      
      const errorMessage = error.response?.data?.detail 
        || (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : null)
        || error.message
        || '获取课程详情失败';
      return rejectWithValue({
        message: errorMessage,
        statusCode: error.response?.status
      });
    }
  }
);

// 获取课程分类
export const fetchCategories = createAsyncThunk(
  'course/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await courseService.getCategories();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取课程分类失败');
    }
  }
);

// 报名课程
export const enrollInCourse = createAsyncThunk(
  'course/enrollInCourse',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await courseService.enrollCourse(courseId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '报名课程失败');
    }
  }
);

// 获取用户报名的课程
export const fetchUserEnrollments = createAsyncThunk(
  'course/fetchUserEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await courseService.getUserEnrollments();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取报名记录失败');
    }
  }
);

// 获取课程学习进度
export const fetchCourseProgress = createAsyncThunk(
  'course/fetchCourseProgress',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await courseService.getCourseProgress(courseId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取学习进度失败');
    }
  }
);

// 获取章节详情
export const fetchSectionDetail = createAsyncThunk(
  'course/fetchSectionDetail',
  async (sectionId: number, { rejectWithValue }) => {
    try {
      const response = await courseService.getSectionDetail(sectionId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取章节详情失败');
    }
  }
);

// 获取课时详情
export const fetchLessonDetail = createAsyncThunk(
  'course/fetchLessonDetail',
  async (lessonId: number, { rejectWithValue }) => {
    try {
      const response = await courseService.getLessonDetail(lessonId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取课时详情失败');
    }
  }
);

// 更新课时学习进度
export const updateLessonProgress = createAsyncThunk(
  'course/updateLessonProgress',
  async (
    { lessonId, progressData }: { lessonId: number; progressData: { progress_percent: number; last_position: number } },
    { rejectWithValue }
  ) => {
    try {
      const response = await courseService.updateLessonProgress(lessonId, progressData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '更新学习进度失败');
    }
  }
);

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    clearCourseState: (state) => {
      state.currentCourse = null;
      state.currentSection = null;
      state.currentLesson = null;
      state.courseProgress = null;
    },
    clearCourseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 获取课程列表
    builder.addCase(fetchCourses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCourses.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.courses = action.payload.results;
      state.totalPages = Math.ceil(action.payload.count / 10); // 假设每页10条
      state.currentPage = action.payload.current_page || 1;
    });
    builder.addCase(fetchCourses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取教师课程列表
    builder.addCase(fetchTeacherCourses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTeacherCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
      state.loading = false;
      state.courses = action.payload;
    });
    builder.addCase(fetchTeacherCourses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 创建课程
    builder.addCase(createCourse.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createCourse.fulfilled, (state, action: PayloadAction<Course>) => {
      state.loading = false;
      state.courses = [action.payload, ...state.courses];
      state.currentCourse = action.payload;
    });
    builder.addCase(createCourse.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 更新课程
    builder.addCase(updateCourse.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCourse.fulfilled, (state, action: PayloadAction<Course>) => {
      state.loading = false;
      state.currentCourse = action.payload;
      state.courses = state.courses.map(course => 
        course.id === action.payload.id ? action.payload : course
      );
    });
    builder.addCase(updateCourse.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // 获取课程详情
    builder.addCase(fetchCourseDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCourseDetail.fulfilled, (state, action: PayloadAction<Course>) => {
      state.loading = false;
      state.currentCourse = action.payload;
    });
    builder.addCase(fetchCourseDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取课程分类
    builder.addCase(fetchCategories.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
      state.loading = false;
      state.categories = action.payload;
    });
    builder.addCase(fetchCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 报名课程
    builder.addCase(enrollInCourse.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(enrollInCourse.fulfilled, (state, action: PayloadAction<Enrollment>) => {
      state.loading = false;
      if (state.currentCourse) {
        state.currentCourse.is_enrolled = true;
      }
      state.enrollments = [...state.enrollments, action.payload];
    });
    builder.addCase(enrollInCourse.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取用户报名的课程
    builder.addCase(fetchUserEnrollments.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUserEnrollments.fulfilled, (state, action: PayloadAction<Enrollment[]>) => {
      state.loading = false;
      state.enrollments = action.payload;
    });
    builder.addCase(fetchUserEnrollments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取课程学习进度
    builder.addCase(fetchCourseProgress.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCourseProgress.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.courseProgress = action.payload;
    });
    builder.addCase(fetchCourseProgress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // 获取章节详情
    builder.addCase(fetchSectionDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSectionDetail.fulfilled, (state, action: PayloadAction<Section>) => {
      state.loading = false;
      state.currentSection = action.payload;
    });
    builder.addCase(fetchSectionDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取课时详情
    builder.addCase(fetchLessonDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchLessonDetail.fulfilled, (state, action: PayloadAction<Lesson>) => {
      state.loading = false;
      state.currentLesson = action.payload;
    });
    builder.addCase(fetchLessonDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 更新课时学习进度
    builder.addCase(updateLessonProgress.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateLessonProgress.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      // 更新进度状态，可能需要更新currentLesson或courseProgress
    });
    builder.addCase(updateLessonProgress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearCourseState, clearCourseError } = courseSlice.actions;
export default courseSlice.reducer; 