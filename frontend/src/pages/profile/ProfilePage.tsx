import React, { useEffect, useState } from 'react';
import { 
  Typography, Card, Tabs, Form, Input, Button, Upload, 
  Avatar, message, Row, Col, Divider, List, Tag, Spin
} from 'antd';
import { 
  UserOutlined, MailOutlined, PhoneOutlined, 
  LockOutlined, UploadOutlined, BookOutlined,
  PlayCircleOutlined, FormOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { fetchUserEnrollments } from '../../redux/slices/courseSlice';
import { fetchVideoWatchHistory } from '../../redux/slices/videoSlice';
import { fetchUserQuizAttempts } from '../../redux/slices/quizSlice';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const { enrollments, loading: enrollmentsLoading } = useAppSelector((state) => state.course);
  const { watchHistory, loading: watchHistoryLoading } = useAppSelector((state) => state.video);
  const { userAttempts, loading: attemptsLoading } = useAppSelector((state) => state.quiz);
  
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // 加载用户报名的课程
  useEffect(() => {
    dispatch(fetchUserEnrollments());
    dispatch(fetchVideoWatchHistory());
    dispatch(fetchUserQuizAttempts());
  }, [dispatch]);
  
  // 更新表单初始值
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || ''
      });
    }
  }, [user, profileForm]);
  
  // 更新个人资料
  const handleProfileUpdate = async (values: any) => {
    setSubmitting(true);
    try {
      await dispatch(updateProfile(values));
      message.success('个人资料更新成功');
    } catch (error) {
      message.error('更新失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 修改密码
  const handlePasswordChange = async (values: any) => {
    setSubmitting(true);
    try {
      // 这里需要调用修改密码的API
      // await dispatch(changePassword(values));
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 上传头像
  const handleAvatarUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success('头像上传成功');
      // 这里需要调用更新头像的API
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };
  
  // 渲染用户基本信息
  const renderUserInfo = () => (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar 
          size={100} 
          src={user?.avatar} 
          icon={<UserOutlined />} 
        />
        <div style={{ marginTop: 16 }}>
          <Upload 
            name="avatar" 
            action="/api/accounts/upload-avatar/"
            showUploadList={false}
            onChange={handleAvatarUpload}
          >
            <Button icon={<UploadOutlined />}>更换头像</Button>
          </Upload>
        </div>
      </div>
      
      <Divider />
      
      <div>
        <Typography.Title level={4}>{user?.username}</Typography.Title>
        <p><MailOutlined /> 邮箱：{user?.email}</p>
        <p><UserOutlined /> 用户类型：{
          user?.user_type === 'student' ? '学生' : 
          user?.user_type === 'teacher' ? '教师' : '管理员'
        }</p>
        {user?.user_type === 'student' && user?.student_profile && (
          <p><BookOutlined /> 学号：{user.student_profile.student_id || '未设置'}</p>
        )}
        {user?.user_type === 'teacher' && user?.teacher_profile && (
          <>
            <p>职称：{user.teacher_profile.title || '未设置'}</p>
            <p>部门：{user.teacher_profile.department || '未设置'}</p>
          </>
        )}
        <p>注册时间：{new Date(user?.date_joined || '').toLocaleDateString()}</p>
      </div>
    </Card>
  );
  
  // 渲染个人资料表单
  const renderProfileForm = () => (
    <Form
      form={profileForm}
      layout="vertical"
      onFinish={handleProfileUpdate}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="first_name"
            label="名"
          >
            <Input placeholder="请输入名" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="last_name"
            label="姓"
          >
            <Input placeholder="请输入姓" />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="邮箱" disabled />
      </Form.Item>
      
      <Form.Item
        name="phone"
        label="手机号码"
        rules={[
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
        ]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="手机号码" />
      </Form.Item>
      
      <Form.Item
        name="bio"
        label="个人简介"
      >
        <Input.TextArea rows={4} placeholder="介绍一下自己吧" />
      </Form.Item>
      
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={submitting}
        >
          保存修改
        </Button>
      </Form.Item>
    </Form>
  );
  
  // 渲染修改密码表单
  const renderPasswordForm = () => (
    <Form
      form={passwordForm}
      layout="vertical"
      onFinish={handlePasswordChange}
    >
      <Form.Item
        name="old_password"
        label="当前密码"
        rules={[
          { required: true, message: '请输入当前密码' }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
      </Form.Item>
      
      <Form.Item
        name="new_password"
        label="新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
      </Form.Item>
      
      <Form.Item
        name="confirm_password"
        label="确认新密码"
        rules={[
          { required: true, message: '请确认新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('new_password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
      </Form.Item>
      
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={submitting}
        >
          修改密码
        </Button>
      </Form.Item>
    </Form>
  );
  
  // 渲染我的课程
  const renderMyCourses = () => (
    <Spin spinning={enrollmentsLoading}>
      <List
        itemLayout="horizontal"
        dataSource={Array.isArray(enrollments) ? enrollments : []}
        renderItem={enrollment => (
          <List.Item
            actions={[
              <Link to={`/courses/${enrollment.course}`}>继续学习</Link>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<BookOutlined />} />}
              title={<Link to={`/courses/${enrollment.course}`}>课程 ID: {enrollment.course}</Link>}
              description={
                <div>
                  <div>状态: <Tag color={
                    enrollment.status === 'completed' ? 'success' : 
                    enrollment.status === 'active' ? 'processing' : 'default'
                  }>{
                    enrollment.status === 'completed' ? '已完成' : 
                    enrollment.status === 'active' ? '学习中' : '已过期'
                  }</Tag></div>
                  <div>报名时间: {new Date(enrollment.enrolled_at).toLocaleDateString()}</div>
                  {enrollment.completed_at && (
                    <div>完成时间: {new Date(enrollment.completed_at).toLocaleDateString()}</div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Spin>
  );
  
  // 渲染学习记录
  const renderLearningHistory = () => (
    <Spin spinning={watchHistoryLoading}>
      <List
        itemLayout="horizontal"
        dataSource={Array.isArray(watchHistory) ? watchHistory : []}
        renderItem={record => (
          <List.Item
            actions={[
              <Link to={`/video/${record.video.id}`}>继续观看</Link>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<PlayCircleOutlined />} />}
              title={<Link to={`/video/${record.video.id}`}>{record.video.title}</Link>}
              description={
                <div>
                  <div>观看进度: {Math.floor((record.last_position / record.video.duration) * 100)}%</div>
                  <div>上次观看: {new Date(record.watch_date).toLocaleDateString()}</div>
                  <div>状态: {record.completed ? '已完成' : '未完成'}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Spin>
  );
  
  // 渲染测验记录
  const renderQuizHistory = () => (
    <Spin spinning={attemptsLoading}>
      <List
        itemLayout="horizontal"
        dataSource={Array.isArray(userAttempts) ? userAttempts : []}
        renderItem={attempt => (
          <List.Item
            actions={[
              <Link to={`/quiz/${attempt.quiz.id}`}>
                {attempt.status === 'in_progress' ? '继续测验' : '查看结果'}
              </Link>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<FormOutlined />} />}
              title={<Link to={`/quiz/${attempt.quiz.id}`}>{attempt.quiz.title}</Link>}
              description={
                <div>
                  <div>得分: {attempt.score} / 100</div>
                  <div>状态: <Tag color={
                    attempt.status === 'completed' ? 'success' : 
                    attempt.status === 'in_progress' ? 'processing' : 'warning'
                  }>{
                    attempt.status === 'completed' ? '已完成' : 
                    attempt.status === 'in_progress' ? '进行中' : '超时'
                  }</Tag></div>
                  <div>开始时间: {new Date(attempt.start_time).toLocaleString()}</div>
                  {attempt.end_time && (
                    <div>结束时间: {new Date(attempt.end_time).toLocaleString()}</div>
                  )}
                  <div>结果: {attempt.passed ? '通过' : '未通过'}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Spin>
  );
  
  if (authLoading || !user) {
    return <Spin size="large" />;
  }
  
  return (
    <div>
      <Title level={2}>个人中心</Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          {renderUserInfo()}
        </Col>
        
        <Col xs={24} md={16}>
          <Card>
            <Tabs defaultActiveKey="profile">
              <TabPane tab="个人资料" key="profile">
                {renderProfileForm()}
              </TabPane>
              
              <TabPane tab="修改密码" key="password">
                {renderPasswordForm()}
              </TabPane>
              
              <TabPane tab="我的课程" key="courses">
                {renderMyCourses()}
              </TabPane>
              
              <TabPane tab="学习记录" key="history">
                {renderLearningHistory()}
              </TabPane>
              
              <TabPane tab="测验记录" key="quizzes">
                {renderQuizHistory()}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage; 