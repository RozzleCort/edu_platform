import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Card, Spin, Alert, Progress, Button, Space, Typography } from 'antd';
import { FullscreenOutlined, PauseCircleOutlined, PlayCircleOutlined, SoundOutlined, TeamOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface VideoPlayerProps {
  url: string;
  isLive?: boolean;
  title?: string;
  poster?: string;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
  viewerCount?: number;
  aspectRatio?: string;
  width?: string | number;
  height?: string | number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  isLive = false,
  title,
  poster,
  onProgress,
  onDuration,
  onEnded,
  viewerCount,
  aspectRatio = '16:9',
  width = '100%',
  height,
}) => {
  const [playing, setPlaying] = useState<boolean>(isLive); // 直播默认自动播放
  const [volume, setVolume] = useState<number>(0.8);
  const [played, setPlayed] = useState<number>(0);
  const [seeking, setSeeking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const playerRef = useRef<ReactPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 计算播放器高度
  const calculateHeight = () => {
    if (height) return height;
    
    if (typeof width === 'string' && width.includes('%')) {
      // 使用容器宽度按比例计算高度
      return '0'; // 高度会由React Player基于宽度和比例计算
    }
    
    // 从宽度和纵横比计算高度
    const [w, h] = aspectRatio.split(':').map(Number);
    const widthNum = typeof width === 'string' ? parseInt(width) : width;
    return (widthNum * h) / w;
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      if (onProgress) onProgress(state);
    }
  };

  const handleSeekChange = (e: any) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e: any) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat(e.target.value));
    }
  };

  const handleVolumeChange = (e: any) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleToggleFullscreen = () => {
    if (!fullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 处理播放器加载
  const handleReady = () => {
    setLoading(false);
  };

  // 处理播放器错误
  const handleError = (error: any) => {
    console.error('视频播放错误:', error);
    setError('视频加载失败，请稍后再试');
    setLoading(false);
  };

  return (
    <Card 
      bodyStyle={{ padding: 0 }} 
      style={{ width, overflow: 'hidden' }}
      className="video-player-container"
    >
      <div 
        ref={containerRef} 
        style={{ 
          position: 'relative', 
          paddingTop: height || (typeof width === 'string' && width.includes('%') ? `${9/16 * 100}%` : 'auto'),
          backgroundColor: '#000',
        }}
      >
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
            <Spin size="large" tip="加载中..." />
          </div>
        )}
        
        {error && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3 }}>
            <Alert message={error} type="error" showIcon />
          </div>
        )}
        
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          volume={volume}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onProgress={handleProgress}
          onDuration={onDuration}
          onEnded={onEnded}
          onReady={handleReady}
          onError={handleError}
          config={{
            file: {
              attributes: {
                poster: poster,
                controlsList: 'nodownload',
              },
            },
          }}
        />
        
        {/* 控制条 */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          width: '100%', 
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '8px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10
        }}>
          {/* 直播状态标签 */}
          {isLive && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 12, backgroundColor: '#f5222d', padding: '2px 8px', borderRadius: 2 }}>
                直播中
              </Text>
              {viewerCount !== undefined && (
                <Text style={{ color: '#fff', fontSize: 12 }}>
                  <TeamOutlined /> {viewerCount} 人观看
                </Text>
              )}
            </div>
          )}
          
          {/* 进度条 - 仅对非直播显示 */}
          {!isLive && (
            <div 
              style={{ marginBottom: 4, cursor: 'pointer' }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (playerRef.current) {
                  playerRef.current.seekTo(percent);
                }
              }}
            >
              <Progress 
                percent={played * 100} 
                showInfo={false} 
                size="small" 
                strokeColor="#1890ff"
              />
            </div>
          )}
          
          {/* 控制按钮 */}
          <Space>
            <Button 
              type="text" 
              icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
              onClick={handlePlayPause}
              style={{ color: '#fff' }}
            />
            
            <Button 
              type="text" 
              icon={<SoundOutlined />} 
              style={{ color: '#fff' }}
            />
            
            <Button 
              type="text" 
              icon={<FullscreenOutlined />} 
              onClick={handleToggleFullscreen}
              style={{ color: '#fff' }}
            />
            
            {title && (
              <Text style={{ color: '#fff', marginLeft: 8 }}>
                {title}
              </Text>
            )}
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default VideoPlayer; 