import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Typography, Row, Col, Card, Spin, Button, Tabs, 
  List, Divider, Progress, Space, message 
} from 'antd';
import { 
  PlayCircleOutlined, PauseCircleOutlined, 
  StepForwardOutlined, StepBackwardOutlined, 
  FileTextOutlined, FormOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchVideoDetail, fetchVideoProgress, updateVideoProgress } from '../../redux/slices/videoSlice';
import { fetchLessonDetail } from '../../redux/slices/courseSlice';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const VideoPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const dispatch = useAppDispatch();
  const { currentVideo, loading: videoLoading, currentProgress } = useAppSelector((state) => state.video);
  const { currentLesson, currentCourse } = useAppSelector((state) => state.course);
  
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  
  // 加载视频详情和进度
  useEffect(() => {
    if (videoId) {
      dispatch(fetchVideoDetail(Number(videoId)));
      dispatch(fetchVideoProgress(Number(videoId)));
      dispatch(fetchLessonDetail(Number(videoId)));
    }
  }, [dispatch, videoId]);
  
  // 视频播放器引用
  const videoRef = (element: HTMLVideoElement) => {
    setVideoElement(element);
  };
  
  // 当视频加载后设置时长
  const handleVideoLoaded = () => {
    if (videoElement) {
      setDuration(videoElement.duration);
      
      // 如果有上次观看进度，跳转到上次位置
      if (currentProgress && currentProgress.last_position > 0) {
        videoElement.currentTime = currentProgress.last_position;
        setCurrentTime(currentProgress.last_position);
      }
    }
  };
  
  // 更新当前播放时间
  const handleTimeUpdate = () => {
    if (videoElement) {
      setCurrentTime(videoElement.currentTime);
    }
  };
  
  // 播放/暂停视频
  const togglePlay = () => {
    if (videoElement) {
      if (playing) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setPlaying(!playing);
    }
  };
  
  // 快进10秒
  const handleForward = () => {
    if (videoElement) {
      videoElement.currentTime += 10;
    }
  };
  
  // 快退10秒
  const handleBackward = () => {
    if (videoElement) {
      videoElement.currentTime -= 10;
    }
  };
  
  // 视频播放结束
  const handleVideoEnded = () => {
    setPlaying(false);
    // 更新进度为已完成
    if (videoId) {
      dispatch(updateVideoProgress({
        videoId: Number(videoId),
        watchData: {
          watched_duration: duration,
          last_position: duration,
          completed: true
        }
      }));
      message.success('恭喜您完成了本节课程学习！');
    }
  };
  
  // 保存当前观看进度（每30秒自动保存一次）
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (videoElement && playing && videoId) {
        dispatch(updateVideoProgress({
          videoId: Number(videoId),
          watchData: {
            watched_duration: currentTime,
            last_position: currentTime,
            completed: currentTime >= duration * 0.9 // 观看90%以上视为完成
          }
        }));
      }
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, [dispatch, videoId, videoElement, playing, currentTime, duration]);
  
  // 离开页面前保存进度
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoElement && videoId) {
        dispatch(updateVideoProgress({
          videoId: Number(videoId),
          watchData: {
            watched_duration: currentTime,
            last_position: currentTime,
            completed: currentTime >= duration * 0.9
          }
        }));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [dispatch, videoId, videoElement, currentTime, duration]);
  
  if (videoLoading || !currentVideo) {
    return <Spin size="large" />;
  }
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // 计算进度百分比
  const progressPercent = duration ? Math.floor((currentTime / duration) * 100) : 0;
  
  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          {/* 视频播放器 */}
          <div style={{ position: 'relative', backgroundColor: '#000' }}>
            <video
              ref={videoRef}
              src={currentVideo.file}
              style={{ width: '100%', maxHeight: '70vh' }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleVideoLoaded}
              onEnded={handleVideoEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              poster={currentVideo.thumbnail}
              controls
            />
          </div>
          
          {/* 播放控制器 */}
          <Card style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Space>
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<StepBackwardOutlined />} 
                    onClick={handleBackward}
                  />
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
                    onClick={togglePlay}
                  />
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<StepForwardOutlined />} 
                    onClick={handleForward}
                  />
                </Space>
                <span style={{ marginLeft: 16 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div>
                <Progress 
                  percent={progressPercent} 
                  status="active"
                  style={{ width: 200 }}
                />
              </div>
            </div>
          </Card>
          
          {/* 视频信息 */}
          <div style={{ marginTop: 24 }}>
            <Title level={3}>{currentLesson?.title}</Title>
            <Paragraph>{currentLesson?.content}</Paragraph>
            
            <Tabs defaultActiveKey="notes">
              <TabPane tab="学习笔记" key="notes">
                <Paragraph>此功能正在开发中...</Paragraph>
              </TabPane>
              <TabPane tab="相关讨论" key="discussions">
                <Paragraph>此功能正在开发中...</Paragraph>
              </TabPane>
            </Tabs>
          </div>
        </Col>
        
        <Col xs={24} lg={6}>
          {/* 课程大纲 */}
          <Card title="课程大纲">
            {currentCourse?.sections && Array.isArray(currentCourse.sections) && currentCourse.sections.map((section, index) => (
              <div key={index}>
                <div style={{ fontWeight: 'bold', margin: '16px 0 8px' }}>
                  {section.title}
                </div>
                <List
                  size="small"
                  itemLayout="horizontal"
                  dataSource={Array.isArray(section.lessons) ? section.lessons : []}
                  renderItem={lesson => (
                    <List.Item
                      className={lesson.id.toString() === videoId ? 'ant-list-item-active' : ''}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ fontSize: 18 }}>
                            {lesson.lesson_type === 'video' ? (
                              <PlayCircleOutlined style={{ color: '#1890ff' }} />
                            ) : lesson.lesson_type === 'document' ? (
                              <FileTextOutlined style={{ color: '#52c41a' }} />
                            ) : (
                              <FormOutlined style={{ color: '#faad14' }} />
                            )}
                          </div>
                        }
                        title={
                          <Link to={`/video/${lesson.id}`}>
                            {lesson.title}
                          </Link>
                        }
                        description={`${lesson.duration}分钟`}
                      />
                    </List.Item>
                  )}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VideoPage; 