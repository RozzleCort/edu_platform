import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Row, Col, Card, Button, Space, Carousel, Divider, message } from 'antd';
import { 
  RightOutlined, BookOutlined, PlayCircleOutlined, ReadOutlined,
  ApiOutlined, CommentOutlined, FormOutlined, RobotOutlined,
  TeamOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { fetchLiveEvents } from '../../redux/slices/liveSlice';
import { fetchQuizzes } from '../../redux/slices/quizSlice';

const { Title, Paragraph } = Typography;
const { Meta } = Card;

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { courses, loading } = useAppSelector((state) => state.course);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // 获取主页所需的所有数据
  useEffect(() => {
    console.log('HomePage加载数据');
    // 加载课程数据
    dispatch(fetchCourses({ page: 1, page_size: 4 }));
    // 加载直播数据
    dispatch(fetchLiveEvents({ upcoming: 'true' }));
    // 加载测验数据
    dispatch(fetchQuizzes({}));
  }, [dispatch]);
  
  // 轮播图内容
  const carouselContent = [
    {
      title: '优质教育资源',
      description: '海量课程资源，随时随地学习',
      image: 'https://via.placeholder.com/1200x400?text=优质教育资源',
      link: '/courses'
    },
    {
      title: '专业师资力量',
      description: '顶尖讲师团队，提供高质量教学',
      image: 'https://via.placeholder.com/1200x400?text=专业师资力量',
      link: '/courses'
    },
    {
      title: '互动式学习体验',
      description: '直播互动，实时答疑，提高学习效率',
      image: 'https://via.placeholder.com/1200x400?text=互动式学习体验',
      link: '/courses'
    }
  ];
  
  // 平台特点
  const features = [
    {
      icon: <BookOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: '丰富课程',
      description: '涵盖多学科领域的优质课程资源'
    },
    {
      icon: <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: '视频点播与直播',
      description: '支持课程视频点播和教师在线直播授课'
    },
    {
      icon: <ReadOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      title: '练习测验',
      description: '丰富的测验题库，巩固所学知识'
    }
  ];
  
  // 热门功能
  const popularFeatures = [
    {
      icon: <ApiOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      title: '连接测试',
      description: '检测前后端连接状态，确保应用正常运行',
      link: '/connection-test',
      color: '#e6f7ff'
    },
    {
      icon: <CommentOutlined style={{ fontSize: 36, color: '#52c41a' }} />,
      title: '直播课堂',
      description: '参与实时直播课程，与老师和同学互动交流',
      link: '/live',
      color: '#f6ffed'
    },
    {
      icon: <FormOutlined style={{ fontSize: 36, color: '#722ed1' }} />,
      title: '在线测验',
      description: '参与课程测验，检验学习成果',
      link: '/quizzes',
      color: '#f9f0ff'
    },
    {
      icon: <RobotOutlined style={{ fontSize: 36, color: '#fa8c16' }} />,
      title: '通知中心',
      description: '查看课程更新、评论回复等重要通知',
      link: '/notifications',
      color: '#fff7e6'
    }
  ];
  
  // 教师中心功能入口
  const teacherFeature = {
    icon: <TeamOutlined style={{ fontSize: 36, color: '#eb2f96' }} />,
    title: '教师中心',
    description: '管理课程、直播和测验，查看学生学习情况',
    link: '/teacher',
    color: '#fff0f6'
  };
  
  return (
    <div>
      {/* 轮播图 */}
      <Carousel autoplay>
        {carouselContent.map((item, index) => (
          <div key={index}>
            <div style={{ 
              height: 400, 
              color: '#fff',
              background: `url(${item.image}) center center / cover no-repeat`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              textAlign: 'center',
              padding: '0 50px'
            }}>
              <Title level={2} style={{ color: '#fff' }}>{item.title}</Title>
              <Paragraph style={{ color: '#fff', fontSize: 18 }}>{item.description}</Paragraph>
              <Button type="primary" size="large">
                <Link to={item.link}>立即探索 <RightOutlined /></Link>
              </Button>
            </div>
          </div>
        ))}
      </Carousel>
      
      {/* 平台特点 */}
      <div style={{ padding: '50px 0', background: '#f0f2f5' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 50 }}>平台特点</Title>
        <Row gutter={[24, 24]} justify="center">
          {features.map((feature, index) => (
            <Col key={index} xs={24} sm={8}>
              <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
                <div>{feature.icon}</div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph>{feature.description}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
      
      {/* 热门功能 */}
      <div style={{ padding: '50px 0' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>热门功能</Title>
        <Row gutter={[24, 24]} justify="center">
          {popularFeatures.map((feature, index) => (
            <Col key={index} xs={24} sm={12} md={6}>
              <Link to={feature.link}>
                <Card 
                  hoverable 
                  style={{ 
                    textAlign: 'center', 
                    height: '100%', 
                    background: feature.color,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{feature.icon}</div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph>{feature.description}</Paragraph>
                  <Button type="primary" shape="round">
                    立即使用 <RightOutlined />
                  </Button>
                </Card>
              </Link>
            </Col>
          ))}
          
          {/* 教师中心入口 - 仅教师可见 */}
          {isAuthenticated && user?.user_type === 'teacher' && (
            <Col xs={24} sm={12} md={6}>
              <Link to={teacherFeature.link}>
                <Card 
                  hoverable 
                  style={{ 
                    textAlign: 'center', 
                    height: '100%', 
                    background: teacherFeature.color,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{teacherFeature.icon}</div>
                  <Title level={4}>{teacherFeature.title}</Title>
                  <Paragraph>{teacherFeature.description}</Paragraph>
                  <Button type="primary" shape="round">
                    立即使用 <RightOutlined />
                  </Button>
                </Card>
              </Link>
            </Col>
          )}
        </Row>
      </div>
      
      <Divider />
      
      {/* 直播与测验 */}
      <div style={{ padding: '50px 0', background: '#f7f7f7' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 30 }}>直播与测验</Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12}>
            <Link to="/live">
              <Card 
                hoverable 
                style={{ 
                  height: '100%', 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
                bodyStyle={{ padding: '40px 24px' }}
              >
                <div style={{ fontSize: 64, marginBottom: 24 }}>
                  <PlayCircleOutlined style={{ color: '#1890ff' }} />
                </div>
                <Title level={3}>直播课堂</Title>
                <Paragraph style={{ fontSize: 16 }}>
                  参与实时在线直播课程，与老师和同学实时互动交流，获取最新知识
                </Paragraph>
                <Button type="primary" size="large" shape="round" style={{ marginTop: 16 }}>
                  进入直播 <RightOutlined />
                </Button>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={12}>
            <Link to="/quizzes">
              <Card 
                hoverable 
                style={{ 
                  height: '100%', 
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
                bodyStyle={{ padding: '40px 24px' }}
              >
                <div style={{ fontSize: 64, marginBottom: 24 }}>
                  <FormOutlined style={{ color: '#722ed1' }} />
                </div>
                <Title level={3}>在线测验</Title>
                <Paragraph style={{ fontSize: 16 }}>
                  参与课程测验，检验学习成果，查看个人表现和学习进度
                </Paragraph>
                <Button type="primary" size="large" shape="round" style={{ marginTop: 16, background: '#722ed1', borderColor: '#722ed1' }}>
                  开始测验 <RightOutlined />
                </Button>
              </Card>
            </Link>
          </Col>
        </Row>
      </div>
      
      <Divider />
      
      {/* 热门课程 */}
      <div style={{ padding: '50px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2}>热门课程</Title>
          <Link to="/courses">
            <Button type="link">
              查看全部 <RightOutlined />
            </Button>
          </Link>
        </div>
        
        <Row gutter={[24, 24]}>
          {loading ? (
            <div>加载中...</div>
          ) : (
            courses.slice(0, 4).map((course) => (
              <Col key={course.id} xs={24} sm={12} md={8} lg={6}>
                <Link to={`/courses/${course.id}`}>
                  <Card
                    hoverable
                    cover={<img alt={course.title} src={course.cover_image || 'https://via.placeholder.com/300x160?text=课程封面'} />}
                  >
                    <Meta 
                      title={course.title} 
                      description={
                        <Space direction="vertical">
                          <Paragraph ellipsis={{ rows: 2 }}>{course.description}</Paragraph>
                          <div>
                            <span style={{ color: '#1890ff' }}>
                              {course.is_free ? '免费' : `¥${course.price}`}
                            </span>
                            <span style={{ marginLeft: 8 }}>
                              学生: {course.students_count}
                            </span>
                          </div>
                        </Space>
                      } 
                    />
                  </Card>
                </Link>
              </Col>
            ))
          )}
        </Row>
      </div>
    </div>
  );
};

export default HomePage; 