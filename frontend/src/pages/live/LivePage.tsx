import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Typography, Card, Button, Row, Col, Tabs, 
  List, Avatar, Form, Input, message, 
  Spin, Tag, Space, Divider, Empty
} from 'antd';
import { 
  UserOutlined, SendOutlined, TeamOutlined,
  PlayCircleOutlined, PauseCircleOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchLiveStreamDetail, startLiveStream, endLiveStream,
  joinLiveStream, leaveLiveStream, fetchLiveAttendances
} from '../../redux/slices/videoSlice';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 自定义评论组件
interface CommentProps {
  author: string;
  avatar: React.ReactNode;
  content: React.ReactNode;
  datetime: string;
}

const Comment: React.FC<CommentProps> = ({ author, avatar, content, datetime }) => (
  <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
    <div style={{ marginRight: 12 }}>{avatar}</div>
    <div style={{ flex: 1 }}>
      <div>
        <span style={{ fontWeight: 'bold', marginRight: 8 }}>{author}</span>
        <span style={{ color: '#00000073', fontSize: 12 }}>{datetime}</span>
      </div>
      <div style={{ marginTop: 4 }}>{content}</div>
    </div>
  </div>
);

interface ChatMessage {
  id: number;
  user: string;
  avatar?: string;
  content: string;
  time: string;
}

