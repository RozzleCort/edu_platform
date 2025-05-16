import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Typography, Spin, Button, Row, Col, Card, Tabs, 
  Descriptions, Tag, Divider, List, Avatar, Collapse, 
  Alert, message, Empty, Space, Rate, Input, Form,
  Popconfirm, Tooltip
} from 'antd';
import { 
  PlayCircleOutlined, FileTextOutlined, FormOutlined, 
  TeamOutlined, 
  WarningOutlined, LoadingOutlined, 
  StarOutlined,
  UserOutlined, DeleteOutlined, MessageOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCourseDetail, enrollInCourse } from '../../redux/slices/courseSlice';
import * as courseService from '../../services/courseService';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
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

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const dispatch = useAppDispatch();
  const { currentCourse, loading, error } = useAppSelector((state) => state.course);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('curriculum');
  
  // 评分和评论相关状态
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // 添加回复状态
  const [replyTo, setReplyTo] = useState<{ id: number, username: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseDetail(Number(courseId)));
    }
  }, [dispatch, courseId]);
  
  // 获取课程评论
  useEffect(() => {
    if (courseId && activeTab === 'reviews') {
      console.log('切换到评论标签页，触发评论加载');
      fetchComments();
    }
  }, [courseId, activeTab]);
  
  // 获取评论数据
  const fetchComments = async () => {
    if (!courseId) return;
    
    setLoadingComments(true);
    try {
      console.log('开始获取评论列表');
      // 获取顶级评论（不包含回复）
      const response = await courseService.getCourseComments(Number(courseId), { parent: 'null' });
      console.log('获取到的评论列表:', response);
      
      // 处理分页数据结构，提取results数组
      const commentsList = response.results || [];
      
      // 获取每个评论的回复数，如果回复数大于0且没有获取过回复
      const commentsWithReplies = await Promise.all(
        commentsList.map(async (comment: any) => {
          // 如果评论已有回复数据，直接返回
          if (comment.replies) return comment;
          
          // 如果有回复但没有获取过，则获取回复
          if (comment.reply_count > 0) {
            try {
              const repliesResponse = await courseService.getCourseComments(Number(courseId), { parent: comment.id });
              // 将回复添加到评论对象
              return {
                ...comment,
                replies: repliesResponse.results || []
              };
            } catch (error) {
              console.error(`获取评论${comment.id}的回复失败:`, error);
              return comment;
            }
          }
          return comment;
        })
      );
      
      setComments(commentsWithReplies);
      console.log('评论列表已更新为:', commentsWithReplies);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      message.error('获取评论失败，请稍后再试');
    } finally {
      setLoadingComments(false);
    }
  };
  
  // 提交评论
  const handleSubmitComment = async () => {
    if (!courseId || !commentContent.trim()) return;
    
    setSubmittingComment(true);
    try {
      console.log('提交评论内容:', commentContent);
      // 1. 先提交评论
      const newComment = await courseService.addCourseComment(Number(courseId), commentContent);
      console.log('服务器返回的评论数据:', newComment);
      message.success('评论发布成功！');
      setCommentContent('');
      
      // 2. 重新获取完整的评论列表（包括回复）
      await fetchComments();
      console.log('评论列表已更新为最新数据');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      message.error('评论发布失败，请稍后再试');
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // 提交评分
  const handleSubmitRating = async (value: number) => {
    if (!courseId) return;
    
    setSubmittingRating(true);
    try {
      await courseService.rateCourse(Number(courseId), value);
      message.success('评分提交成功！');
      setUserRating(value);
      // 重新获取课程详情以更新平均评分
      dispatch(fetchCourseDetail(Number(courseId)));
    } catch (error) {
      console.error('Failed to submit rating:', error);
      message.error('评分提交失败，请稍后再试');
    } finally {
      setSubmittingRating(false);
    }
  };
  
  const handleEnroll = async () => {
    if (!courseId) return;
    
    setEnrolling(true);
    setEnrollError(null);
    
    try {
      await dispatch(enrollInCourse(Number(courseId))).unwrap();
      message.success('恭喜您成功报名课程！');
    } catch (err: any) {
      setEnrollError(err.message || '报名失败，请稍后再试');
      message.error('报名失败，请稍后再试');
    } finally {
      setEnrolling(false);
    }
  };
  
  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    if (!courseId) return;
    
    try {
      console.log('删除评论:', commentId);
      await courseService.deleteComment(commentId);
      message.success('评论已删除');
      
      // 重新获取完整的评论列表（包括回复）
      await fetchComments();
      console.log('评论列表已更新（已删除的评论已移除）');
    } catch (error) {
      console.error('删除评论失败:', error);
      message.error('删除评论失败，请稍后再试');
    }
  };
  
  // 回复评论
  const handleReply = (comment: any) => {
    setReplyTo({
      id: comment.id,
      username: comment.user.username
    });
    setReplyContent('');
  };
  
  // 取消回复
  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyContent('');
  };
  
  // 提交回复
  const handleSubmitReply = async () => {
    if (!courseId || !replyTo || !replyContent.trim()) return;
    
    setSubmittingReply(true);
    try {
      console.log('提交回复:', replyContent, '回复给:', replyTo);
      const newComment = await courseService.addCourseComment(
        Number(courseId), 
        replyContent,
        replyTo.id
      );
      message.success('回复发布成功！');
      setReplyContent('');
      setReplyTo(null);
      
      // 重新获取完整的评论列表（包括回复）
      await fetchComments();
      console.log('评论列表已更新为最新数据（含新回复）');
    } catch (error) {
      console.error('回复发布失败:', error);
      message.error('回复发布失败，请稍后再试');
    } finally {
      setSubmittingReply(false);
    }
  };
  
  // 课程功能区
  const renderCourseFeaturesSection = () => {
    return null; // 移除课程功能区
  };
  
  // 渲染课程介绍部分（包含视频）
  const renderCourseIntroSection = () => {
    if (!currentCourse) return null;
    
    return (
      <div>
        {/* 课程视频 */}
        {currentCourse.video_url && (
          <Card 
            title="课程宣传视频" 
            style={{ marginBottom: 16 }}
            extra={<Text type="secondary">了解课程内容</Text>}
          >
            <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }}>
              <video
                controls
                width="100%"
                poster={currentCourse.cover_image}
                style={{ maxHeight: '450px', backgroundColor: '#000' }}
              >
                <source src={currentCourse.video_url} type="video/mp4" />
                您的浏览器不支持视频标签。
              </video>
            </div>
          </Card>
        )}
        
        {/* 课程介绍 */}
        <Card title="课程介绍" style={{ marginBottom: 16 }}>
          <Paragraph>{currentCourse.description}</Paragraph>
        </Card>
        
        {/* 学习目标 */}
        {currentCourse.learning_objectives && (
          <Card title="学习目标" style={{ marginBottom: 16 }}>
            <Paragraph>{currentCourse.learning_objectives}</Paragraph>
          </Card>
        )}
        
        {/* 适合人群 */}
        {currentCourse.prerequisites && (
          <Card title="适合人群" style={{ marginBottom: 16 }}>
            <Paragraph>{currentCourse.prerequisites}</Paragraph>
          </Card>
        )}
      </div>
    );
  };
  
  // 评论和评分区域
  const renderReviewsSection = () => {
    if (!currentCourse) return null;
    
    return (
      <div>
        {/* 评分区域 */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Title level={3}>课程评分</Title>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <Text strong style={{ fontSize: 64, color: '#faad14' }}>
                {currentCourse.average_rating ? currentCourse.average_rating.toFixed(1) : '0.0'}
              </Text>
              <Text type="secondary" style={{ fontSize: 20 }}>/5</Text>
            </div>
            
            <Rate 
              disabled 
              allowHalf 
              value={currentCourse.average_rating || 0} 
              style={{ fontSize: 24, marginBottom: 16 }}
            />
            
            <div>
              <Text type="secondary">
                {currentCourse.ratings_count || 0} 人评分
              </Text>
            </div>
          </div>
          
          {isAuthenticated && currentCourse.is_enrolled && (
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 0', textAlign: 'center' }}>
              <Title level={4}>您的评分</Title>
              <Rate 
                value={currentCourse.user_rating?.score || userRating} 
                onChange={handleSubmitRating}
                disabled={submittingRating}
                style={{ fontSize: 24 }}
              />
              
              {submittingRating && <div style={{ marginTop: 8 }}><Spin size="small" /> 提交中...</div>}
            </div>
          )}
        </Card>
        
        {/* 评论区域 */}
        <Card 
          title={<Title level={4}>学员评论</Title>}
          extra={<Text type="secondary">{Array.isArray(comments) ? comments.length : 0} 条评论</Text>}
        >
          {/* 评论列表 */}
          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : Array.isArray(comments) && comments.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={comments}
              renderItem={item => (
                <>
                  <Comment
                    author={item.user.username}
                    avatar={<Avatar src={item.user.avatar} icon={<UserOutlined />} />}
                    content={<p>{item.content}</p>}
                    datetime={
                      <span>
                        {new Date(item.created_at).toLocaleString()}
                        {item.user.user_type === 'teacher' && 
                          <Tag color="blue" style={{ marginLeft: 8 }}>教师</Tag>
                        }
                        {item.reply_count > 0 && (
                          <Tag color="green" style={{ marginLeft: 8 }}>{item.reply_count} 回复</Tag>
                        )}
                      </span>
                    }
                    actions={[
                      <Space size="middle">
                        <Button 
                          type="text" 
                          icon={<MessageOutlined />} 
                          size="small"
                          onClick={() => handleReply(item)}
                        >
                          回复
                        </Button>
                        
                        {/* 只显示给评论作者的删除按钮 */}
                        {item.user.id === user?.id && (
                          <Popconfirm
                            title="确定要删除这条评论吗？"
                            onConfirm={() => handleDeleteComment(item.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button 
                              type="text" 
                              danger 
                              icon={<DeleteOutlined />} 
                              size="small"
                            >
                              删除
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                    ]}
                  />
                  
                  {/* 如果有回复显示回复列表 */}
                  {item.replies && item.replies.length > 0 && (
                    <div style={{ marginLeft: 40, marginBottom: 16 }}>
                      {item.replies.map((reply: any) => (
                        <Comment
                          key={reply.id}
                          author={reply.user.username}
                          avatar={<Avatar src={reply.user.avatar} icon={<UserOutlined />} size="small" />}
                          content={<p>{reply.content}</p>}
                          datetime={
                            <span>
                              {new Date(reply.created_at).toLocaleString()}
                              {reply.user.user_type === 'teacher' && 
                                <Tag color="blue" style={{ marginLeft: 8 }}>教师</Tag>
                              }
                            </span>
                          }
                          actions={[
                            <Space size="middle">
                              <Button 
                                type="text" 
                                icon={<MessageOutlined />} 
                                size="small"
                                onClick={() => handleReply(reply)}
                              >
                                回复
                              </Button>
                              
                              {/* 只显示给评论作者的删除按钮 */}
                              {reply.user.id === user?.id && (
                                <Popconfirm
                                  title="确定要删除这条回复吗？"
                                  onConfirm={() => handleDeleteComment(reply.id)}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <Button 
                                    type="text" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    size="small"
                                  >
                                    删除
                                  </Button>
                                </Popconfirm>
                              )}
                            </Space>
                          ]}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            />
          ) : (
            <Empty description="暂无评论" />
          )}
          
          {/* 回复框 */}
          {isAuthenticated && currentCourse.is_enrolled && replyTo && (
            <div style={{ marginTop: 24, marginBottom: 24, background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>回复给: {replyTo.username}</Text>
                <Button 
                  type="link" 
                  size="small" 
                  onClick={handleCancelReply}
                  style={{ float: 'right' }}
                >
                  取消
                </Button>
              </div>
              <Form.Item>
                <TextArea 
                  rows={3} 
                  placeholder={`回复 ${replyTo.username}...`}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  disabled={submittingReply}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  onClick={handleSubmitReply}
                  loading={submittingReply}
                  disabled={!replyContent.trim()}
                >
                  发表回复
                </Button>
              </Form.Item>
            </div>
          )}
          
          {/* 发表评论 */}
          {isAuthenticated && currentCourse.is_enrolled ? (
            <div style={{ marginTop: 24 }}>
              <Form.Item>
                <TextArea 
                  rows={4} 
                  placeholder="分享您对这门课程的看法..." 
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  disabled={submittingComment}
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  onClick={handleSubmitComment}
                  loading={submittingComment}
                  disabled={!commentContent.trim()}
                >
                  发表评论
                </Button>
              </Form.Item>
            </div>
          ) : isAuthenticated ? (
            <Alert
              message="您需要先报名课程才能评论"
              type="info"
              showIcon
              action={
                <Button type="primary" onClick={handleEnroll}>
                  报名课程
                </Button>
              }
            />
          ) : (
            <Alert
              message="登录后才能发表评论"
              type="info"
              showIcon
              action={
                <Space>
                  <Button type="primary">
                    <Link to="/login">登录</Link>
                  </Button>
                  <Button>
                    <Link to="/register">注册</Link>
                  </Button>
                </Space>
              }
            />
          )}
        </Card>
      </div>
    );
  };
  
  // 渲染加载状态
  if (loading && !currentCourse) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="正在加载课程信息..." />
      </div>
    );
  }
  
  // 渲染错误状态
  if (error && !currentCourse) {
    // 特殊处理课程不存在的情况
    if (typeof error === 'object' && error.notFound) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Title level={4}>课程不存在或已被删除</Title>
              <Paragraph>该课程可能已被创建者删除或移动到其他位置</Paragraph>
            </div>
          }
        >
          <Space>
            <Button type="primary">
              <Link to="/courses">浏览所有课程</Link>
            </Button>
            <Button>
              <Link to="/teacher">返回教师中心</Link>
            </Button>
          </Space>
        </Empty>
      );
    }
    
    // 其他错误
    return (
      <Alert
        message="加载错误"
        description={`无法加载课程信息：${typeof error === 'object' ? error.message : error}`}
        type="error"
        showIcon
        action={
          <Space>
            <Button type="primary" onClick={() => dispatch(fetchCourseDetail(Number(courseId)))}>
              重试
            </Button>
            <Button>
              <Link to="/courses">返回课程列表</Link>
            </Button>
          </Space>
        }
      />
    );
  }
  
  // 课程不存在
  if (!currentCourse) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <Title level={4}>课程信息加载失败</Title>
            <Paragraph>请检查课程ID是否正确，或稍后再试</Paragraph>
          </div>
        }
      >
        <Space>
          <Button type="primary">
            <Link to="/courses">浏览所有课程</Link>
          </Button>
          <Button>
            <Link to="/teacher">返回教师中心</Link>
          </Button>
        </Space>
      </Empty>
    );
  }
  
  // 计算总课时数
  const totalLessons = currentCourse.sections?.reduce(
    (total, section) => total + (Array.isArray(section.lessons) ? section.lessons.length : 0), 
    0
  ) || 0;
  
  return (
    <div style={{ padding: '24px' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="加载失败"
          description="无法加载课程信息，请稍后再试。"
          type="error"
          showIcon
        />
      ) : currentCourse ? (
        <>
          <Row gutter={24}>
            <Col xs={24} sm={24} md={16} lg={18}>
              <Card style={{ marginBottom: 16 }}>
                <Row>
                  <Col span={currentCourse.cover_image ? 16 : 24}>
                    <Title level={2}>{currentCourse.title}</Title>
                    <Paragraph>{currentCourse.description.substring(0, 150)}...</Paragraph>
                    <Space size="middle">
                      <span>
                        <TeamOutlined /> {currentCourse.students_count} 名学生
                      </span>
                      {currentCourse.average_rating !== undefined && (
                        <span>
                          <StarOutlined /> {currentCourse.average_rating.toFixed(1)}
                          <Text type="secondary"> ({currentCourse.ratings_count} 人评价)</Text>
                        </span>
                      )}
                      <span>
                        <UserOutlined /> {currentCourse.instructor?.username}
                      </span>
                    </Space>
                  </Col>
                  {currentCourse.cover_image && (
                    <Col span={8}>
                      <img 
                        src={currentCourse.cover_image} 
                        alt={currentCourse.title} 
                        style={{ width: '100%', borderRadius: 8 }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>
              
              <Tabs 
                defaultActiveKey="introduction" 
                onChange={(key) => setActiveTab(key)}
                style={{ background: '#fff', padding: '16px', marginBottom: 16 }}
              >
                <TabPane tab="课程介绍" key="introduction">
                  {renderCourseIntroSection()}
                </TabPane>
                <TabPane tab="课程大纲" key="curriculum">
                  {Array.isArray(currentCourse.sections) && currentCourse.sections.length > 0 ? (
                    <Collapse defaultActiveKey={['0']}>
                      {currentCourse.sections.map((section, index) => (
                        <Panel 
                          header={`${section.title} (${Array.isArray(section.lessons) ? section.lessons.length : 0} 课时)`} 
                          key={index.toString()}
                        >
                          {Array.isArray(section.lessons) && section.lessons.length > 0 ? (
                            <List
                              itemLayout="horizontal"
                              dataSource={section.lessons}
                              renderItem={lesson => (
                                <List.Item
                                  actions={[
                                    lesson.is_free_preview || currentCourse.is_enrolled ? (
                                      <Link to={`/video/${lesson.id}`}>
                                        <Button type="link">学习</Button>
                                      </Link>
                                    ) : (
                                      <Tag color="volcano">需报名</Tag>
                                    )
                                  ]}
                                >
                                  <List.Item.Meta
                                    avatar={
                                      <div style={{ fontSize: 24 }}>
                                        {lesson.lesson_type === 'video' ? (
                                          <PlayCircleOutlined style={{ color: '#1890ff' }} />
                                        ) : lesson.lesson_type === 'quiz' ? (
                                          <FormOutlined style={{ color: '#faad14' }} />
                                        ) : (
                                          <FileTextOutlined style={{ color: '#52c41a' }} />
                                        )}
                                      </div>
                                    }
                                    title={lesson.title}
                                    description={`${lesson.duration} 分钟`}
                                  />
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Empty description="本章节暂无课时" />
                          )}
                        </Panel>
                      ))}
                    </Collapse>
                  ) : (
                    <Empty description="暂无课程大纲" />
                  )}
                </TabPane>
                <TabPane tab="评价" key="reviews">
                  {renderReviewsSection()}
                </TabPane>
              </Tabs>
            </Col>
            
            <Col xs={24} sm={24} md={8} lg={6}>
              {/* 移除课程功能区 */}
            </Col>
          </Row>
        </>
      ) : (
        <Empty description="未找到课程" />
      )}
    </div>
  );
};

export default CourseDetailPage; 