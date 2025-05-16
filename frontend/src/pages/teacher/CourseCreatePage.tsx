import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Form, Input, Button, Select, Switch, 
  InputNumber, Upload, Card, message, Spin, Space, Divider,
  Row, Col, Modal, Popconfirm
} from 'antd';
import { 
  LoadingOutlined, PlusOutlined, BookOutlined,
  UploadOutlined, SaveOutlined, CheckOutlined,
  DeleteOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createCourse, updateCourse, fetchCourseDetail } from '../../redux/slices/courseSlice';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CourseFormData {
  title: string;
  description: string;
  is_free: boolean;
  price: number;
  learning_objectives?: string;
  prerequisites?: string;
  status: 'draft' | 'published' | 'archived';
  cover_image?: any;
  video_url?: any;
}

const CourseCreatePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse, loading } = useAppSelector((state) => state.course);
  const { user } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadVideoLoading, setUploadVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // 监听"是否免费"字段变化
  const handleFreeChange = (checked: boolean) => {
    if (checked) {
      // 如果勾选"免费"，自动将价格设为0
      form.setFieldValue('price', 0);
    }
  };
  
  // 检查用户是否为教师
  useEffect(() => {
    if (!user || user.user_type !== 'teacher') {
      message.error('只有教师可以创建和编辑课程');
      navigate('/');
    }
  }, [user, navigate]);
  
  // 判断是创建还是编辑
  useEffect(() => {
    if (courseId && courseId !== 'undefined' && courseId !== 'null') {
      const id = parseInt(courseId);
      if (!isNaN(id)) {
        setIsEdit(true);
        dispatch(fetchCourseDetail(id));
      } else {
        message.error('无效的课程ID');
        navigate('/teacher');
      }
    }
  }, [dispatch, courseId, navigate]);
  
  // 编辑模式下，填充表单数据
  useEffect(() => {
    if (isEdit && currentCourse) {
      form.setFieldsValue({
        title: currentCourse.title,
        description: currentCourse.description,
        is_free: currentCourse.is_free,
        price: currentCourse.is_free ? 0 : currentCourse.price,
        learning_objectives: currentCourse.learning_objectives,
        prerequisites: currentCourse.prerequisites,
        status: currentCourse.status
      });
      
      if (currentCourse.cover_image) {
        setCoverImageUrl(currentCourse.cover_image);
      }
      
      if (currentCourse.video_url) {
        setVideoUrl(currentCourse.video_url);
      }
    }
  }, [form, isEdit, currentCourse]);
  
  // 处理表单提交
  const handleSubmit = async (values: CourseFormData) => {
    try {
      // 确保免费课程价格为0并且处理文件上传字段
      const courseData = {
        ...values,
        price: values.is_free ? 0 : values.price, // 免费课程价格设为0
        category: null, // 明确设置为null
        status: values.status || 'draft', // 确保有默认状态
        video_url: videoUrl, // 直接使用状态中的URL，忽略表单值
        cover_image: coverImageUrl // 直接使用状态中的URL，忽略表单值
      };

      console.log('准备提交的课程数据:', courseData);

      if (isEdit && courseId) {
        // 编辑现有课程
        const id = parseInt(courseId);
        if (isNaN(id)) {
          message.error('无效的课程ID');
          return;
        }

        // 使用Redux更新课程
        await dispatch(updateCourse({
          courseId: id,
          courseData: courseData
        })).unwrap();
        message.success('课程更新成功');
      } else {
        // 创建课程 - 直接使用fetch API，绕过Redux
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/courses/courses/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(courseData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          message.error(`创建失败 (${response.status}): ${JSON.stringify(errorData)}`);
          return;
        }

        const newCourse = await response.json();
        console.log('课程创建成功:', newCourse);
        message.success('课程创建成功');

        // 延迟导航，确保消息显示
        setTimeout(() => {
          if (newCourse.id) {
            navigate(`/teacher/courses/edit/${newCourse.id}`);
          } else {
            message.warning('创建成功但无法获取课程ID，请返回课程列表查看');
            navigate('/teacher');
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error('操作失败:', error);
      message.error(`操作失败: ${error.message || '未知错误'}`);
    }
  };
  
  // 处理封面图片上传
  const handleCoverUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setUploadLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 获取上传后的URL
      const imageUrl = info.file.response.url;
      // 确保URL是完整的URL
      const fullImageUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `http://localhost:8000${imageUrl}`;
      
      setCoverImageUrl(fullImageUrl);
      setUploadLoading(false);
      message.success('封面上传成功');
    }
  };
  
  // 上传按钮
  const uploadButton = (
    <div>
      {uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传封面</div>
    </div>
  );
  
  // 处理视频上传
  const handleVideoUpload = (info: any) => {
    if (info.file.status === 'uploading') {
      setUploadVideoLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 获取上传后的URL
      const videoUrl = info.file.response.url;
      // 确保URL是完整的URL
      const fullVideoUrl = videoUrl.startsWith('http') 
        ? videoUrl 
        : `http://localhost:8000${videoUrl}`;
      
      setVideoUrl(fullVideoUrl);
      setUploadVideoLoading(false);
      message.success('视频上传成功');
    }
  };
  
  // 视频上传按钮
  const uploadVideoButton = (
    <div>
      {uploadVideoLoading ? <LoadingOutlined /> : <UploadOutlined />}
      <div style={{ marginTop: 8 }}>上传课程视频</div>
    </div>
  );
  
  // 处理课程删除
  const handleDelete = async () => {
    if (!courseId) return;
    
    try {
      const id = parseInt(courseId);
      if (isNaN(id)) {
        message.error('无效的课程ID');
        return;
      }
      
      // 先验证课程是否存在
      const token = localStorage.getItem('token');
      const checkResponse = await fetch(`http://localhost:8000/api/courses/courses/${id}/`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // 课程不存在
      if (checkResponse.status === 404) {
        message.warning('课程不存在或已被删除');
        setTimeout(() => {
          navigate('/teacher');
        }, 1000);
        return;
      }
      
      if (!checkResponse.ok) {
        message.error(`获取课程信息失败 (${checkResponse.status})`);
        return;
      }
      
      // 使用fetch直接调用删除API
      const response = await fetch(`http://localhost:8000/api/courses/courses/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      // 检查是否删除成功
      if (response.status === 204) {
        message.success('课程已成功删除');
        // 跳转回教师中心
        setTimeout(() => {
          navigate('/teacher');
        }, 1000);
      } else if (response.status === 404) {
        message.warning('课程不存在或已被删除');
        setTimeout(() => {
          navigate('/teacher');
        }, 1000);
      } else {
        let errorMessage = '删除失败';
        try {
          const errorData = await response.json();
          errorMessage = `删除失败: ${JSON.stringify(errorData)}`;
        } catch (e) {
          // 如果无法解析JSON，使用原始错误消息
        }
        message.error(errorMessage);
      }
    } catch (error: any) {
      console.error('删除课程失败:', error);
      message.error(`删除失败: ${error.message || '未知错误'}`);
    }
  };
  
  if (loading && isEdit) {
    return <Spin size="large" />;
  }
  
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>{isEdit ? '编辑课程' : '创建新课程'}</Title>
        <Paragraph>填写课程基本信息，发布后学生可以浏览并报名。</Paragraph>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'draft',
            is_free: false,
            price: 0
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="课程标题"
                rules={[{ required: true, message: '请输入课程标题' }]}
              >
                <Input placeholder="输入课程标题" />
              </Form.Item>
              
              <Form.Item
                name="description"
                label="课程描述"
                rules={[{ required: true, message: '请输入课程描述' }]}
              >
                <TextArea rows={6} placeholder="输入课程描述" />
              </Form.Item>
              
              <Form.Item
                name="learning_objectives"
                label="学习目标"
              >
                <TextArea rows={4} placeholder="输入学生通过本课程将学到什么" />
              </Form.Item>
              
              <Form.Item
                name="prerequisites"
                label="预备知识"
              >
                <TextArea rows={4} placeholder="输入学生学习本课程前应该掌握的知识" />
              </Form.Item>
              
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="is_free"
                    label="是否免费"
                    valuePropName="checked"
                  >
                    <Switch onChange={handleFreeChange} />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item
                    name="price"
                    label="课程价格"
                    dependencies={['is_free']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          // 如果勾选了免费，则跳过验证
                          if (getFieldValue('is_free')) {
                            return Promise.resolve();
                          }
                          // 否则验证价格
                          if (value === undefined || value === null) {
                            return Promise.reject(new Error('请输入课程价格'));
                          }
                          if (value < 0) {
                            return Promise.reject(new Error('价格不能为负数'));
                          }
                          return Promise.resolve();
                        }
                      })
                    ]}
                  >
                    {({getFieldValue}) => (
                      <InputNumber 
                        min={0} 
                        step={10} 
                        style={{ width: '100%' }} 
                        placeholder="输入价格" 
                        disabled={getFieldValue('is_free')}
                        formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value: string | undefined) => {
                          return value ? Number(value.replace(/\¥\s?|(,*)/g, '')) : 0;
                        }}
                      />
                    )}
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="status"
                label="发布状态"
                rules={[{ required: true, message: '请选择发布状态' }]}
              >
                <Select placeholder="选择发布状态">
                  <Option value="draft">草稿</Option>
                  <Option value="published">已发布</Option>
                  <Option value="archived">已归档</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <Form.Item
                  name="cover_image"
                  label="课程封面"
                  extra="支持JPG, PNG格式，推荐尺寸 1920x1080"
                >
                  <Upload
                    name="file"
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    action="http://localhost:8000/api/upload/image/"
                    headers={{
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }}
                    onChange={handleCoverUpload}
                  >
                    {coverImageUrl ? 
                      <img src={coverImageUrl} alt="课程封面" style={{ width: '100%' }} /> : 
                      uploadButton}
                  </Upload>
                </Form.Item>
              </div>
              
              <Form.Item
                name="video_url"
                label="课程宣传视频"
                extra="支持MP4格式，推荐时长不超过5分钟"
              >
                <Upload
                  name="file"
                  listType="picture-card"
                  className="video-uploader"
                  showUploadList={false}
                  action="http://localhost:8000/api/upload/video/"
                  headers={{
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }}
                  onChange={handleVideoUpload}
                  accept="video/mp4,video/x-m4v,video/*"
                >
                  {videoUrl ? (
                    <div>
                      <PlayCircleOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                      <div style={{ marginTop: 8 }}>视频已上传</div>
                    </div>
                  ) : uploadVideoButton}
                </Upload>
              </Form.Item>
              
              {videoUrl && (
                <div style={{ marginTop: 16 }}>
                  <Card size="small" title="预览">
                    <video 
                      src={videoUrl} 
                      controls 
                      style={{ width: '100%' }}
                    />
                  </Card>
                </div>
              )}
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    icon={<SaveOutlined />}
                  >
                    {isEdit ? '保存课程' : '创建课程'}
                  </Button>
                  {isEdit && (
                    <Popconfirm
                      title="确定删除此课程吗？"
                      description="删除后无法恢复，已报名的学生将失去访问权限。"
                      onConfirm={handleDelete}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        danger
                        icon={<DeleteOutlined />}
                      >
                        删除课程
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default CourseCreatePage; 