import React, { useEffect } from 'react';
import { Typography, Card, Row, Col, Spin, Statistic, 
         Table, Progress, Divider, Empty, List, Tag, Space } from 'antd';
import { 
  CheckCircleOutlined, FileTextOutlined, 
  TrophyOutlined, BookOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchStudentPerformance } from '../../redux/slices/quizSlice';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const StudentPerformancePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { studentPerformance, loading } = useAppSelector((state) => state.quiz);
  
  // 获取学生测验表现数据
  useEffect(() => {
    dispatch(fetchStudentPerformance());
  }, [dispatch]);
  
  // 如果正在加载，则显示加载指示器
  if (loading || !studentPerformance) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <p>加载学习表现数据...</p>
      </div>
    );
  }
  
  // 如果没有测验数据
  if (studentPerformance.total_quizzes === 0) {
    return (
      <Empty
        description="您尚未参加任何测验"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }
  
  // 渲染概述统计
  const renderSummaryStats = () => (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card>
          <Statistic
            title="完成测验数"
            value={studentPerformance.total_quizzes}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="测验尝试次数"
            value={studentPerformance.total_attempts}
            suffix={`次`}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="平均分数"
            value={studentPerformance.average_score}
            suffix="/100"
            valueStyle={{ 
              color: studentPerformance.average_score >= 70 ? '#3f8600' : 
                     studentPerformance.average_score >= 50 ? '#faad14' : '#cf1322' 
            }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="通过率"
            value={studentPerformance.pass_rate}
            suffix="%"
            prefix={<TrophyOutlined />}
            valueStyle={{ 
              color: studentPerformance.pass_rate >= 70 ? '#3f8600' : 
                     studentPerformance.pass_rate >= 50 ? '#faad14' : '#cf1322' 
            }}
          />
        </Card>
      </Col>
    </Row>
  );
  
  // 渲染近期趋势
  const renderRecentTrend = () => (
    <Card title="近期测验表现" style={{ marginTop: 16 }}>
      <List
        itemLayout="horizontal"
        dataSource={studentPerformance.recent_trend}
        renderItem={(item: any) => (
          <List.Item
            actions={[
              <Link to={`/quiz/${item.quiz_id}`}>查看详情</Link>
            ]}
          >
            <List.Item.Meta
              avatar={
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: item.passed ? '#52c41a' : '#f5222d',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  fontSize: 20
                }}>
                  {Math.round(item.score)}
                </div>
              }
              title={item.quiz_title}
              description={
                <Space>
                  <Text type="secondary">
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Tag color={item.passed ? 'success' : 'error'}>
                    {item.passed ? '通过' : '未通过'}
                  </Tag>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
  
  // 渲染课程表现
  const renderCoursePerformance = () => {
    const columns = [
      {
        title: '课程名称',
        dataIndex: 'course_title',
        key: 'course_title',
        render: (text: string, record: any) => (
          <Link to={`/course/${record.course_id}`}>
            <Space>
              <BookOutlined />
              {text}
            </Space>
          </Link>
        )
      },
      {
        title: '测验次数',
        dataIndex: 'total_attempts',
        key: 'total_attempts',
        width: 100,
      },
      {
        title: '平均分数',
        dataIndex: 'average_score',
        key: 'average_score',
        width: 100,
        render: (score: number) => (
          <Text style={{ 
            color: score >= 70 ? '#3f8600' : 
                   score >= 50 ? '#faad14' : '#cf1322' 
          }}>
            {score} 分
          </Text>
        )
      },
      {
        title: '通过率',
        dataIndex: 'pass_rate',
        key: 'pass_rate',
        width: 180,
        render: (rate: number) => (
          <Progress 
            percent={rate} 
            size="small" 
            status={rate >= 60 ? 'success' : rate >= 40 ? 'normal' : 'exception'} 
          />
        )
      },
    ];
    
    return (
      <Card title="各课程测验表现" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={studentPerformance.courses_performance}
          rowKey="course_id"
          pagination={false}
        />
      </Card>
    );
  };
  
  return (
    <div>
      <Title level={2}>我的测验表现</Title>
      <Paragraph>这里展示了您在平台上的测验学习表现统计数据，帮助您了解自己的学习状况。</Paragraph>
      
      <Divider />
      
      {renderSummaryStats()}
      {renderRecentTrend()}
      {renderCoursePerformance()}
    </div>
  );
};

export default StudentPerformancePage; 