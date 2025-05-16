import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, Input, Button, Select, DatePicker, message, 
  Typography, Card, Space, Divider, Alert, Upload
} from 'antd';
import { VideoCameraOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createLiveEvent } from '../../redux/slices/liveSlice';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { uploadVideo } from '../../services/uploadService';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const LiveCreatPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { courses, loading: courseLoading } = useAppSelector((state) => state.course);
  const { loading: liveLoading, error: liveError } = useAppSelector((state) => state.live);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [submitting, setSubmitting] = useState(false);
  const [preRecordedVideoUrl, setPreRecordedVideoUrl] = useState<string>('');
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);
  
  // 获取教师的课程列表
  useEffect(() => {
    if (isAuthenticated && user?.user_type === 'teacher') {
      dispatch(fetchCourses({ instructor: true }));
    }
  }, [dispatch, isAuthenticated, user]);
  
  // 处理视频上传
  const handleVideoUpload = async (info: any) => {
    if (info.file.status === 'uploading') {
      setUploadingVideo(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 获取上传后的URL
      const videoUrl = info.file.response.url;
      // 确保URL是完整的URL
      const fullVideoUrl = videoUrl.startsWith('http') 
        ? videoUrl 
        : `http://localhost:8000${videoUrl}`;
      
      setPreRecordedVideoUrl(fullVideoUrl);
      setUploadingVideo(false);
      message.success('预录制视频上传成功');
    }
  };
  
  // 视频上传按钮
  const uploadVideoButton = (
    <div>
      {uploadingVideo ? <LoadingOutlined /> : <UploadOutlined />}
      <div style={{ marginTop: 8 }}>上传预录制视频</div>
    </div>
  );
  
  // 处理表单提交
  const handleSubmit = async (values: any) => {
    // 检查用户是否为教师
    if (!isAuthenticated || user?.user_type !== 'teacher') {
      message.error('只有教师才能创建直播');
      return;
    }
    
    setSubmitting(true);
    try {
      // 处理时间范围
      const [startTime, endTime] = values.time_range;
      
      // 使用ISO格式的日期字符串，确保与后端兼容
      const startTimeStr = startTime.toISOString();
      const endTimeStr = endTime.toISOString();
      
      console.log('日期时间格式化:', {
        原始开始时间: startTime,
        原始结束时间: endTime,
        格式化开始时间: startTimeStr,
        格式化结束时间: endTimeStr
      });
      
      // 确保课程ID是数字类型
      const courseId = parseInt(values.course, 10);
      if (isNaN(courseId)) {
        throw new Error('课程ID必须是有效的数字');
      }
      
      const liveData = {
        title: values.title.trim(),
        description: values.description.trim(),
        course: courseId,
        scheduled_start_time: startTimeStr,
        scheduled_end_time: endTimeStr,
        status: 'scheduled',
        pre_recorded_video_url: preRecordedVideoUrl || null,
      };
      
      console.log('提交数据:', JSON.stringify(liveData, null, 2));
      const result = await dispatch(createLiveEvent(liveData)).unwrap();
      console.log('创建结果:', result);
      
      message.success('直播创建成功！');
      navigate(`/live/${result.id}`);
    } catch (error: any) {
      console.error('创建直播失败:', error);
      let errorMsg = '创建直播失败，请稍后再试';
      
      // 尝试解析错误信息
      try {
        if (typeof error.message === 'string' && error.message.startsWith('{')) {
          const errorData = JSON.parse(error.message);
          const errorFields = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          errorMsg = `创建失败: ${errorFields}`;
        } else {
          errorMsg = error.message || errorMsg;
        }
      } catch (e) {
        console.error('解析错误信息失败:', e);
      }
      
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };
  
  // 如果不是教师，则显示提示
  if (isAuthenticated && user?.user_type !== 'teacher') {
    return (
      <Alert
        message="权限不足"
        description="只有教师才能创建直播"
        type="error"
        showIcon
      />
    );
  }
  
  // 如果未登录，则显示提示
  if (!isAuthenticated) {
    return (
      <Alert
        message="请先登录"
        description="您需要登录并拥有教师权限才能创建直播"
        type="warning"
        showIcon
      />
    );
  }
  
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}>创建直播</Title>
        <Paragraph>创建一个新的直播活动，与学生实时互动</Paragraph>
      </div>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'scheduled',
          }}
        >
          <Form.Item
            name="title"
            label="直播标题"
            rules={[{ required: true, message: '请输入直播标题' }]}
          >
            <Input placeholder="请输入直播标题" maxLength={100} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="直播简介"
            rules={[{ required: true, message: '请输入直播简介' }]}
          >
            <TextArea placeholder="请输入直播简介" rows={4} maxLength={500} />
          </Form.Item>
          
          <Form.Item
            name="course"
            label="关联课程"
            rules={[{ required: true, message: '请选择关联课程' }]}
          >
            <Select 
              placeholder="请选择关联课程" 
              loading={courseLoading}
              showSearch
              optionFilterProp="children"
            >
              {courses.map((course: any) => (
                <Option key={course.id} value={course.id}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="time_range"
            label="直播时间"
            rules={[{ required: true, message: '请选择直播时间' }]}
          >
            <RangePicker 
              showTime={{ format: 'HH:mm' }} 
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
              disabledDate={(current) => {
                // 禁用过去的日期
                return current && current < moment().startOf('day');
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="pre_recorded_video"
            label="预录制视频（可选）"
            extra="上传预录制视频用于模拟直播，支持MP4格式，建议尺寸1280x720及以上"
          >
            <Upload
              name="file"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              action="http://localhost:8000/api/upload/video/"
              headers={{
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }}
              onChange={handleVideoUpload}
              accept="video/mp4,video/x-m4v,video/*"
            >
              {preRecordedVideoUrl ? (
                <div>
                  <VideoCameraOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div style={{ marginTop: 8 }}>视频已上传</div>
                </div>
              ) : uploadVideoButton}
            </Upload>
          </Form.Item>
          
          {preRecordedVideoUrl && (
            <div style={{ marginBottom: 24 }}>
              <video 
                src={preRecordedVideoUrl} 
                controls 
                style={{ width: '100%', maxHeight: 200 }} 
              />
            </div>
          )}
          
          <Divider />
          
          {liveError && (
            <Alert 
              message="创建失败" 
              description={liveError} 
              type="error" 
              showIcon 
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting || liveLoading}
                icon={<VideoCameraOutlined />}
              >
                创建直播
              </Button>
              <Button onClick={() => navigate('/live')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LiveCreatPage; 