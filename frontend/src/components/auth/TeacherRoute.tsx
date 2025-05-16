import React, { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

interface TeacherRouteProps {
  children: ReactElement;
}

const TeacherRoute: React.FC<TeacherRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // 如果正在加载，显示加载中
  if (loading) {
    return <div>加载中...</div>;
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果已认证但不是教师角色，重定向到首页
  if (user && user.user_type !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  // 如果是教师，则渲染子组件
  return children;
};

export default TeacherRoute; 