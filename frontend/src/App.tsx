import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import store from './redux/store';
import { loadUser } from './redux/slices/authSlice';
import { fetchCourses } from './redux/slices/courseSlice';
import { fetchLiveEvents } from './redux/slices/liveSlice';
import { fetchQuizzes } from './redux/slices/quizSlice';

// 引入页面
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/RegisterPage';
import ProfilePage from './pages/profile/ProfilePage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseDetailPage from './pages/course-detail/CourseDetailPage';
import VideoPage from './pages/video/VideoPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ConnectionTestPage from './pages/debug/ConnectionTestPage';
import LiveApiTestPage from './pages/debug/LiveApiTestPage';
import LiveListPage from './pages/live/LiveListPage';
import LiveDetailPage from './pages/live/LiveDetailPage';
import LiveCreatePage from './pages/live/LiveCreatePage';
import TestUploadPage from './pages/live/TestUploadPage';
import QuizPage from './pages/quiz/QuizPage';
import QuizListPage from './pages/quiz/QuizListPage';

// 引入教师中心页面
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import CourseCreatePage from './pages/teacher/CourseCreatePage';
import TeacherLiveCreatePage from './pages/teacher/LiveCreatePage';
import LiveCreatPage from './pages/teacher/LiveCreatPage';
import QuizCreatePage from './pages/teacher/QuizCreatePage';
import QuizDetailPage from './pages/teacher/QuizDetailPage';
import QuizStatisticsPage from './pages/teacher/QuizStatisticsPage';
import StudentPerformancePage from './pages/profile/StudentPerformancePage';

// 引入布局组件
import MainLayout from './components/layout/MainLayout';
import PrivateRoute from './components/auth/PrivateRoute';
import TeacherRoute from './components/auth/TeacherRoute';

const App: React.FC = () => {
  useEffect(() => {
    // 从本地存储检查JWT token
    const token = localStorage.getItem('token');
    if (token) {
      // 加载用户信息
      store.dispatch(loadUser());
      
      // 同时刷新主页所需的数据
      store.dispatch(fetchCourses({ page: 1, page_size: 4 }));
      store.dispatch(fetchLiveEvents({ upcoming: 'true' }));
      store.dispatch(fetchQuizzes({}));
    }
  }, []);

  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Routes>
            {/* 公共路由 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/connection-test" element={<ConnectionTestPage />} />
            <Route path="/live-api-test" element={<LiveApiTestPage />} />
            <Route path="/test-upload" element={<TestUploadPage />} />
            
            {/* 带有主布局的路由 */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              
              {/* 直播相关路由 */}
              <Route path="/live" element={<LiveListPage />} />
              <Route path="/live/:eventId" element={<LiveDetailPage />} />
              <Route 
                path="/live/create" 
                element={
                  <TeacherRoute>
                    <LiveCreatePage />
                  </TeacherRoute>
                } 
              />
              
              {/* 需要认证的路由 */}
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/video/:videoId" 
                element={
                  <PrivateRoute>
                    <VideoPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <PrivateRoute>
                    <NotificationsPage />
                  </PrivateRoute>
                } 
              />
              
              {/* 教师中心路由 - 需要教师权限 */}
              <Route 
                path="/teacher" 
                element={
                  <TeacherRoute>
                    <TeacherDashboardPage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/courses/create" 
                element={
                  <TeacherRoute>
                    <CourseCreatePage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/courses/edit/:courseId" 
                element={
                  <TeacherRoute>
                    <CourseCreatePage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/lives/create" 
                element={
                  <TeacherRoute>
                    <TeacherLiveCreatePage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/lives/edit/:liveId" 
                element={
                  <TeacherRoute>
                    <TeacherLiveCreatePage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/quizzes/create" 
                element={
                  <TeacherRoute>
                    <QuizCreatePage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/quizzes/edit/:quizId" 
                element={
                  <TeacherRoute>
                    <QuizCreatePage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/quizzes/:quizId" 
                element={
                  <TeacherRoute>
                    <QuizDetailPage />
                  </TeacherRoute>
                } 
              />
              <Route 
                path="/teacher/quizzes/:quizId/statistics" 
                element={
                  <TeacherRoute>
                    <QuizStatisticsPage />
                  </TeacherRoute>
                } 
              />

              {/* 学生测验表现页面 */}
              <Route 
                path="/profile/performance" 
                element={
                  <PrivateRoute>
                    <StudentPerformancePage />
                  </PrivateRoute>
                } 
              />

              {/* 测验相关路由 */}
              <Route path="/quizzes" element={<QuizListPage />} />
              <Route 
                path="/quiz-preview/:quizId" 
                element={
                  <PrivateRoute>
                    <QuizPage />
                  </PrivateRoute>
                } 
              />

              {/* 添加teacher/live/creat路由 */}
              <Route 
                path="/teacher/live/creat" 
                element={
                  <TeacherRoute>
                    <LiveCreatPage />
                  </TeacherRoute>
                } 
              />
            </Route>
            
            {/* 未匹配的路径，重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
