import React, { useEffect } from 'react';
import { Typography, List, Avatar, Card, Button, Badge, Spin, Empty, Space } from 'antd';
import { 
  UserOutlined, MessageOutlined, LikeOutlined, 
  BellOutlined, CheckOutlined, ReadOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead
} from '../../redux/slices/notificationSlice';
import { Link } from 'react-router-dom';
import { Notification } from '../../types';
import { RootState } from '../../redux/store';

// 定义NotificationState类型
interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const { Title, Paragraph, Text } = Typography;

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  // 使用类型断言
  const { notifications = [], loading = false, unreadCount = 0 } = useAppSelector((state: RootState) => 
    state.notification as NotificationState
  ) || { notifications: [], loading: false, unreadCount: 0 };
  
  // 加载通知列表
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);
  
  // 标记单个通知为已读
  const handleMarkAsRead = (notificationId: number) => {
    dispatch(markNotificationAsRead(notificationId));
  };
  
  // 标记所有通知为已读
  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };
  
  // 根据通知类型获取图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageOutlined style={{ color: '#1890ff' }} />;
      case 'reply':
        return <MessageOutlined style={{ color: '#52c41a' }} />;
      case 'like':
        return <LikeOutlined style={{ color: '#eb2f96' }} />;
      case 'course':
        return <ReadOutlined style={{ color: '#faad14' }} />;
      case 'system':
        return <BellOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined />;
    }
  };
  
  // 生成通知链接
  const getNotificationLink = (notification: Notification) => {
    const { notification_type, sender } = notification;
    
    if (notification_type === 'comment' || notification_type === 'reply' || notification_type === 'like') {
      // 这里应该跳转到评论所在的页面，根据实际情况调整
      return '#';
    } else if (notification_type === 'course') {
      // 跳转到课程页面
      return '/courses';
    }
    
    return '#';
  };
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>
          我的通知
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ marginLeft: 8 }} />
          )}
        </Title>
        
        {unreadCount > 0 && (
          <Button 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={handleMarkAllAsRead}
          >
            全部标为已读
          </Button>
        )}
      </div>
      
      <Card>
        <Spin spinning={loading}>
          {Array.isArray(notifications) && notifications.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(notification: Notification) => (
                <List.Item
                  actions={[
                    !notification.is_read && (
                      <Button 
                        type="link" 
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        标为已读
                      </Button>
                    ),
                    <Link to={getNotificationLink(notification)}>查看详情</Link>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={!notification.is_read}>
                        <Avatar icon={getNotificationIcon(notification.notification_type)} />
                      </Badge>
                    }
                    title={
                      <Space>
                        <Text strong>{notification.message}</Text>
                        {!notification.is_read && <Badge status="processing" />}
                      </Space>
                    }
                    description={
                      <div>
                        <div>
                          {notification.sender ? (
                            <span>来自: {notification.sender.username}</span>
                          ) : (
                            <span>系统通知</span>
                          )}
                        </div>
                        <div>时间: {new Date(notification.created_at).toLocaleString()}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无通知" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default NotificationsPage; 