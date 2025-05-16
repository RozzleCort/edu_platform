import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { login, clearError } from '../../redux/slices/authSlice';
import { LoginRequest } from '../../types';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { fetchLiveEvents } from '../../redux/slices/liveSlice';
import { fetchQuizzes } from '../../redux/slices/quizSlice';

const { Title, Paragraph } = Typography;

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // 获取来源页面，用于登录后重定向
  const from = location.state?.from?.pathname || '/';
  
  // 如果已经登录，刷新数据然后重定向到首页或来源页面
  useEffect(() => {
    if (isAuthenticated) {
      // 登录成功后刷新主页数据
      dispatch(fetchCourses({ page: 1, page_size: 4 }));
      dispatch(fetchLiveEvents({ upcoming: 'true' }));
      dispatch(fetchQuizzes({}));
      
      // 重定向到首页或来源页面
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, dispatch]);
  
  // 显示错误信息
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  
  // 处理登录表单提交
  const onFinish = async (values: LoginRequest) => {
    setSubmitting(true);
    try {
      await dispatch(login(values));
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>网课教学平台</Title>
          <Paragraph>登录您的账号</Paragraph>
        </div>
        
        <Spin spinning={loading || submitting}>
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码" 
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
                loading={submitting}
              >
                登录
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center' }}>
              <span>还没有账号？</span>
              <Link to="/register">立即注册</Link>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default LoginPage; 