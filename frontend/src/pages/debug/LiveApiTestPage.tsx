import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Divider, Input, DatePicker, Select, Form, List, Tag } from 'antd';
import moment from 'moment';
import * as liveService from '../../services/liveService';
import * as courseService from '../../services/courseService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const LiveApiTestPage: React.FC = () => {
  const [form] = Form.useForm();
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    fetchLiveEvents();
    fetchCourses();
  }, []);

  const fetchLiveEvents = async () => {
    setLoading(true);
    try {
      const response = await liveService.getLiveEvents();
      setLiveEvents(response.results || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || '获取直播列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await courseService.getCourses({ instructor: 'true' });
      setCourses(response.results || []);
    } catch (err: any) {
      console.error("获取课程列表失败:", err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCreateLive = async (values: any) => {
    setLoading(true);
    try {
      const [startTime, endTime] = values.time_range;
      
      // 将moment对象转换为ISO格式的字符串
      const startTimeStr = startTime.toISOString();
      const endTimeStr = endTime.toISOString();
      
      console.log("时间格式化:", {
        原始开始时间: startTime,
        原始结束时间: endTime,
        格式化开始时间: startTimeStr,
        格式化结束时间: endTimeStr
      });
      
      // 确保课程ID是数字
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
      };
      
      console.log("发送数据:", JSON.stringify(liveData, null, 2));
      const response = await liveService.createLiveEvent(liveData);
      console.log("响应结果:", response);
      
      setResult(response);
      setError(null);
      form.resetFields();
      fetchLiveEvents(); // 刷新列表
    } catch (err: any) {
      console.error("创建直播错误:", err);
      
      let errorMsg;
      try {
        if (typeof err.message === 'string' && err.message.startsWith('{')) {
          const errorData = JSON.parse(err.message);
          const errorFields = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          errorMsg = `创建失败: ${errorFields}`;
        } else {
          errorMsg = err.message || '创建直播失败，请稍后再试';
        }
      } catch (e) {
        errorMsg = err.response?.data?.detail || err.message || '创建直播失败';
      }
      
      setError(errorMsg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getLiveDetail = async (eventId: number) => {
    setLoading(true);
    try {
      const response = await liveService.getLiveEventDetail(eventId);
      setSelectedEvent(response);
      setError(null);
    } catch (err: any) {
      setError(err.message || '获取直播详情失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>直播 API 测试页面</Title>
      <Paragraph>此页面用于测试直播相关的 API 功能</Paragraph>

      <Divider orientation="left">创建直播</Divider>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLive}
        >
          <Form.Item
            name="title"
            label="直播标题"
            rules={[{ required: true, message: '请输入直播标题' }]}
          >
            <Input placeholder="请输入直播标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="直播描述"
            rules={[{ required: true, message: '请输入直播描述' }]}
          >
            <TextArea rows={4} placeholder="请输入直播描述" />
          </Form.Item>

          <Form.Item
            name="course"
            label="关联课程"
            rules={[{ required: true, message: '请选择关联课程' }]}
          >
            <Select 
              placeholder="请选择关联课程" 
              loading={loadingCourses}
              showSearch
              optionFilterProp="children"
            >
              {courses.map((course: any) => (
                <Option key={course.id} value={course.id}>
                  {course.title}
                </Option>
              ))}
              {courses.length === 0 && !loadingCourses && (
                <Option value="" disabled>
                  暂无可用课程
                </Option>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="time_range"
            label="直播时间"
            rules={[{ required: true, message: '请选择直播时间' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建直播
            </Button>
          </Form.Item>
        </Form>

        {error && (
          <div style={{ marginTop: 16, color: 'red' }}>
            错误: {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 16 }}>
            <Title level={4}>创建结果:</Title>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </Card>

      <Divider orientation="left">直播列表</Divider>
      <Card>
        <Button 
          type="primary" 
          onClick={fetchLiveEvents} 
          loading={loading}
          style={{ marginBottom: 16 }}
        >
          刷新列表
        </Button>

        <List
          dataSource={liveEvents}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button onClick={() => getLiveDetail(item.id)}>查看详情</Button>
              ]}
            >
              <List.Item.Meta
                title={item.title}
                description={
                  <Space>
                    <Tag color={
                      item.status === 'scheduled' ? 'blue' : 
                      item.status === 'live' ? 'green' : 
                      'gray'
                    }>
                      {item.status === 'scheduled' ? '未开始' : 
                       item.status === 'live' ? '直播中' : 
                       '已结束'}
                    </Tag>
                    <Text type="secondary">开始时间: {new Date(item.scheduled_start_time).toLocaleString()}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {selectedEvent && (
        <>
          <Divider orientation="left">直播详情</Divider>
          <Card>
            <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
          </Card>
        </>
      )}
    </div>
  );
};

export default LiveApiTestPage; 