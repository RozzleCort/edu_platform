import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Badge, Avatar, Typography } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  PlayCircleOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../redux/slices/authSlice';
import { fetchUnreadNotificationCount } from '../../redux/slices/notificationSlice';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { fetchLiveEvents } from '../../redux/slices/liveSlice';
import { fetchQuizzes } from '../../redux/slices/quizSlice';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const notification = useAppSelector((state) => state.notification) as { unreadCount: number };
  const { unreadCount } = notification;
  
  // 当用户认证状态变化时，获取未读通知数量和刷新首页数据
  useEffect(() => {
    if (isAuthenticated) {
      // 获取未读通知
      dispatch(fetchUnreadNotificationCount());
      
      // 刷新首页所需数据
      dispatch(fetchCourses({ page: 1, page_size: 4 }));
      dispatch(fetchLiveEvents({ upcoming: 'true' }));
      dispatch(fetchQuizzes({}));
      
      // 每隔一分钟刷新一次未读通知数量
      const interval = setInterval(() => {
        dispatch(fetchUnreadNotificationCount());
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, dispatch]);
  
  // 处理登出
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile')
    },
    // 为教师用户添加教师中心入口
    ...(user?.user_type === 'teacher' ? [
      {
        key: 'teacher',
        label: '教师中心',
        icon: <BookOutlined />,
        onClick: () => navigate('/teacher')
      }
    ] : []),
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ];
  
  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return ['home'];
    if (path.startsWith('/courses')) return ['courses'];
    if (path.startsWith('/profile')) return ['profile'];
    if (path.startsWith('/live')) return ['live'];
    if (path.startsWith('/quizzes') || path.startsWith('/quiz-preview')) return ['quiz'];
    return ['home'];
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div style={{ height: 32, margin: 16, textAlign: 'center' }}>
          <Title level={4} style={{ color: '#1890ff', margin: 0 }}>网课平台</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={[
            {
              key: 'home',
              icon: <HomeOutlined />,
              label: '首页',
              onClick: () => navigate('/')
            },
            {
              key: 'courses',
              icon: <BookOutlined />,
              label: '课程中心',
              onClick: () => navigate('/courses')
            },
            {
              key: 'live',
              icon: <PlayCircleOutlined />,
              label: '直播课堂',
              onClick: () => navigate('/live')
            },
            {
              key: 'quiz',
              icon: <FormOutlined />,
              label: '在线测验',
              onClick: () => navigate('/quizzes')
            }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 24 }}>
            {isAuthenticated ? (
              <>
                <Badge count={unreadCount} overflowCount={99}>
                  <Button 
                    type="text" 
                    icon={<BellOutlined />} 
                    style={{ marginRight: 16 }}
                    onClick={() => navigate('/notifications')}
                  />
                </Badge>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      icon={<UserOutlined />} 
                      src={user?.avatar}
                      style={{ marginRight: 8 }}
                    />
                    <span>{user?.username}</span>
                  </div>
                </Dropdown>
              </>
            ) : (
              <div>
                <Button type="link" onClick={() => navigate('/login')}>登录</Button>
                <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
              </div>
            )}
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 