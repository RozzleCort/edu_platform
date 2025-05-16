import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Quiz, Question, QuizAttempt, Answer } from '../../types';
import * as quizService from '../../services/quizService';

interface QuizState {
  currentQuiz: Quiz | null;
  currentQuestion: Question | null;
  currentAttempt: QuizAttempt | null;
  userAttempts: QuizAttempt[];
  submittedAnswers: Answer[];
  loading: boolean;
  error: string | null;
  timeRemaining: number | null;
  quizStatistics: any | null;
  studentPerformance: any | null;
  teacherQuizzes: Quiz[];
  quizzes: Quiz[];
}

const initialState: QuizState = {
  currentQuiz: null,
  currentQuestion: null,
  currentAttempt: null,
  userAttempts: [],
  submittedAnswers: [],
  loading: false,
  error: null,
  timeRemaining: null,
  quizStatistics: null,
  studentPerformance: null,
  teacherQuizzes: [],
  quizzes: []
};

// 获取测验详情
export const fetchQuizDetail = createAsyncThunk(
  'quiz/fetchQuizDetail',
  async (quizId: number, { rejectWithValue, dispatch }) => {
    try {
      // 获取测验详情
      const quizResponse = await quizService.getQuizDetail(quizId);
      
      try {
        // 尝试获取用户的测验尝试次数
        const attemptsCount = await quizService.getUserQuizAttemptsCount(quizId);
        // 将尝试次数添加到测验详情中
        return {
          ...quizResponse,
          user_attempts_count: attemptsCount
        };
      } catch (error) {
        // 如果获取尝试次数失败，仍然返回测验详情，但不包含尝试次数
        console.error('获取测验尝试次数失败:', error);
        return quizResponse;
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取测验详情失败');
    }
  }
);

// 开始测验尝试
export const startQuizAttempt = createAsyncThunk(
  'quiz/startQuizAttempt',
  async (quizId: number, { rejectWithValue }) => {
    try {
      const response = await quizService.startQuizAttempt(quizId);
      return response;
    } catch (error: any) {
      // 格式化错误信息
      let errorMessage = '开始测验失败';
      
      if (error.response?.data) {
        if (Array.isArray(error.response.data)) {
          errorMessage = error.response.data.join(', ');
        } else if (typeof error.response.data === 'object') {
          const messages = [];
          for (const key in error.response.data) {
            if (Array.isArray(error.response.data[key])) {
              messages.push(...error.response.data[key]);
            } else {
              messages.push(error.response.data[key]);
            }
          }
          errorMessage = messages.join(', ');
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// 获取测验尝试详情
export const fetchQuizAttemptDetail = createAsyncThunk(
  'quiz/fetchQuizAttemptDetail',
  async (attemptId: number, { rejectWithValue }) => {
    try {
      const response = await quizService.getQuizAttemptDetail(attemptId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取测验尝试详情失败');
    }
  }
);

// 提交答案
export const submitAnswer = createAsyncThunk(
  'quiz/submitAnswer',
  async (
    answerData: {
      quiz_attempt: number;
      question: number;
      text_answer?: string;
      selected_choice_ids?: number[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await quizService.submitAnswer(answerData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '提交答案失败');
    }
  }
);

// 提交测验
export const submitQuizAttempt = createAsyncThunk(
  'quiz/submitQuizAttempt',
  async (attemptId: number, { rejectWithValue }) => {
    try {
      const response = await quizService.submitQuizAttempt(attemptId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '提交测验失败');
    }
  }
);

// 获取用户的测验尝试列表
export const fetchUserQuizAttempts = createAsyncThunk(
  'quiz/fetchUserQuizAttempts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await quizService.getUserQuizAttempts();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取测验尝试列表失败');
    }
  }
);

// 获取问题详情
export const fetchQuestionDetail = createAsyncThunk(
  'quiz/fetchQuestionDetail',
  async (questionId: number, { rejectWithValue }) => {
    try {
      const response = await quizService.getQuestionDetail(questionId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取问题详情失败');
    }
  }
);

// 获取问题的所有答案
export const fetchQuestionAnswers = createAsyncThunk(
  'quiz/fetchQuestionAnswers',
  async (questionId: number, { rejectWithValue }) => {
    try {
      console.log('获取问题答案:', questionId);
      const response = await quizService.getQuestionAnswers(questionId);
      console.log('获取问题答案成功:', response);
      return { questionId, answers: response };
    } catch (error: any) {
      console.error('获取问题答案失败:', error);
      return rejectWithValue(error.response?.data?.detail || '获取问题答案失败');
    }
  }
);

// 获取测验尝试中所有简答题答案
export const fetchAttemptShortAnswers = createAsyncThunk(
  'quiz/fetchAttemptShortAnswers',
  async (attemptId: number, { rejectWithValue, dispatch }) => {
    try {
      console.log('获取测验尝试简答题答案:', attemptId);
      const answers = await quizService.getAttemptShortAnswers(attemptId);
      console.log('获取测验尝试简答题答案成功:', answers);
      
      // 对每个简答题答案，更新对应的问题
      if (answers && answers.length > 0) {
        // 按问题ID分组答案
        const answersByQuestion: Record<number, Answer[]> = {};
        answers.forEach((answer: Answer) => {
          const questionId = answer.question.id;
          if (!answersByQuestion[questionId]) {
            answersByQuestion[questionId] = [];
          }
          answersByQuestion[questionId].push(answer);
        });
        
        // 对每个问题ID，分发更新操作
        Object.entries(answersByQuestion).forEach(([questionId, questionAnswers]) => {
          dispatch({
            type: 'quiz/fetchQuestionAnswers/fulfilled',
            payload: {
              questionId: Number(questionId),
              answers: questionAnswers
            }
          });
        });
      }
      
      return answers;
    } catch (error: any) {
      console.error('获取测验尝试简答题答案失败:', error);
      return rejectWithValue(error.response?.data?.detail || '获取测验尝试简答题答案失败');
    }
  }
);

// 获取测验统计数据
export const fetchQuizStatistics = createAsyncThunk(
  'quiz/fetchQuizStatistics',
  async (quizId: number, { rejectWithValue }) => {
    try {
      const response = await quizService.getQuizStatistics(quizId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取测验统计数据失败');
    }
  }
);

// 获取学生测验表现
export const fetchStudentPerformance = createAsyncThunk(
  'quiz/fetchStudentPerformance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await quizService.getStudentPerformance();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || '获取学生测验表现失败');
    }
  }
);

// 为简答题评分
export const gradeShortAnswer = createAsyncThunk(
  'quiz/gradeShortAnswer',
  async (gradeData: { answer_id: number; score: number; feedback?: string }, { rejectWithValue }) => {
    try {
      console.log('准备为简答题评分:', gradeData);
      const response = await quizService.gradeShortAnswer(gradeData);
      console.log('简答题评分成功:', response);
      return response;
    } catch (error: any) {
      console.error('简答题评分失败:', error);
      return rejectWithValue(error.response?.data?.detail || '简答题评分失败');
    }
  }
);

// 创建新测验
export const createQuiz = createAsyncThunk(
  'quiz/createQuiz',
  async (quizData: any, { rejectWithValue }) => {
    try {
      console.log('Thunk - 创建测验请求数据:', JSON.stringify(quizData, null, 2));
      const response = await quizService.createQuiz(quizData);
      console.log('Thunk - 创建测验响应结果:', response);
      return response;
    } catch (error: any) {
      console.error('Thunk - 创建测验失败:', error);
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
      
      return rejectWithValue(error.message || '创建测验失败');
    }
  }
);

// 获取教师创建的测验列表
export const fetchTeacherQuizzes = createAsyncThunk(
  'quiz/fetchTeacherQuizzes',
  async (_, { rejectWithValue }) => {
    try {
      console.log('准备获取教师测验列表');
      const response = await quizService.getTeacherQuizzes();
      console.log('测验API响应:', response);
      
      // 直接返回后端响应的测验列表，不在前端进行过滤
      return response.results || [];
    } catch (error: any) {
      console.error('获取教师测验列表失败:', error);
      return rejectWithValue(error.response?.data?.detail || '获取教师测验列表失败');
    }
  }
);

// 获取测验列表
export const fetchQuizzes = createAsyncThunk(
  'quiz/fetchQuizzes',
  async (params: any, { rejectWithValue }) => {
    try {
      console.log('准备获取测验列表');
      const response = await quizService.getQuizzes(params);
      console.log('测验列表API响应:', response);
      
      return response.results || [];
    } catch (error: any) {
      console.error('获取测验列表失败:', error);
      return rejectWithValue(error.response?.data?.detail || '获取测验列表失败');
    }
  }
);

// 删除测验
export const deleteQuiz = createAsyncThunk(
  'quiz/deleteQuiz',
  async (quizId: number, { rejectWithValue, dispatch }) => {
    try {
      console.log('准备删除测验:', quizId);
      await quizService.deleteQuiz(quizId);
      
      // 删除成功后重新获取测验列表
      dispatch(fetchTeacherQuizzes());
      
      return quizId;
    } catch (error: any) {
      console.error('删除测验失败:', error);
      return rejectWithValue(error.response?.data?.detail || '删除测验失败');
    }
  }
);

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    clearQuizState: (state) => {
      state.currentQuiz = null;
      state.currentQuestion = null;
      state.currentAttempt = null;
      state.submittedAnswers = [];
      state.timeRemaining = null;
    },
    clearQuizError: (state) => {
      state.error = null;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 获取测验详情
    builder.addCase(fetchQuizDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQuizDetail.fulfilled, (state, action: PayloadAction<Quiz>) => {
      state.loading = false;
      
      console.log('QuizSlice: 获取到测验详情:', action.payload);
      console.log('QuizSlice: 测验问题数量:', action.payload.questions?.length || 0);
      
      // 确保questions已设置
      if (!action.payload.questions) {
        action.payload.questions = [];
      }
      
      state.currentQuiz = action.payload;
      
      // 如果后端返回了用户尝试次数信息，保存它
      if (action.payload.user_attempts_count === undefined) {
        // 如果后端没有返回尝试次数，设置为0
        state.currentQuiz.user_attempts_count = 0;
      }
      
      if (action.payload.time_limit > 0) {
        state.timeRemaining = action.payload.time_limit * 60; // 转换为秒
      }
    });
    builder.addCase(fetchQuizDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 开始测验尝试
    builder.addCase(startQuizAttempt.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(startQuizAttempt.fulfilled, (state, action: PayloadAction<QuizAttempt>) => {
      console.log('测验开始成功，响应数据:', action.payload);
      state.loading = false;
      
      // 确保设置currentAttempt
      state.currentAttempt = action.payload;
      
      // 确保answers字段存在
      state.submittedAnswers = action.payload.answers || [];
      
      // 设置计时器
      if (state.currentQuiz && state.currentQuiz.time_limit > 0) {
        state.timeRemaining = state.currentQuiz.time_limit * 60; // 转换为秒
      }
    });
    builder.addCase(startQuizAttempt.rejected, (state, action) => {
      console.error('测验开始失败:', action.payload);
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取测验尝试详情
    builder.addCase(fetchQuizAttemptDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchQuizAttemptDetail.fulfilled, (state, action: PayloadAction<QuizAttempt>) => {
      state.loading = false;
      state.currentAttempt = action.payload;
      state.submittedAnswers = action.payload.answers || [];
    });
    builder.addCase(fetchQuizAttemptDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 提交答案
    builder.addCase(submitAnswer.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(submitAnswer.fulfilled, (state, action: PayloadAction<Answer>) => {
      state.loading = false;
      // 添加或更新提交的答案
      const existingIndex = state.submittedAnswers.findIndex((a) => a.question.id === action.payload.question.id);
      if (existingIndex >= 0) {
        state.submittedAnswers[existingIndex] = action.payload;
      } else {
        state.submittedAnswers.push(action.payload);
      }
    });
    builder.addCase(submitAnswer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 提交测验
    builder.addCase(submitQuizAttempt.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(submitQuizAttempt.fulfilled, (state, action: PayloadAction<QuizAttempt>) => {
      state.loading = false;
      state.currentAttempt = action.payload;
      state.submittedAnswers = action.payload.answers || [];
      state.timeRemaining = null;
    });
    builder.addCase(submitQuizAttempt.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取用户的测验尝试列表
    builder.addCase(fetchUserQuizAttempts.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUserQuizAttempts.fulfilled, (state, action: PayloadAction<QuizAttempt[]>) => {
      state.loading = false;
      state.userAttempts = action.payload;
    });
    builder.addCase(fetchUserQuizAttempts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取问题详情
    builder.addCase(fetchQuestionDetail.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchQuestionDetail.fulfilled, (state, action: PayloadAction<Question>) => {
      state.loading = false;
      state.currentQuestion = action.payload;
    });
    builder.addCase(fetchQuestionDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取问题答案
    builder.addCase(fetchQuestionAnswers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchQuestionAnswers.fulfilled, (state, action: PayloadAction<{questionId: number, answers: Answer[]}>) => {
      state.loading = false;
      
      // 找到currentQuiz中的相应问题并更新其答案
      if (state.currentQuiz && state.currentQuiz.questions) {
        const questionIndex = state.currentQuiz.questions.findIndex(q => q.id === action.payload.questionId);
        if (questionIndex !== -1) {
          // 使用类型断言更新问题的答案
          (state.currentQuiz.questions[questionIndex] as any).answers = action.payload.answers;
        }
      }
    });
    builder.addCase(fetchQuestionAnswers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取测验尝试中的简答题答案
    builder.addCase(fetchAttemptShortAnswers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAttemptShortAnswers.fulfilled, (state) => {
      state.loading = false;
      // 实际的答案更新已经在Thunk内部通过dispatch完成
    });
    builder.addCase(fetchAttemptShortAnswers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取测验统计数据
    builder.addCase(fetchQuizStatistics.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchQuizStatistics.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.quizStatistics = action.payload;
    });
    builder.addCase(fetchQuizStatistics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取学生测验表现
    builder.addCase(fetchStudentPerformance.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchStudentPerformance.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.studentPerformance = action.payload;
    });
    builder.addCase(fetchStudentPerformance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取教师创建的测验列表
    builder.addCase(fetchTeacherQuizzes.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTeacherQuizzes.fulfilled, (state, action: PayloadAction<Quiz[]>) => {
      state.loading = false;
      state.teacherQuizzes = action.payload;
    });
    builder.addCase(fetchTeacherQuizzes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // 创建新测验
    builder.addCase(createQuiz.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createQuiz.fulfilled, (state, action: PayloadAction<Quiz>) => {
      state.loading = false;
      state.currentQuiz = action.payload;
      // 更新教师的测验列表
      if (state.teacherQuizzes) {
        state.teacherQuizzes = [...state.teacherQuizzes, action.payload];
      }
    });
    builder.addCase(createQuiz.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取测验列表
    builder.addCase(fetchQuizzes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQuizzes.fulfilled, (state, action: PayloadAction<Quiz[]>) => {
      state.loading = false;
      state.quizzes = action.payload;
    });
    builder.addCase(fetchQuizzes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // 删除测验
    builder.addCase(deleteQuiz.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteQuiz.fulfilled, (state, action: PayloadAction<number>) => {
      state.loading = false;
      // 可选：从本地数组中也删除这个测验
      state.teacherQuizzes = state.teacherQuizzes.filter(quiz => quiz.id !== action.payload);
    });
    builder.addCase(deleteQuiz.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 简答题评分
    builder.addCase(gradeShortAnswer.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(gradeShortAnswer.fulfilled, (state, action: PayloadAction<Answer>) => {
      state.loading = false;
      // 更新已提交答案列表中的回答
      const index = state.submittedAnswers.findIndex(answer => answer.id === action.payload.id);
      if (index !== -1) {
        state.submittedAnswers[index] = action.payload;
      }
      
      // 如果当前查看的测验尝试包含此答案，也更新它
      if (state.currentAttempt && state.currentAttempt.answers) {
        const attemptAnswerIndex = state.currentAttempt.answers.findIndex(answer => answer.id === action.payload.id);
        if (attemptAnswerIndex !== -1) {
          state.currentAttempt.answers[attemptAnswerIndex] = action.payload;
        }
      }
    });
    builder.addCase(gradeShortAnswer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearQuizState, clearQuizError, updateTimeRemaining } = quizSlice.actions;
export default quizSlice.reducer; 