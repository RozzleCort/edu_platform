import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Form, Input, Button, Select, DatePicker, 
  TimePicker, Card, message, Spin, Space, Divider, Row, Col, Upload
} from 'antd';
import { 
  VideoCameraOutlined, SaveOutlined, CheckOutlined, 
  CalendarOutlined, ClockCircleOutlined, RollbackOutlined,
  UploadOutlined, LoadingOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { createLiveEvent } from '../../redux/slices/liveSlice';
import moment from 'moment';
import { uploadVideo } from '../../services/uploadService';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface LiveFormData {
  title: string;
  description: string;
  course_id: number;
  lesson_id?: number;
  scheduled_start_time: string;
  scheduled_end_time: string;
  stream_url?: string;
  time_range?: any;
}

const LiveCreatePage: React.FC = () => {
  const { liveId } = useParams<{ liveId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.course);
  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [preRecordedVideoUrl, setPreRecordedVideoUrl] = useState<string>('');
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);
  
  // 获取教师课程
  useEffect(() => {
    dispatch(fetchCourses({ instructor: true }));
  }, [dispatch]);
  
  // 判断是创建还是编辑
  useEffect(() => {
    if (liveId) {
      setIsEdit(true);
      // 这里应该加载直播详情，暂时省略
    }
  }, [liveId]);
  
  // 处理课程选择变化，加载对应课程的课时
  const handleCourseChange = (courseId: number) => {
    setSelectedCourse(courseId);
    const selectedCourse = courses.find(course => course.id === courseId);
    
    if (selectedCourse && Array.isArray(selectedCourse.sections)) {
      // 收集所有课时
      const allLessons: any[] = [];
      selectedCourse.sections.forEach(section => {
        if (Array.isArray(section.lessons)) {
          section.lessons.forEach(lesson => {
            allLessons.push({
              ...lesson,
              section_title: section.title
            });
          });
        }
      });
      
      setLessons(allLessons);
    } else {
      setLessons([]);
    }
  };
  
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
    setLoading(true);
    
    try {
      // 处理时间格式
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
      const courseId = parseInt(values.course_id, 10);
      if (isNaN(courseId)) {
        throw new Error('课程ID必须是有效的数字');
      }
      
      const formData = {
        title: values.title.trim(),
        description: values.description.trim(),
        course: courseId,
        scheduled_start_time: startTimeStr,
        scheduled_end_time: endTimeStr,
        status: 'scheduled',
        // 如果有lesson_id，也需要转换为数字
        ...(values.lesson_id ? { lesson_id: parseInt(values.lesson_id, 10) } : {}),
        // 添加预录制视频URL
        pre_recorded_video_url: preRecordedVideoUrl || null
      };
      
      console.log('提交数据:', JSON.stringify(formData, null, 2));
      
      if (isEdit && liveId) {
        // 更新直播
        // await dispatch(updateLiveStream({ liveId: Number(liveId), liveData: formData }));
        message.success('直播更新成功');
      } else {
        // 创建直播
        try {
          const result = await dispatch(createLiveEvent(formData)).unwrap();
          console.log('创建结果:', result);
          message.success('直播创建成功');
          navigate(`/live/${result.id}`);
        } catch (err) {
          message.error('创建直播失败，请查看控制台日志');
        }
      }
    } catch (error: any) {
      console.error('操作失败:', error);
      message.error(error?.message || '操作失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  if (coursesLoading) {
    return <Spin size="large" />;
  }
  
  return (
    <div>
      <Title level={2}>{isEdit ? '编辑直播' : '创建新直播'}</Title>
      <Paragraph>设置直播信息，学生可以在预定时间参与直播互动</Paragraph>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="直播标题"
                rules={[{ required: true, message: '请输入直播标题' }]}
              >
                <Input 
                  placeholder="输入直播标题" 
                  prefix={<VideoCameraOutlined />} 
                />
              </Form.Item>
              
              <Form.Item
                name="description"
                label="直播简介"
                rules={[{ required: true, message: '请输入直播简介' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="输入直播简介，向学生介绍本次直播内容" 
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="course_id"
                    label="关联课程"
                    rules={[{ required: true, message: '请选择关联课程' }]}
                  >
                    <Select 
                      placeholder="选择关联课程" 
                      onChange={handleCourseChange}
                    >
                      {Array.isArray(courses) && courses.map(course => (
                        <Option key={course.id} value={course.id}>{course.title}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="lesson_id"
                    label="关联课时"
                    rules={[{ required: false, message: '请选择关联课时' }]}
                  >
                    <Select 
                      placeholder="选择关联课时" 
                      disabled={!selectedCourse || lessons.length === 0}
                    >
                      {lessons.map(lesson => (
                        <Option key={lesson.id} value={lesson.id}>
                          {lesson.section_title} - {lesson.title}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="time_range"
                label="直播时间"
                rules={[{ required: true, message: '请选择直播时间' }]}
              >
                <RangePicker 
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder={['开始时间', '结束时间']}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                name="stream_url"
                label="直播流地址"
                extra="推流地址，如OBS、腾讯云等直播服务提供的URL"
              >
                <Input placeholder="输入直播流地址（可选）" />
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
            </Col>
            
            <Col span={8}>
              <Card title="直播说明" style={{ marginBottom: 16 }}>
                <ul style={{ paddingLeft: 20 }}>
                  <li>直播开始前15分钟，系统会自动发送通知</li>
                  <li>学生可以在课程页面或直播页面看到即将开始的直播</li>
                  <li>直播过程中学生可以发送实时消息互动</li>
                  <li>直播结束后可以查看参与记录</li>
                </ul>
              </Card>
              
              <Card title="直播技巧">
                <Paragraph>
                  <Text strong>推荐工具：</Text> OBS Studio（免费直播推流软件）
                </Paragraph>
                <Paragraph>
                  <Text strong>注意事项：</Text>
                </Paragraph>
                <ul style={{ paddingLeft: 20 }}>
                  <li>提前测试设备和网络</li>
                  <li>准备好课程大纲和教学资料</li>
                  <li>使用有线网络连接获得更稳定体验</li>
                </ul>
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={isEdit ? <SaveOutlined /> : <CheckOutlined />}
                loading={loading}
              >
                {isEdit ? '保存修改' : '创建直播'}
              </Button>
              
              <Button 
                icon={<RollbackOutlined />}
                onClick={() => navigate('/teacher')}
              >
                返回
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LiveCreatePage; 