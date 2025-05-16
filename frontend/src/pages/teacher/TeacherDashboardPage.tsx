import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Typography, Card, Row, Col, Statistic, Button, Tabs, List,
  Avatar, Tag, Divider, Space, message, Popconfirm, Tooltip, Empty
} from 'antd';
import {
  BookOutlined, VideoCameraOutlined, FormOutlined,
  PlusOutlined, UserOutlined, TeamOutlined, 
  PlayCircleOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchTeacherCourses } from '../../redux/slices/courseSlice';
import { fetchTeacherLiveEvents, deleteLiveEvent } from '../../redux/slices/liveSlice';
import { fetchTeacherQuizzes, deleteQuiz } from '../../redux/slices/quizSlice';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const TeacherDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { courses, loading } = useAppSelector((state) => state.course);
  const { liveEvents, loading: liveLoading } = useAppSelector((state) => state.live);
  const { teacherQuizzes, loading: quizLoading } = useAppSelector((state) => state.quiz);
  const [activeTab, setActiveTab] = useState('courses');

  // 获取教师课程
  useEffect(() => {
    if (user?.user_type === 'teacher') {
      // 加载所有教师数据
      const loadTeacherData = async () => {
        try {
          // 加载课程数据
          await dispatch(fetchTeacherCourses()).unwrap();
          
          // 尝试加载直播数据
          try {
            await dispatch(fetchTeacherLiveEvents()).unwrap();
          } catch (error) {
            console.error('加载直播数据失败:', error);
            message.warning('直播数据加载失败，请点击"强制刷新所有数据"按钮重试');
          }
          
          // 尝试加载测验数据
          try {
            await dispatch(fetchTeacherQuizzes()).unwrap();
          } catch (error) {
            console.error('加载测验数据失败:', error);
            message.warning('测验数据加载失败，请点击"强制刷新所有数据"按钮重试');
          }
        } catch (error) {
          console.error('加载课程数据失败:', error);
          message.error('数据加载失败，请刷新页面重试');
        }
      };
      
      loadTeacherData();
    } else {
      message.warning('此页面仅限教师访问');
      navigate('/');
    }
  }, [dispatch, user, navigate]);

  // 快速功能入口
  const quickFeatures = [
    {
      icon: <BookOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      title: '创建新课程',
      description: '创建一门新课程并添加课程内容',
      link: '/teacher/courses/create',
      color: '#e6f7ff'
    },
    {
      icon: <VideoCameraOutlined style={{ fontSize: 36, color: '#52c41a' }} />,
      title: '安排直播课程',
      description: '创建直播课程并分享给学生',
      link: '/teacher/lives/create',
      color: '#f6ffed'
    },
    {
      icon: <FormOutlined style={{ fontSize: 36, color: '#722ed1' }} />,
      title: '创建测验',
      description: '为课程添加测验题目',
      link: '/teacher/quizzes/create',
      color: '#f9f0ff'
    }
  ];

  // 讲师统计数据
  const statsData = [
    {
      title: '我的课程',
      value: courses?.length || 0,
      icon: <BookOutlined />,
      color: '#1890ff'
    },
    {
      title: '学生总数',
      value: courses?.reduce((total, course) => total + (course.students_count || 0), 0) || 0,
      icon: <TeamOutlined />,
      color: '#52c41a'
    },
    {
      title: '待办事项',
      value: 0, // 可根据实际情况计算
      icon: <FormOutlined />,
      color: '#fa8c16'
    }
  ];

  // 处理课程删除
  const handleDelete = async (courseId: number) => {
    try {
      // 使用fetch直接调用删除API
      const token = localStorage.getItem('token');
      
      // 先获取课程详情，确认是当前教师的课程
      const detailResponse = await fetch(`http://localhost:8000/api/courses/courses/${courseId}/`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // 课程不存在的情况
      if (detailResponse.status === 404) {
        message.warning('课程不存在或已被删除');
        // 重新加载课程列表以更新界面
        dispatch(fetchTeacherCourses());
        return;
      }
      
      if (!detailResponse.ok) {
        message.error(`无法获取课程信息 (${detailResponse.status})`);
        return;
      }
      
      const courseData = await detailResponse.json();
      
      // 确认是当前教师的课程
      if (user && courseData.instructor && courseData.instructor.id !== user.id) {
        message.error('您没有权限删除此课程');
        return;
      }
      
      // 删除课程
      const response = await fetch(`http://localhost:8000/api/courses/courses/${courseId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      // 检查是否删除成功
      if (response.status === 204) {
        message.success('课程已成功删除');
        // 重新加载课程列表
        dispatch(fetchTeacherCourses());
      } else if (response.status === 404) {
        message.warning('课程不存在或已被删除');
        // 刷新列表以防万一
        dispatch(fetchTeacherCourses());
      } else {
        let errorMessage = '删除失败';
        try {
          const errorData = await response.json();
          errorMessage = `删除失败: ${JSON.stringify(errorData)}`;
        } catch (e) {
          // 如果无法解析JSON，使用原始错误消息
        }
        message.error(errorMessage);
      }
    } catch (error: any) {
      console.error('删除课程失败:', error);
      message.error(`删除失败: ${error.message || '未知错误'}`);
      // 出错时也刷新列表，以防课程状态不一致
      dispatch(fetchTeacherCourses());
    }
  };

  // 刷新课程列表
  const refreshCourses = async () => {
    try {
      await dispatch(fetchTeacherCourses()).unwrap();
      message.success('课程列表已刷新');
    } catch (error) {
      message.error('课程列表刷新失败');
    }
  };
  
  // 刷新直播列表
  const refreshLives = () => {
    dispatch(fetchTeacherLiveEvents());
    message.success('直播列表已刷新');
  };
  
  // 刷新测验列表
  const refreshQuizzes = async () => {
    try {
      await dispatch(fetchTeacherQuizzes()).unwrap();
      message.success('测验列表已刷新');
    } catch (error) {
      message.error('测验列表刷新失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>教师中心</Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/teacher/courses/create')}>
            创建课程
          </Button>
          <Tooltip title="刷新课程列表">
            <Button icon={<ReloadOutlined />} onClick={refreshCourses} />
          </Tooltip>
          <Button type="primary" onClick={() => {
            dispatch(fetchTeacherCourses());
            dispatch(fetchTeacherLiveEvents());
            dispatch(fetchTeacherQuizzes());
            message.success('所有数据已重新加载');
          }}>
            强制刷新所有数据
          </Button>
        </Space>
      </div>

      {/* 讲师信息卡片 */}
      {user && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size={64} 
              icon={<UserOutlined />} 
              src={user.avatar}
              style={{ marginRight: 16 }}
            />
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>{user.username}</Title>
              <Text type="secondary">{user.teacher_profile?.title || '讲师'}</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{user.teacher_profile?.department || '教学部'}</Tag>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 讲师统计数据 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statsData.map((stat, index) => (
          <Col key={index} xs={24} sm={8}>
            <Card>
              <Statistic 
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color }}
                prefix={stat.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快速功能入口 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>快速操作</Title>
        <Row gutter={[16, 16]}>
          {quickFeatures.map((feature, index) => (
            <Col key={index} xs={24} sm={8}>
              <Link to={feature.link}>
                <Card 
                  hoverable 
                  style={{ 
                    height: '100%', 
                    background: feature.color,
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ marginRight: 16 }}>{feature.icon}</div>
                    <div>
                      <Title level={4} style={{ marginBottom: 8 }}>{feature.title}</Title>
                      <Paragraph style={{ marginBottom: 0 }}>{feature.description}</Paragraph>
                    </div>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      {/* 课程、直播、测验的标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="我的课程" key="courses">
          {loading ? (
            <div>加载中...</div>
          ) : (
            <>
              {Array.isArray(courses) && courses.length === 0 && (
                <div style={{ textAlign: 'center', margin: '20px 0 40px' }}>
                  <Empty 
                    description={
                      <div>
                        <Title level={4}>您还没有创建任何课程</Title>
                        <Paragraph>开始创建课程或使用以下示例课程快速开始</Paragraph>
                      </div>
                    } 
                  />
                  <div style={{ marginTop: 20 }}>
                    <Title level={4}>快速创建示例课程</Title>
                    <Space size="large" style={{ marginTop: 16 }}>
                      {[
                        { title: "Python编程基础", description: "适合初学者的Python入门课程", isFree: true },
                        { title: "数据结构与算法", description: "计算机科学必修课程", isFree: false },
                        { title: "Web开发入门", description: "HTML/CSS/JavaScript基础", isFree: true }
                      ].map((example, index) => (
                        <Card
                          key={index}
                          style={{ width: 220 }}
                          hoverable
                          actions={[
                            <Button 
                              type="link" 
                              onClick={async () => {
                                try {
                                  // 创建示例课程
                                  const token = localStorage.getItem('token');
                                  const response = await fetch('http://localhost:8000/api/courses/courses/', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': token ? `Bearer ${token}` : ''
                                    },
                                    body: JSON.stringify({
                                      title: example.title,
                                      description: example.description,
                                      is_free: example.isFree,
                                      price: example.isFree ? 0 : 99,
                                      status: 'published'
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    message.success(`示例课程 "${example.title}" 创建成功`);
                                    dispatch(fetchTeacherCourses());
                                  } else {
                                    const errorData = await response.json();
                                    message.error(`创建失败: ${JSON.stringify(errorData)}`);
                                  }
                                } catch (error) {
                                  console.error('创建示例课程失败:', error);
                                  message.error('创建示例课程失败，请稍后再试');
                                }
                              }}
                            >
                              快速创建
                            </Button>
                          ]}
                        >
                          <Card.Meta
                            title={example.title}
                            description={
                              <>
                                <div>{example.description}</div>
                                <Tag color={example.isFree ? 'green' : 'blue'} style={{ marginTop: 8 }}>
                                  {example.isFree ? '免费' : '收费'}
                                </Tag>
                              </>
                            }
                          />
                        </Card>
                      ))}
                    </Space>
                  </div>
                </div>
              )}
              
              <List
                itemLayout="horizontal"
                dataSource={courses || []}
                renderItem={course => (
                  <List.Item
                    actions={[
                      <Link to={`/teacher/courses/edit/${course.id}`}>
                        <Button type="link" icon={<EditOutlined />}>编辑</Button>
                      </Link>,
                      <Link to={`/courses/${course.id}`}>
                        <Button type="link" icon={<PlayCircleOutlined />}>查看</Button>
                      </Link>,
                      <Popconfirm
                        title="确定要删除这个课程吗？"
                        description="删除后不可恢复，已报名学生将无法访问"
                        onConfirm={() => handleDelete(course.id)}
                        okText="确定删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={course.cover_image} shape="square" size={64} />}
                      title={<Link to={`/teacher/courses/edit/${course.id}`}>{course.title}</Link>}
                      description={
                        <Space direction="vertical">
                          <Text ellipsis={{ tooltip: true }}>{course.description}</Text>
                          <Space>
                            <Tag color={course.status === 'published' ? 'green' : 'orange'}>
                              {course.status === 'published' ? '已发布' : '草稿'}
                            </Tag>
                            <span>学生: {course.students_count || 0}</span>
                            <span>课时: {
                              course.sections?.reduce(
                                (total, section) => total + (section.lessons?.length || 0), 
                                0
                              ) || 0
                            }</span>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无课程，点击"创建课程"按钮开始创建' }}
              />
            </>
          )}
        </TabPane>
        
        <TabPane tab="我的直播" key="lives">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/teacher/lives/create')}
            >
              安排直播
            </Button>
            <Tooltip title="刷新直播列表">
              <Button icon={<ReloadOutlined />} onClick={refreshLives} />
            </Tooltip>
          </div>
          
          <List
            itemLayout="horizontal"
            dataSource={liveEvents || []}
            locale={{ emptyText: '暂无直播，点击"安排直播"按钮创建新直播' }}
            loading={liveLoading}
            renderItem={item => (
              <List.Item
                actions={[
                  <Link to={`/live/${item.id}`}>
                    <Button type="link" icon={<PlayCircleOutlined />}>查看</Button>
                  </Link>,
                  <Popconfirm
                    title="确定要删除这个直播吗？"
                    description="删除后不可恢复"
                    onConfirm={() => {
                      dispatch(deleteLiveEvent(item.id))
                        .unwrap()
                        .then(() => {
                          message.success('直播已成功删除');
                        })
                        .catch(error => {
                          message.error(`删除失败: ${error}`);
                        });
                    }}
                    okText="确定删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<VideoCameraOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={<Link to={`/live/${item.id}`}>{item.title}</Link>}
                  description={
                    <Space direction="vertical">
                      <Text ellipsis={{ tooltip: true }}>{item.description}</Text>
                      <Space>
                        <Tag color={
                          item.status === 'scheduled' ? 'blue' : 
                          item.status === 'live' ? 'red' : 
                          'default'
                        }>
                          {item.status === 'scheduled' ? '未开始' : 
                           item.status === 'live' ? '直播中' : 
                           '已结束'}
                        </Tag>
                        <span>已报名: {item.enrollments_count || 0}</span>
                        <span>开始时间: {new Date(item.scheduled_start_time).toLocaleString()}</span>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
        
        <TabPane tab="我的测验" key="quizzes">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/teacher/quizzes/create')}
            >
              创建测验
            </Button>
            <Tooltip title="刷新测验列表">
              <Button icon={<ReloadOutlined />} onClick={refreshQuizzes} />
            </Tooltip>
          </div>
          
          <List
            itemLayout="horizontal"
            dataSource={teacherQuizzes || []}
            loading={quizLoading}
            locale={{ emptyText: '暂无测验，点击"创建测验"按钮添加新测验' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Link to={`/teacher/quizzes/${item.id}`}>
                    <Button type="link" icon={<PlayCircleOutlined />}>查看</Button>
                  </Link>,
                  <Link to={`/teacher/quizzes/${item.id}/statistics`}>
                    <Button type="link">统计分析</Button>
                  </Link>,
                  <Popconfirm
                    title="确定要删除这个测验吗？"
                    description="删除后不可恢复，所有学生的测验数据也将被删除"
                    onConfirm={() => {
                      dispatch(deleteQuiz(item.id))
                        .unwrap()
                        .then(() => {
                          message.success('测验已成功删除');
                        })
                        .catch(error => {
                          message.error(`删除失败: ${error}`);
                        });
                    }}
                    okText="确定删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<FormOutlined />} style={{ backgroundColor: '#722ed1' }} />}
                  title={<Link to={`/teacher/quizzes/${item.id}`}>{item.title}</Link>}
                  description={
                    <Space direction="vertical">
                      <Text ellipsis={{ tooltip: true }}>{item.description}</Text>
                      <Space>
                        <span>时间限制: {item.time_limit} 分钟</span>
                        <span>通过分数: {item.pass_score} 分</span>
                        <span>问题数量: {item.questions?.length || 0}</span>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TeacherDashboardPage; 