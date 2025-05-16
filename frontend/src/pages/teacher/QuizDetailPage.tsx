import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Button, Spin, Tabs, 
  List, Tag, Space, Divider, Empty, message,
  Modal, Form, InputNumber, Input, Alert
} from 'antd';
import { 
  EditOutlined, BarChartOutlined, 
  PlayCircleOutlined, DeleteOutlined,
  ArrowLeftOutlined, CommentOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchQuizDetail, gradeShortAnswer, fetchQuestionAnswers, fetchAttemptShortAnswers } from '../../redux/slices/quizSlice';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const QuizDetailPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentQuiz, loading } = useAppSelector((state) => state.quiz);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [form] = Form.useForm();
  
  // 获取测验详情
  useEffect(() => {
    if (quizId && !isNaN(Number(quizId))) {
      console.log('加载测验详情:', quizId);
      dispatch(fetchQuizDetail(Number(quizId)))
        .unwrap()
        .then(data => {
          console.log('测验详情加载成功:', data);
          
          // 查找所有与此测验相关的尝试，获取它们的ID
          if (data.attempts && data.attempts.length > 0) {
            // 对于每个已完成的尝试，获取其中的简答题答案
            data.attempts
              .filter((attempt: any) => attempt.status === 'completed')
              .forEach((attempt: any) => {
                dispatch(fetchAttemptShortAnswers(attempt.id));
              });
          } else {
            // 测验加载成功后，获取所有简答题的答案
            if (data.questions && data.questions.length > 0) {
              const shortAnswerQuestions = data.questions.filter(
                (question: any) => question.question_type === 'short_answer'
              );
              
              // 为每个简答题获取答案
              shortAnswerQuestions.forEach((question: any) => {
                dispatch(fetchQuestionAnswers(question.id));
              });
            }
          }
        })
        .catch(error => {
          console.error('加载测验详情失败:', error);
          message.error('加载测验详情失败，请稍后再试');
        });
    } else if (quizId) {
      console.error('无效的测验ID:', quizId);
      message.error('无效的测验ID');
    }
  }, [dispatch, quizId]);
  
  // 如果正在加载，则显示加载指示器
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <p>加载测验信息...</p>
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
  
  // 渲染测验基本信息
  const renderQuizInfo = () => (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>测验标题:</Text> {currentQuiz.title}
        </div>
        {currentQuiz.description && (
          <div>
            <Text strong>测验说明:</Text> {currentQuiz.description}
          </div>
        )}
        <div>
          <Text strong>时间限制:</Text> {currentQuiz.time_limit} 分钟
        </div>
        <div>
          <Text strong>通过分数:</Text> {currentQuiz.pass_score} 分
        </div>
        <div>
          <Text strong>问题数量:</Text> {currentQuiz.questions?.length || 0} 题
        </div>
        <div>
          <Text strong>允许多次尝试:</Text> {currentQuiz.allow_multiple_attempts ? '是' : '否'}
        </div>
        {currentQuiz.allow_multiple_attempts && (
          <div>
            <Text strong>最大尝试次数:</Text> {currentQuiz.max_attempts} 次
          </div>
        )}
        <div>
          <Text strong>随机问题顺序:</Text> {currentQuiz.randomize_questions ? '是' : '否'}
        </div>
        <div>
          <Text strong>显示正确答案:</Text> {currentQuiz.show_correct_answers ? '是' : '否'}
        </div>
        {currentQuiz.lesson && (
          <div>
            <Text strong>关联课时:</Text> {currentQuiz.lesson.title}
          </div>
        )}
      </Space>
    </Card>
  );
  
  // 打开评分弹窗
  const handleOpenGradeModal = (answer: any) => {
    setCurrentAnswer(answer);
    form.setFieldsValue({
      score: answer.score || 0,
      feedback: answer.feedback || ''
    });
    setGradeModalVisible(true);
  };
  
  // 提交评分
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
      
      // 刷新测验详情
      if (quizId) {
        dispatch(fetchQuizDetail(Number(quizId)));
      }
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
            <div style={{ marginBottom: 16 }}>{currentAnswer.question.question_text}</div>
            
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
                max={currentAnswer.question.points || 100}
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
  
  // 渲染问题列表
  const renderQuestionsList = () => (
    <List
      itemLayout="vertical"
      dataSource={currentQuiz.questions || []}
      renderItem={(question, index) => (
        <List.Item
          key={question.id}
          extra={
            <Tag color="blue">
              {question.question_type === 'single_choice' ? '单选题' : 
               question.question_type === 'multiple_choice' ? '多选题' : 
               question.question_type === 'true_false' ? '判断题' : '简答题'}
            </Tag>
          }
        >
          <List.Item.Meta
            title={`题目 ${index + 1}: ${question.question_text}`}
            description={`分值: ${question.points} 分`}
          />
          
          {(question.question_type === 'single_choice' || 
            question.question_type === 'multiple_choice' || 
            question.question_type === 'true_false') && (
            <div style={{ marginTop: 12 }}>
              <Text strong>选项:</Text>
              <List
                size="small"
                dataSource={question.choices || []}
                renderItem={choice => (
                  <List.Item>
                    <Space>
                      {choice.is_correct && <Tag color="green">正确答案</Tag>}
                      {choice.choice_text}
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          )}
          
          {/* 添加简答题答案展示区 */}
          {question.question_type === 'short_answer' && (
            <div style={{ marginTop: 16 }}>
              <Divider orientation="left">学生答案</Divider>
              {(question as any).answers && (question as any).answers.length > 0 ? (
                <List
                  size="small"
                  dataSource={(question as any).answers}
                  renderItem={(answer: any) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="primary" 
                          icon={<CommentOutlined />} 
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
                          <span style={{ fontWeight: 'bold', marginRight: 8 }}>答案:</span>
                          {answer.text_answer || '未作答'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold', marginRight: 8 }}>得分:</span>
                          {answer.score !== undefined ? answer.score : '未评分'} / {question.points}
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
                  <Alert
                    message="提示"
                    description="学生尚未提交此题答案，或者答案数据未能成功加载。"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                  <Button 
                    type="primary" 
                    onClick={() => dispatch(fetchQuestionAnswers(question.id))}
                    style={{ marginTop: 16 }}
                  >
                    重新加载答案
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {question.explanation && (
            <div style={{ marginTop: 12 }}>
              <Text strong>解析:</Text> {question.explanation}
            </div>
          )}
        </List.Item>
      )}
    />
  );
  
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/teacher')}
          >
            返回
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/teacher/quizzes/edit/${quizId}`)}
          >
            编辑测验
          </Button>
          <Button 
            icon={<BarChartOutlined />}
            onClick={() => navigate(`/teacher/quizzes/${quizId}/statistics`)}
          >
            查看统计
          </Button>
          <Button 
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => navigate(`/quiz-preview/${quizId}`)}
          >
            预览测验
          </Button>
        </Space>
      </div>
      
      <Title level={2}>{currentQuiz.title}</Title>
      <Paragraph>{currentQuiz.description}</Paragraph>
      
      <Divider />
      
      <Tabs defaultActiveKey="info">
        <TabPane tab="基本信息" key="info">
          {renderQuizInfo()}
        </TabPane>
        <TabPane tab="题目" key="questions">
          {renderQuestionsList()}
        </TabPane>
      </Tabs>
      
      {/* 添加评分弹窗 */}
      {renderGradeModal()}
    </div>
  );
};

export default QuizDetailPage; 