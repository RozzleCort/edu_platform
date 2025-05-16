import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Typography, Card, Button, List, Space, Tag, Radio, Empty, Spin, Tabs, Alert,
  Row, Col, Divider, Pagination, Avatar
} from 'antd';
import { 
  VideoCameraOutlined, ClockCircleOutlined, TeamOutlined, 
  CalendarOutlined, PlusOutlined, UserOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchLiveEvents } from '../../redux/slices/liveSlice';
import { LiveEvent } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const LiveListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { liveEvents, loading, error, totalEvents, totalPages, currentPage } = useAppSelector((state) => state.live);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [filter, setFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('upcoming');
  
  // 获取直播列表
  useEffect(() => {
    const params: any = { page: currentPage };
    
    // 根据标签页过滤
    if (currentTab === 'upcoming') {
      params.upcoming = 'true';
    } else if (currentTab === 'live') {
      params.status = 'live';
    } else if (currentTab === 'ended') {
      params.status = 'ended';
    }
    
    // 根据过滤器过滤
    if (filter === 'my-enrollments') {
      params.enrolled = 'true';
    } else if (filter === 'my-events' && isAuthenticated) {
      params.instructor = 'me';
    }
    
    dispatch(fetchLiveEvents(params));
  }, [dispatch, currentPage, filter, currentTab, isAuthenticated]);
  
  // 处理页码变化
  const handlePageChange = (page: number) => {
    // 这里可以更新URL查询参数或状态来改变页码
    const params = { page, filter, tab: currentTab };
    dispatch(fetchLiveEvents(params));
  };
  
  // 处理过滤器变化
  const handleFilterChange = (e: any) => {
    setFilter(e.target.value);
  };
  
  // 处理标签页变化
  const handleTabChange = (key: string) => {
    setCurrentTab(key);
  };
  
  // 显示直播状态标签
  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Tag color="blue">未开始</Tag>;
      case 'live':
        return <Tag color="red">直播中</Tag>;
      case 'ended':
        return <Tag color="default">已结束</Tag>;
      case 'canceled':
        return <Tag color="orange">已取消</Tag>;
      default:
        return null;
    }
  };
  
  // 格式化日期
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 检查是否是教师
  const isTeacher = user?.user_type === 'teacher';
  
  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>在线直播</Title>
            {isTeacher && (
              <Button type="primary" icon={<PlusOutlined />}>
                <Link to="/live/create">创建直播</Link>
              </Button>
            )}
          </div>
          <Paragraph>
            参与实时直播课程，与讲师和其他学生进行互动学习，提升学习效果。
          </Paragraph>
        </Col>
      </Row>
      
      <Divider />
      
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <Radio.Group value={filter} onChange={handleFilterChange} buttonStyle="solid">
              <Radio.Button value="all">全部直播</Radio.Button>
              {isAuthenticated && (
                <>
                  <Radio.Button value="my-enrollments">我已报名</Radio.Button>
                  {isTeacher && <Radio.Button value="my-events">我的直播</Radio.Button>}
                </>
              )}
            </Radio.Group>
          </div>
          
          <Tabs activeKey={currentTab} onChange={handleTabChange}>
            <TabPane tab="即将开始" key="upcoming">
              {renderLiveEvents()}
            </TabPane>
            <TabPane tab="正在直播" key="live">
              {renderLiveEvents()}
            </TabPane>
            <TabPane tab="已结束" key="ended">
              {renderLiveEvents()}
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
  
  function renderLiveEvents() {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert
          message="加载错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
    
    if (!liveEvents || liveEvents.length === 0) {
      return (
        <Empty 
          description={
            <span>
              暂无{currentTab === 'upcoming' ? '即将开始的' : currentTab === 'live' ? '正在进行的' : '已结束的'}直播
            </span>
          }
        />
      );
    }
    
    return (
      <>
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={liveEvents}
          renderItem={(item: LiveEvent) => (
            <List.Item>
              <Card 
                hoverable 
                cover={
                  <div style={{ 
                    height: 160, 
                    background: '#f0f2f5', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    position: 'relative'
                  }}>
                    <VideoCameraOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    {renderStatusTag(item.status)}
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <Link to={`/live/${item.id}`}>
                      {item.title}
                    </Link>
                  }
                  description={
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          size="small" 
                          src={item?.instructor?.avatar} 
                          icon={<UserOutlined />} 
                          style={{ marginRight: 8 }}
                        />
                        <Text type="secondary">{item?.instructor?.username || '未知讲师'}</Text>
                      </div>
                      <div>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        <Text type="secondary">
                          {formatDateTime(item.scheduled_start_time)}
                        </Text>
                      </div>
                      <div>
                        <TeamOutlined style={{ marginRight: 8 }} />
                        <Text type="secondary">{item.enrollments_count} 人已报名</Text>
                      </div>
                    </Space>
                  }
                />
                <div style={{ marginTop: 16 }}>
                  {item.is_enrolled ? (
                    <Button type="primary" block>
                      <Link to={`/live/${item.id}`}>
                        {item.status === 'live' ? '进入直播间' : item.status === 'scheduled' ? '查看详情' : '查看回放'}
                      </Link>
                    </Button>
                  ) : (
                    <Button type="primary" block disabled={!isAuthenticated || item.status === 'ended'}>
                      <Link to={`/live/${item.id}`}>
                        {isAuthenticated ? '报名参加' : '登录后报名'}
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            </List.Item>
          )}
        />
        
        {totalPages > 1 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={currentPage}
              total={totalEvents}
              pageSize={10}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </>
    );
  }
};

export default LiveListPage; 