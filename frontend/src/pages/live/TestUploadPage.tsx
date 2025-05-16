import React, { useState } from 'react';
import { Upload, Button, message, Card, Typography } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const TestUploadPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  
  const handleUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 获取上传后的URL
      const url = info.file.response.url;
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;
      setVideoUrl(fullUrl);
      setUploading(false);
      message.success('视频上传成功');
    }
  };
  
  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <UploadOutlined />}
      <div style={{ marginTop: 8 }}>上传视频</div>
    </div>
  );
  
  return (
    <Card style={{ maxWidth: 800, margin: '40px auto' }}>
      <Title level={2}>视频上传测试</Title>
      <Paragraph>这是一个测试页面，用于验证视频上传功能是否正常工作</Paragraph>
      
      <div style={{ margin: '20px 0' }}>
        <Upload
          name="file"
          listType="picture-card"
          showUploadList={false}
          action="http://localhost:8000/api/upload/video/"
          headers={{
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }}
          onChange={handleUpload}
          accept="video/mp4,video/x-m4v,video/*"
        >
          {videoUrl ? (
            <div>
              <img 
                src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png" 
                alt="视频缩略图" 
                style={{ width: '100%' }} 
              />
            </div>
          ) : uploadButton}
        </Upload>
      </div>
      
      {videoUrl && (
        <div style={{ marginTop: 20 }}>
          <Title level={4}>上传成功！视频预览：</Title>
          <video 
            src={videoUrl} 
            controls 
            style={{ width: '100%', maxHeight: 400 }} 
          />
          <Paragraph>
            <strong>视频URL：</strong> {videoUrl}
          </Paragraph>
        </div>
      )}
    </Card>
  );
};

export default TestUploadPage; 