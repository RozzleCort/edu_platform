import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Typography, Card, Row, Col, Spin, Statistic, 
  Table, Progress, Tabs, Empty, Divider, 
  List, Tag, Space, Button, Alert,
  Modal, Input, InputNumber, Form, message
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  FileTextOutlined, BarChartOutlined, 
  ClockCircleOutlined, UserOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchQuizDetail, fetchQuizStatistics, gradeShortAnswer, fetchQuestionAnswers, fetchAttemptShortAnswers } from '../../redux/slices/quizSlice';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const QuizStatisticsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const dispatch = useAppDispatch();
  const { currentQuiz, quizStatistics, loading } = useAppSelector((state) => state.quiz);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [form] = Form.useForm();
  
  // 获取测验详情和统计数据
  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuizDetail(Number(quizId)))
        .then((result: any) => {
          const quiz = result.payload;
          if (quiz) {
            // 查找所有与此测验相关的尝试
            if (quiz.attempts && quiz.attempts.length > 0) {
              // 对于每个已完成的尝试，获取其中的简答题答案
              quiz.attempts
                .filter((attempt: any) => attempt.status === 'completed')
                .forEach((attempt: any) => {
                  dispatch(fetchAttemptShortAnswers(attempt.id));
                });
            } else if (quiz.questions) {
              // 如果没有尝试记录，则直接获取简答题的答案
              const shortAnswerQuestions = quiz.questions.filter(
                (q: any) => q.question_type === 'short_answer'
              );
              
              // 为每个简答题获取答案
              shortAnswerQuestions.forEach((question: any) => {
                dispatch(fetchQuestionAnswers(question.id));
              });
            }
          }
        });
      
      dispatch(fetchQuizStatistics(Number(quizId)));
    }
  }, [dispatch, quizId]);
  
  // 如果正在加载，则显示加载指示器
  if (loading || !quizStatistics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <p>加载测验统计数据...</p>
      </div>
    );
  }
  
  // 如果没有找到测验
  if (!currentQuiz) {
    return (
      <Empty
        description="未找到测验信息"
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
            title="测验尝试次数"
            value={quizStatistics.total_attempts}
            prefix={<UserOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="完成率"
            value={quizStatistics.completed_attempts}
            suffix={`/ ${quizStatistics.total_attempts} (${Math.round(quizStatistics.completed_attempts / quizStatistics.total_attempts * 100) || 0}%)`}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="通过率"
            value={Math.round(quizStatistics.pass_rate) || 0}
            suffix="%"
            valueStyle={{ 
              color: quizStatistics.pass_rate >= 70 ? '#3f8600' : 
                     quizStatistics.pass_rate >= 50 ? '#faad14' : '#cf1322' 
            }}
            prefix={quizStatistics.pass_rate >= 70 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="平均分数"
            value={quizStatistics.average_score || 0}
            suffix={`/ 100`}
            valueStyle={{ 
              color: quizStatistics.average_score >= 70 ? '#3f8600' : 
                     quizStatistics.average_score >= 50 ? '#faad14' : '#cf1322' 
            }}
          />
        </Card>
      </Col>
    </Row>
  );
  
  // 渲染分数分布
  const renderScoreDistribution = () => {
    const scoreData = [
      { range: '0-20', count: quizStatistics.score_distribution['0-20'] || 0 },
      { range: '20-40', count: quizStatistics.score_distribution['20-40'] || 0 },
      { range: '40-60', count: quizStatistics.score_distribution['40-60'] || 0 },
      { range: '60-80', count: quizStatistics.score_distribution['60-80'] || 0 },
      { range: '80-100', count: quizStatistics.score_distribution['80-100'] || 0 },
    ];
    
    const totalAttempts = quizStatistics.completed_attempts || 1;
    
    return (
      <Card title="分数分布" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {scoreData.map((item) => (
            <Col span={4} key={item.range}>
              <div style={{ textAlign: 'center' }}>
                <Progress 
                  type="circle" 
                  percent={Math.round((item.count / totalAttempts) * 100)} 
                  format={() => item.count}
                  strokeColor={
                    item.range === '80-100' ? '#52c41a' :
                    item.range === '60-80' ? '#1890ff' :
                    item.range === '40-60' ? '#faad14' :
                    item.range === '20-40' ? '#fa8c16' : '#f5222d'
                  }
                />
                <div style={{ marginTop: 8 }}>{item.range} 分</div>
              </div>
            </Col>
          ))}
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <Statistic
                title="平均完成时间"
                value={Math.round(quizStatistics.average_completion_time / 60)}
                suffix="分钟"
                prefix={<ClockCircleOutlined />}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };
  
  // 处理打开评分弹窗
  const handleOpenGradeModal = (answer: any) => {
    setCurrentAnswer(answer);
    form.setFieldsValue({
      score: answer.score || 0,
      feedback: answer.feedback || ''
    });
    setGradeModalVisible(true);
  };
  
  // 处理提交评分
  const handleSubmitGrade = async () => {
    try {
      const values = await form.validateFields();
      if (!currentAnswer) return;
      
      await dispatch(gradeShortAnswer({
        answer_id: currentAnswer.id,
        score: values.score,
        feedback: values.feedback
      })).unwrap();
      
      message.success('评分成功');
      setGradeModalVisible(false);
      
      // 刷新统计数据
      dispatch(fetchQuizStatistics(Number(quizId)));
    } catch (error) {
      console.error('评分失败:', error);
      message.error('评分失败，请重试');
    }
  };
  
  // 评分弹窗
  const renderGradeModal = () => (
    <Modal
      title="为简答题评分"
      open={gradeModalVisible}
      onCancel={() => setGradeModalVisible(false)}
      onOk={handleSubmitGrade}
      okText="提交评分"
      cancelText="取消"
    >
      {currentAnswer && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>问题:</div>
            <div style={{ marginBottom: 16 }}>{currentAnswer.question?.question_text}</div>
            
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>学生答案:</div>
            <div style={{ marginBottom: 16, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
              {currentAnswer.text_answer || '未作答'}
            </div>
          </div>
          
          <Form form={form} layout="vertical">
            <Form.Item
              name="score"
              label="得分"
              rules={[{ required: true, message: '请输入分数' }]}
            >
              <InputNumber
                min={0}
                max={currentAnswer.question?.points || 100}
                style={{ width: '100%' }}
              />
            </Form.Item>
            
            <Form.Item
              name="feedback"
              label="评语"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
  
  // 渲染问题分析
  const renderQuestionAnalysis = () => {
    const columnsForQuestions = [
      {
        title: '问题',
        dataIndex: 'text',
        key: 'text',
        ellipsis: true,
        render: (text: string, record: any) => (
          <span>
            <Tag color="blue">
              {record.type === 'single_choice' ? '单选题' : 
               record.type === 'multiple_choice' ? '多选题' : 
               record.type === 'true_false' ? '判断题' : '简答题'}
            </Tag>
            {text}
          </span>
        )
      },
      {
        title: '分值',
        dataIndex: 'points',
        key: 'points',
        width: 70,
      },
      {
        title: '答题人数',
        dataIndex: 'total_answers',
        key: 'total_answers',
        width: 100,
      },
      {
        title: '正确率',
        dataIndex: 'correct_rate',
        key: 'correct_rate',
        width: 180,
        render: (rate: number) => (
          <Progress 
            percent={Math.round(rate)} 
            size="small" 
            status={rate >= 60 ? 'success' : rate >= 40 ? 'normal' : 'exception'} 
          />
        )
      },
    ];
    
    // 展开行 - 选项分析
    const expandedRowRender = (record: any) => {
      if (!record.choices || record.choices.length === 0) {
        // 简答题处理
        if (record.type === 'short_answer') {
          // 获取该问题的所有答案
          const answers = record.answers || [];
          
          return (
            <div>
              <Alert
                message="简答题需要手动评分"
                description="简答题需要老师进行人工阅卷和评分。点击下方答案进行评分。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              {answers.length > 0 ? (
                <List
                  size="small"
                  bordered
                  dataSource={answers}
                  renderItem={(answer: any) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="primary" 
                          icon={<EditOutlined />} 
                          onClick={() => handleOpenGradeModal(answer)}
                        >
                          评分
                        </Button>
                      ]}
                    >
                      <div style={{ flex: 1 }}>
                        <div>
                          <span style={{ fontWeight: 'bold', marginRight: 8 }}>学生:</span>
                          {answer.quiz_attempt?.user?.username || '未知用户'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold', marginRight: 8 }}>学生答案:</span>
                          {answer.text_answer || '未作答'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold', marginRight: 8 }}>当前得分:</span>
                          {answer.score !== undefined ? answer.score : '未评分'} / {record.points}
                        </div>
                        {answer.feedback && (
                          <div>
                            <span style={{ fontWeight: 'bold', marginRight: 8 }}>评语:</span>
                            {answer.feedback}
                          </div>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div>
                  <Empty description="暂无学生作答" />
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Button 
                      type="primary" 
                      onClick={() => dispatch(fetchQuestionAnswers(record.id))}
                    >
                      重新获取答案
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        return <p>没有选项数据</p>;
      }
      
      // 选择题处理
      return (
        <List
          size="small"
          bordered
          dataSource={record.choices}
          renderItem={(choice: any) => (
            <List.Item>
              <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  {choice.is_correct ? 
                    <CheckCircleOutlined style={{ color: 'green', marginRight: 8 }} /> : 
                    <CloseCircleOutlined style={{ color: 'red', marginRight: 8 }} />
                  }
                  {choice.text}
                </div>
                <div style={{ width: 250 }}>
                  <Progress 
                    percent={Math.round(choice.selection_rate)} 
                    size="small"
                    format={() => `${choice.selection_count}人 (${Math.round(choice.selection_rate)}%)`}
                    status={choice.is_correct ? 'success' : 'normal'}
                  />
                </div>
              </div>
            </List.Item>
          )}
        />
      );
    };
    
    return (
      <Card title="题目分析" style={{ marginTop: 16 }}>
        <Alert 
          message="题目分析"
          description="此处显示每道题目的表现情况。正确率高的题目表示学生掌握较好，正确率低的题目可能需要加强讲解。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table 
          columns={columnsForQuestions}
          dataSource={quizStatistics.questions}
          rowKey="id"
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
          }}
        />
      </Card>
    );
  };
  
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary">
          <Link to={`/teacher/quizzes/edit/${quizId}`}>编辑测验</Link>
        </Button>
      </div>
      
      <Card title={<Title level={3}>{currentQuiz.title} - 测验统计</Title>}>
        <Paragraph>{currentQuiz.description}</Paragraph>
        
        <Divider />
        
        <Tabs defaultActiveKey="summary">
          <TabPane tab="概述" key="summary">
            {renderSummaryStats()}
            {renderScoreDistribution()}
          </TabPane>
          <TabPane tab="题目分析" key="questions">
            {renderQuestionAnalysis()}
          </TabPane>
        </Tabs>
      </Card>
      
      {/* 添加评分弹窗 */}
      {renderGradeModal()}
    </div>
  );
};

export default QuizStatisticsPage; 