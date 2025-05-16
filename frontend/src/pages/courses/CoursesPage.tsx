import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Row, Col, Pagination, Input, Select, 
  Empty, Spin, Tag, Rate, Space, Checkbox, Button, Divider
} from 'antd';
import { 
  SearchOutlined, ApiOutlined, CommentOutlined, 
  FormOutlined, BellOutlined, PlusOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCourses, fetchCategories } from '../../redux/slices/courseSlice';
import { Course, Category } from '../../types';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { Meta } = Card;

const CoursesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { courses, categories, loading, totalPages } = useAppSelector((state: any) => state.course);
  const navigate = useNavigate();
  const { user } = useAppSelector((state: any) => state.auth);
  
  // 搜索和筛选状态
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [isFreeFilter, setIsFreeFilter] = useState<boolean | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 获取分类列表
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  
  // 获取课程列表
  useEffect(() => {
    const params: any = { 
      page: currentPage,
      search
    };
    
    if (categoryFilter !== '') {
      params.category = categoryFilter;
    }
    
    if (isFreeFilter !== '') {
      params.is_free = isFreeFilter;
    }
    
    dispatch(fetchCourses(params));
  }, [dispatch, currentPage, search, categoryFilter, isFreeFilter]);
  
  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };
  
  // 处理分类筛选
  const handleCategoryChange = (value: number | '') => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };
  
  // 处理免费课程筛选
  const handleFreeChange = (e: any) => {
    setIsFreeFilter(e.target.checked ? true : '');
    setCurrentPage(1);
  };
  
  // 快速功能入口
  const quickFeatures = [
    {
      icon: <ApiOutlined />,
      title: '连接测试',
      link: '/connection-test',
      color: '#1890ff'
    },
    {
      icon: <CommentOutlined />,
      title: '直播聊天',
      link: '/courses',
      color: '#52c41a'
    },
    {
      icon: <FormOutlined />,
      title: '在线测验',
      link: '/courses',
      color: '#722ed1'
    },
    {
      icon: <BellOutlined />,
      title: '通知中心',
      link: '/notifications',
      color: '#fa8c16'
    }
  ];
  
  // 渲染课程卡片
  const renderCourseCard = (course: Course) => (
    <Link to={`/courses/${course.id}`} key={course.id}>
      <Card
        hoverable
        cover={
          <img 
            alt={course.title} 
            src={course.cover_image || 'https://via.placeholder.com/300x160?text=课程封面'} 
            style={{ height: 160, objectFit: 'cover' }}
          />
        }
      >
        <Meta 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{course.title}</span>
              {course.is_free ? (
                <Tag color="green">免费</Tag>
              ) : (
                <span style={{ color: '#1890ff' }}>¥{course.price}</span>
              )}
            </div>
          } 
          description={
            <Space direction="vertical" size={8}>
              <Paragraph ellipsis={{ rows: 2 }}>{course.description}</Paragraph>
              <div>
                <span>{course.instructor?.username || '未知讲师'}</span>
                <span style={{ marginLeft: 16 }}>学生: {course.students_count}</span>
              </div>
              <Tag color="blue">{course.category?.name || '未分类'}</Tag>
            </Space>
          } 
        />
      </Card>
    </Link>
  );
  
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>课程中心</Title>
        <Paragraph>探索各种学科领域的优质课程</Paragraph>
      </div>
      
      {/* 搜索和筛选 */}
      <div style={{ background: '#f0f2f5', padding: 24, marginBottom: 24, borderRadius: 8 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={8} lg={8}>
            <Input.Search
              placeholder="搜索课程"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Select
              placeholder="选择分类"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={handleCategoryChange}
              loading={loading}
            >
              {Array.isArray(categories) && categories.map((category: Category) => (
                <Option key={category.id} value={category.id}>{category.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={8}>
            <Checkbox onChange={handleFreeChange}>
              <span style={{ fontSize: 16 }}>仅显示免费课程</span>
            </Checkbox>
          </Col>
        </Row>
      </div>
      
      {/* 快速功能入口 */}
      <div style={{ marginBottom: 30 }}>
        <Row gutter={[16, 16]} justify="center">
          {quickFeatures.map((feature, index) => (
            <Col key={index} xs={12} sm={6} md={6} lg={6}>
              <Link to={feature.link}>
                <Button 
                  type="default" 
                  size="large" 
                  icon={feature.icon} 
                  style={{ 
                    width: '100%', 
                    height: 60, 
                    borderRadius: 8, 
                    color: feature.color,
                    borderColor: feature.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ marginLeft: 8 }}>{feature.title}</span>
                </Button>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
      
      <Divider />
      
      {/* 课程列表 */}
      <Spin spinning={loading}>
        {Array.isArray(courses) && courses.length > 0 ? (
          <Row gutter={[24, 24]}>
            {courses.map((course: Course) => (
              <Col key={course.id} xs={24} sm={12} md={8} lg={6}>
                {renderCourseCard(course)}
              </Col>
            ))}
          </Row>
        ) : (
          <Empty 
            description={
              <div>
                <Title level={4}>暂无课程</Title>
                <Paragraph>目前没有可以显示的课程，请稍后再访问或创建新课程</Paragraph>
                {user && user.user_type === 'teacher' && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/teacher/courses/create')}
                    style={{ marginTop: 16 }}
                  >
                    创建新课程
                  </Button>
                )}
              </div>
            }
            style={{ margin: '40px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Spin>
      
      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Pagination
            current={currentPage}
            total={totalPages * 10}  // 假设每页10条
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default CoursesPage; 