import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Button, Row, Col, Descriptions, Tag, message,
  Divider, List, Avatar, Form, Input, Empty, Spin, Alert, Space
} from 'antd';
import { 
  VideoCameraOutlined, UserOutlined, TeamOutlined, ClockCircleOutlined,
  SendOutlined, PlayCircleOutlined, StopOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchLiveEventDetail, enrollLiveEvent, fetchChatMessages,
  sendChatMessage, startLiveEvent, endLiveEvent
} from '../../redux/slices/liveSlice';
import { LiveChatMessage } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

// 自定义Comment组件
interface CommentProps {
  author: string;
  avatar: React.ReactNode;
  content: React.ReactNode;
  datetime: React.ReactNode;
  actions?: React.ReactNode[];
}

const Comment: React.FC<CommentProps> = ({ author, avatar, content, datetime, actions }) => {
  return (
    <div style={{ display: 'flex', marginBottom: 16, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ marginRight: 12 }}>
        {avatar}
      </div>
      <div style={{ flex: 1 }}>
        <div>
          <Text strong>{author}</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>{datetime}</Text>
        </div>
        <div style={{ marginTop: 8 }}>
          {content}
        </div>
        {actions && (
          <div style={{ marginTop: 8 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

const LiveDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { currentLiveEvent, chatMessages, loading, error } = useAppSelector((state) => state.live);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [startingLive, setStartingLive] = useState(false);
  const [endingLive, setEndingLive] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // 获取直播详情
  useEffect(() => {
    if (eventId) {
      dispatch(fetchLiveEventDetail(Number(eventId)));
    }
  }, [dispatch, eventId]);
  
  // 获取聊天记录
  useEffect(() => {
    if (eventId && currentLiveEvent?.status === 'live') {
      dispatch(fetchChatMessages(Number(eventId)));
      
      // 实际项目中可能需要使用WebSocket等实时通信技术来接收新消息
      const chatInterval = setInterval(() => {
        dispatch(fetchChatMessages(Number(eventId)));
      }, 10000); // 每10秒轮询一次新消息
      
      return () => clearInterval(chatInterval);
    }
  }, [dispatch, eventId, currentLiveEvent?.status]);
  
  // 滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // 处理发送消息
  const handleSendMessage = async () => {
    if (!eventId || !messageContent.trim()) {
      message.warning('请输入消息内容');
      return;
    }
    
    // 检查用户是否已登录
    if (!isAuthenticated) {
      message.warning('请先登录后再发送消息');
      return;
    }
    
    // 检查用户是否已报名
    if (!currentLiveEvent?.is_enrolled) {
      message.warning('请先报名参加直播后再发送消息');
      return;
    }
    
    // 检查直播是否正在进行
    if (currentLiveEvent?.status !== 'live') {
      message.warning('只能在直播进行中发送消息');
      return;
    }
    
    setSendingMessage(true);
    try {
      await dispatch(sendChatMessage({ 
        eventId: Number(eventId), 
        message: messageContent.trim() 
      })).unwrap();
      setMessageContent('');
      message.success('消息发送成功');
    } catch (error: any) {
      // 显示详细错误信息
      const errorMsg = typeof error === 'string' ? error : 
                      (error.response?.data?.detail || 
                       error.message || 
                       '发送消息失败，请稍后再试');
      message.error(errorMsg);
      console.error('发送消息错误详情:', error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  // 处理报名
  const handleEnroll = async () => {
    if (!eventId) return;
    
    setEnrolling(true);
    try {
      await dispatch(enrollLiveEvent(Number(eventId))).unwrap();
      message.success('报名成功！');
    } catch (error: any) {
      message.error(error || '报名失败，请稍后再试');
    } finally {
      setEnrolling(false);
    }
  };
  
  // 处理开始直播
  const handleStartLive = async () => {
    if (!eventId) return;
    
    setStartingLive(true);
    try {
      await dispatch(startLiveEvent(Number(eventId))).unwrap();
      message.success('直播已开始！');
    } catch (error: any) {
      message.error(error || '开始直播失败');
    } finally {
      setStartingLive(false);
    }
  };
  
  // 处理结束直播
  const handleEndLive = async () => {
    if (!eventId) return;
    
    setEndingLive(true);
    try {
      await dispatch(endLiveEvent(Number(eventId))).unwrap();
      message.success('直播已结束！');
    } catch (error: any) {
      message.error(error || '结束直播失败');
    } finally {
      setEndingLive(false);
    }
  };
  
  // 格式化日期
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '未开始';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  // 检查是否是教师
  const isTeacher = user?.user_type === 'teacher';
  // 检查是否是直播的讲师
  const isInstructor = isTeacher && currentLiveEvent?.instructor?.id === user?.id;
  
  // 渲染加载状态
  if (loading && !currentLiveEvent) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  // 渲染错误状态
  if (error && !currentLiveEvent) {
    return (
      <Alert
        message="加载错误"
        description={error}
        type="error"
        showIcon
        action={
          <Space direction="vertical">
            <Button onClick={() => dispatch(fetchLiveEventDetail(Number(eventId)))}>
              重试
            </Button>
            <Button>
              <Link to="/live">返回直播列表</Link>
            </Button>
          </Space>
        }
      />
    );
  }
  
  // 直播不存在
  if (!currentLiveEvent) {
    return (
      <Empty
        description="直播不存在或已被删除"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary">
          <Link to="/live">返回直播列表</Link>
        </Button>
      </Empty>
    );
  }
  
  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          {/* 直播播放区域 */}
          <Card style={{ marginBottom: 24 }}>
            {currentLiveEvent.status === 'live' ? (
              <div>
                {/* 预录制视频播放器 */}
                <div style={{ 
                  height: 400, 
                  background: '#000', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  {currentLiveEvent.pre_recorded_video_url ? (
                    <video 
                      src={currentLiveEvent.pre_recorded_video_url} 
                      controls 
                      autoPlay
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#fff',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      zIndex: 10
                    }}>
                      <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <div style={{ fontSize: 24, marginBottom: 16 }}>
                        正在直播: {currentLiveEvent.title}
                      </div>
                      <div style={{ fontSize: 14 }}>
                        (预录制视频模式，实际项目中可以集成真实直播流)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ 
                height: 400, 
                background: '#f0f2f5', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column'
              }}>
                <VideoCameraOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                <Title level={3}>
                  {currentLiveEvent.status === 'scheduled' ? '直播尚未开始' : '直播已结束'}
                </Title>
                <Paragraph>
                  {currentLiveEvent.status === 'scheduled' 
                    ? `直播将于 ${formatDateTime(currentLiveEvent.scheduled_start_time)} 开始` 
                    : `直播已于 ${formatDateTime(currentLiveEvent.actual_end_time || '')} 结束`}
                </Paragraph>
              </div>
            )}
          </Card>
          
          {/* 直播信息 */}
          <Card title={<Title level={3}>{currentLiveEvent.title}</Title>}>
            <Space size="middle" style={{ marginBottom: 16 }}>
              {renderStatusTag(currentLiveEvent.status)}
              <Tag icon={<TeamOutlined />}>{currentLiveEvent.enrollments_count} 人已报名</Tag>
              {currentLiveEvent.status === 'live' && (
                <Tag icon={<TeamOutlined />}>{currentLiveEvent.viewer_count} 人正在观看</Tag>
              )}
            </Space>
            
            <Descriptions column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label="讲师">
                <Space>
                  <Avatar 
                    src={currentLiveEvent?.instructor?.avatar} 
                    icon={<UserOutlined />}
                  />
                  {currentLiveEvent?.instructor?.username || '未知讲师'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="关联课程">
                <Link to={`/course-detail/${currentLiveEvent.course}`}>
                  查看课程
                </Link>
              </Descriptions.Item>
              <Descriptions.Item label="计划开始时间">
                {formatDateTime(currentLiveEvent.scheduled_start_time)}
              </Descriptions.Item>
              <Descriptions.Item label="计划结束时间">
                {formatDateTime(currentLiveEvent.scheduled_end_time)}
              </Descriptions.Item>
              {currentLiveEvent.actual_start_time && (
                <Descriptions.Item label="实际开始时间">
                  {formatDateTime(currentLiveEvent.actual_start_time)}
                </Descriptions.Item>
              )}
              {currentLiveEvent.actual_end_time && (
                <Descriptions.Item label="实际结束时间">
                  {formatDateTime(currentLiveEvent.actual_end_time)}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <Divider />
            
            <Title level={4}>直播简介</Title>
            <Paragraph>{currentLiveEvent.description || '暂无简介'}</Paragraph>
            
            {/* 教师控制区域 */}
            {isInstructor && (
              <div style={{ marginTop: 24 }}>
                <Divider />
                <Title level={4}>讲师控制台</Title>
                <Space size="middle">
                  {currentLiveEvent.status === 'scheduled' && (
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />} 
                      onClick={handleStartLive}
                      loading={startingLive}
                    >
                      开始直播
                    </Button>
                  )}
                  {currentLiveEvent.status === 'live' && (
                    <Button 
                      danger 
                      icon={<StopOutlined />} 
                      onClick={handleEndLive}
                      loading={endingLive}
                    >
                      结束直播
                    </Button>
                  )}
                  <Button>
                    <Link to={`/live/${eventId}/edit`}>编辑直播</Link>
                  </Button>
                </Space>
                {currentLiveEvent.status === 'scheduled' && (
                  <Descriptions column={1} style={{ marginTop: 16 }}>
                    <Descriptions.Item label="RTMP推流地址">
                      {currentLiveEvent.rtmp_url}
                    </Descriptions.Item>
                    <Descriptions.Item label="推流密钥">
                      {currentLiveEvent.stream_key}
                    </Descriptions.Item>
                  </Descriptions>
                )}
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          {/* 报名/观看按钮 */}
          <Card style={{ marginBottom: 24 }}>
            {!currentLiveEvent.is_enrolled ? (
              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  onClick={handleEnroll}
                  loading={enrolling}
                  disabled={!isAuthenticated || currentLiveEvent.status === 'ended'}
                >
                  {isAuthenticated ? '立即报名' : '登录后报名'}
                </Button>
                
                {!isAuthenticated && (
                  <div style={{ marginTop: 16 }}>
                    <Link to="/login">登录</Link> 或 <Link to="/register">注册</Link> 后报名
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Tag color="green" style={{ marginBottom: 16, fontSize: 14, padding: '4px 8px' }}>
                  已报名
                </Tag>
                {currentLiveEvent.status === 'scheduled' && (
                  <div>
                    <Text>直播将于 {formatDateTime(currentLiveEvent.scheduled_start_time)} 开始</Text>
                    <div style={{ marginTop: 16 }}>
                      <Button type="primary" block size="large">设置提醒</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* 聊天区域 - 仅在直播中显示 */}
          {currentLiveEvent.status === 'live' && (
            <Card title="直播互动" style={{ marginBottom: 24 }}>
              <div
                ref={chatContainerRef}
                style={{
                  height: 400,
                  overflowY: 'auto',
                  padding: '0 4px',
                  marginBottom: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 4,
                }}
              >
                {chatMessages.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={chatMessages}
                    renderItem={(item: LiveChatMessage) => (
                      <Comment
                        author={item?.user?.username || '匿名用户'}
                        avatar={<Avatar src={item?.user?.avatar} icon={<UserOutlined />} />}
                        content={<p>{item.message}</p>}
                        datetime={new Date(item.created_at).toLocaleTimeString()}
                      />
                    )}
                  />
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    description="暂无消息" 
                    style={{ marginTop: 100 }}
                  />
                )}
              </div>
              
              {isAuthenticated && currentLiveEvent.is_enrolled ? (
                <div>
                  <Form.Item style={{ marginBottom: 8 }}>
                    <TextArea
                      rows={2}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="发送消息..."
                      disabled={sendingMessage}
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sendingMessage}
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim()}
                    style={{ float: 'right' }}
                  >
                    发送
                  </Button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Button type="primary" onClick={handleEnroll} disabled={!isAuthenticated}>
                    {isAuthenticated ? '报名参与互动' : '登录后报名'}
                  </Button>
                </div>
              )}
            </Card>
          )}
          
          {/* 相关直播推荐 - 实际项目中应该提取相关直播 */}
          <Card title="推荐直播">
            <Empty description="暂无推荐直播" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LiveDetailPage; 