const LivePage: React.FC = () => {
  const { liveId } = useParams<{ liveId: string }>();
  const dispatch = useAppDispatch();
  const { currentLiveStream, liveAttendances, loading } = useAppSelector((state) => state.video);
  const { user } = useAppSelector((state) => state.auth);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // 获取直播详情
  useEffect(() => {
    if (liveId) {
      dispatch(fetchLiveStreamDetail(Number(liveId)));
    }
  }, [dispatch, liveId]);
  
  // 获取出席记录（仅限教师）
  useEffect(() => {
    if (liveId && user?.user_type === 'teacher' && currentLiveStream?.status === 'live') {
      dispatch(fetchLiveAttendances(Number(liveId)));
      
      // 每60秒刷新一次出席记录
      const interval = setInterval(() => {
        dispatch(fetchLiveAttendances(Number(liveId)));
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, liveId, user, currentLiveStream]);
  
  // 页面加载时自动加入直播
  useEffect(() => {
    if (liveId && currentLiveStream?.status === 'live' && !isJoined && user?.user_type === 'student') {
      handleJoinLive();
    }
  }, [liveId, currentLiveStream]);
  
  // 离开页面前退出直播
  useEffect(() => {
    return () => {
      if (liveId && isJoined && user?.user_type === 'student') {
        dispatch(leaveLiveStream(Number(liveId)));
      }
    };
  }, [dispatch, liveId, isJoined, user]);
  
  // 建立WebSocket连接
  useEffect(() => {
    if (liveId && isJoined && currentLiveStream?.status === 'live') {
      // 获取WebSocket URL
      const token = localStorage.getItem('token');
      const wsUrl = `ws://localhost:8000/ws/live/${liveId}/?token=${token}`;
      
      // 创建WebSocket连接
      const newSocket = new WebSocket(wsUrl);
      
      // 设置WebSocket事件处理函数
      newSocket.onopen = () => {
        setSocketConnected(true);
        message.success('聊天室连接成功');
      };
      
      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message') {
          // 接收到聊天消息
          const newMessage: ChatMessage = {
            id: Date.now(),
            user: data.user,
            avatar: data.avatar,
            content: data.message,
            time: data.time || new Date().toLocaleTimeString()
          };
          
          setChatMessages(prev => [...prev, newMessage]);
        } else if (data.type === 'user_join' || data.type === 'user_leave' || data.type === 'system_message') {
          // 系统消息
          message.info(data.message);
        }
      };
      
      newSocket.onclose = () => {
        setSocketConnected(false);
        message.warning('聊天室连接已断开');
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket错误:', error);
        message.error('聊天室连接错误');
      };
      
      setSocket(newSocket);
      
      // 清理函数
      return () => {
        newSocket.close();
      };
    }
  }, [liveId, isJoined, currentLiveStream]);
  
  // 开始直播
  const handleStartLive = async () => {
    if (liveId) {
      setSubmitting(true);
      try {
        await dispatch(startLiveStream(Number(liveId)));
        message.success('直播已开始');
      } catch (error) {
        message.error('开始直播失败，请稍后再试');
      } finally {
        setSubmitting(false);
      }
    }
  };
  
  // 结束直播
  const handleEndLive = async () => {
    if (liveId) {
      setSubmitting(true);
      try {
        await dispatch(endLiveStream(Number(liveId)));
        message.success('直播已结束');
      } catch (error) {
        message.error('结束直播失败，请稍后再试');
      } finally {
        setSubmitting(false);
      }
    }
  };
  
  // 加入直播
  const handleJoinLive = async () => {
    if (liveId) {
      setSubmitting(true);
      try {
        await dispatch(joinLiveStream(Number(liveId)));
        setIsJoined(true);
        message.success('成功加入直播');
      } catch (error) {
        message.error('加入直播失败，请稍后再试');
      } finally {
        setSubmitting(false);
      }
    }
  };
  
  // 离开直播
  const handleLeaveLive = async () => {
    if (liveId) {
      setSubmitting(true);
      try {
        await dispatch(leaveLiveStream(Number(liveId)));
        setIsJoined(false);
        message.success('已离开直播');
      } catch (error) {
        message.error('离开直播失败，请稍后再试');
      } finally {
        setSubmitting(false);
      }
    }
  };
  
  // 更新发送消息函数，使用WebSocket发送
  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      message.warning('请输入消息内容');
      return;
    }
    
    if (socket && socketConnected) {
      // 通过WebSocket发送消息
      const messageData = {
        type: 'chat_message',
        message: messageContent,
        time: new Date().toLocaleTimeString()
      };
      
      socket.send(JSON.stringify(messageData));
      setMessageContent('');
    } else {
      message.error('聊天室未连接，无法发送消息');
    }
  };
  
  // 渲染直播状态标签
  const renderStatusTag = () => {
    if (!currentLiveStream) return null;
    
    const { status } = currentLiveStream;
    let color = '';
    let text = '';
    
    switch (status) {
      case 'scheduled':
        color = 'blue';
        text = '未开始';
        break;
      case 'live':
        color = 'red';
        text = '直播中';
        break;
      case 'ended':
        color = 'default';
        text = '已结束';
        break;
      case 'cancelled':
        color = 'warning';
        text = '已取消';
        break;
      default:
        color = 'default';
        text = '未知状态';
    }
    
    return <Tag color={color}>{text}</Tag>;
  };
  
  // 渲染直播信息卡片
  const renderLiveInfoCard = () => (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3}>{currentLiveStream?.title}</Title>
          <Space>
            {renderStatusTag()}
            <Text>开始时间: {new Date(currentLiveStream?.scheduled_start_time || '').toLocaleString()}</Text>
          </Space>
          <Paragraph style={{ marginTop: 16 }}>{currentLiveStream?.description}</Paragraph>
        </div>
        
        {user?.user_type === 'teacher' && (
          <div>
            {currentLiveStream?.status === 'scheduled' && (
              <Button 
                type="primary" 
                onClick={handleStartLive}
                loading={submitting}
              >
                开始直播
              </Button>
            )}
            
            {currentLiveStream?.status === 'live' && (
              <Button 
                danger 
                onClick={handleEndLive}
                loading={submitting}
              >
                结束直播
              </Button>
            )}
          </div>
        )}
        
        {user?.user_type === 'student' && (
          <div>
            {currentLiveStream?.status === 'live' && !isJoined && (
              <Button 
                type="primary" 
                onClick={handleJoinLive}
                loading={submitting}
              >
                加入直播
              </Button>
            )}
            
            {currentLiveStream?.status === 'live' && isJoined && (
              <Button 
                danger 
                onClick={handleLeaveLive}
                loading={submitting}
              >
                离开直播
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
  
  // 渲染直播视频
  const renderLiveVideo = () => (
    <Card bodyStyle={{ padding: 0 }}>
      {currentLiveStream?.status === 'live' ? (
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
          <iframe
            src={currentLiveStream.stream_url || 'about:blank'}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div style={{ 
          height: 360, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#f0f0f0'
        }}>
          {currentLiveStream?.status === 'scheduled' && (
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>直播尚未开始</Title>
              <Paragraph>预计开始时间: {new Date(currentLiveStream.scheduled_start_time).toLocaleString()}</Paragraph>
            </div>
          )}
          
          {currentLiveStream?.status === 'ended' && (
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>直播已结束</Title>
              <Paragraph>
                开始时间: {currentLiveStream.actual_start_time ? new Date(currentLiveStream.actual_start_time).toLocaleString() : '未知'}
                <br />
                结束时间: {currentLiveStream.actual_end_time ? new Date(currentLiveStream.actual_end_time).toLocaleString() : '未知'}
              </Paragraph>
            </div>
          )}
          
          {currentLiveStream?.status === 'cancelled' && (
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>直播已取消</Title>
            </div>
          )}
        </div>
      )}
    </Card>
  );
  
  // 渲染聊天面板
  const renderChatPanel = () => (
    <Card 
      title="实时聊天" 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
        {Array.isArray(chatMessages) && chatMessages.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={chatMessages}
            renderItem={item => (
              <Comment
                author={item.user}
                avatar={<Avatar src={item.avatar} icon={<UserOutlined />} />}
                content={item.content}
                datetime={item.time}
              />
            )}
          />
        ) : (
          <Empty description="暂无消息" />
        )}
      </div>
      
      <div>
        <Form>
          <Form.Item>
            <TextArea 
              rows={2} 
              value={messageContent}
              onChange={e => setMessageContent(e.target.value)}
              placeholder="请输入消息"
              disabled={currentLiveStream?.status !== 'live' || !isJoined}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={currentLiveStream?.status !== 'live' || !isJoined}
            >
              发送
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  );
  
  // 渲染出席记录（仅对教师显示）
  const renderAttendanceList = () => {
    if (user?.user_type !== 'teacher') return null;
    
    return (
      <Card title="出席记录" style={{ marginTop: 16 }}>
        <List
          itemLayout="horizontal"
          dataSource={Array.isArray(liveAttendances) ? liveAttendances : []}
          renderItem={attendance => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} src={attendance.student?.avatar} />}
                title={attendance.student?.username || '未知用户'}
                description={`加入时间: ${new Date(attendance.join_time).toLocaleString()}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无学生加入直播' }}
        />
      </Card>
    );
  };
  
  if (loading) {
    return <Spin size="large" />;
  }
  
  if (!currentLiveStream) {
    return <div>直播不存在或已被删除</div>;
  }
  
  return (
    <div>
      {renderLiveInfoCard()}
      
      <Divider />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {renderLiveVideo()}
        </Col>
        <Col xs={24} lg={8}>
          {renderChatPanel()}
        </Col>
      </Row>
      
      {user?.user_type === 'teacher' && renderAttendanceList()}
    </div>
  );
};

export default LivePage; 