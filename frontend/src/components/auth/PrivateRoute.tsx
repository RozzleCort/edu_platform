import React, { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

interface PrivateRouteProps {
  children: ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // 如果正在加载，可以显示一个加载指示器
  if (loading) {
    return <div>加载中...</div>;
  }

  // 如果未认证，重定向到登录页，并保存当前路径以便登录后重定向回来
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果已认证，则渲染子组件
  return children;
};

export default PrivateRoute; 