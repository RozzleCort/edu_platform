import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, message, Spin, Radio } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { register, clearError } from '../../redux/slices/authSlice';
import { RegisterRequest } from '../../types';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { fetchLiveEvents } from '../../redux/slices/liveSlice';
import { fetchQuizzes } from '../../redux/slices/quizSlice';

const { Title, Paragraph } = Typography;

const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // 如果已经登录，刷新数据然后重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      // 注册成功后刷新主页数据
      dispatch(fetchCourses({ page: 1, page_size: 4 }));
      dispatch(fetchLiveEvents({ upcoming: 'true' }));
      dispatch(fetchQuizzes({}));
      
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, dispatch]);
  
  // 显示错误信息
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);
  
  // 处理注册表单提交
  const onFinish = async (values: RegisterRequest) => {
    if (values.password !== values.confirm_password) {
      message.error('两次输入的密码不一致');
      return;
    }
    
    setSubmitting(true);
    try {
      await dispatch(register(values));
      message.success('注册成功，正在登录...');
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
          <Paragraph>创建新账号</Paragraph>
        </div>
        
        <Spin spinning={loading || submitting}>
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="邮箱" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', validateTrigger: 'onChange' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="手机号码（选填）" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="确认密码" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="user_type"
              rules={[{ required: true, message: '请选择账号类型' }]}
              initialValue="student"
            >
              <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                <Radio.Button value="student" style={{ width: '50%', textAlign: 'center' }}>
                  学生
                </Radio.Button>
                <Radio.Button value="teacher" style={{ width: '50%', textAlign: 'center' }}>
                  教师
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large" 
                block
                loading={submitting}
              >
                注册
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: 'center' }}>
              <span>已有账号？</span>
              <Link to="/login">立即登录</Link>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default RegisterPage; 