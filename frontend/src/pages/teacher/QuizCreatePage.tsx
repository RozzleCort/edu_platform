import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Form, Input, Button, Select, InputNumber, 
  Card, message, Spin, Space, Divider, Row, Col, Radio,
  Checkbox, List, Collapse, Switch, Popconfirm, Tag
} from 'antd';
import { 
  FormOutlined, PlusOutlined, DeleteOutlined, 
  SaveOutlined, CheckOutlined, RollbackOutlined,
  EditOutlined, EyeOutlined, CopyOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { createQuiz } from '../../redux/slices/quizSlice';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

interface ChoiceFormData {
  id?: number;
  choice_text: string;
  is_correct: boolean;
  order?: number;
  explanation?: string;
}

interface QuestionFormData {
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  points: number;
  explanation?: string;
  choices: ChoiceFormData[];
}

interface QuizFormData {
  title: string;
  description?: string;
  course_id: number;
  lesson_id?: number;  // 可选字段
  time_limit: number;
  pass_score: number;
  allow_multiple_attempts: boolean;
  max_attempts: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  questions: QuestionFormData[];
}

const QuizCreatePage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { courses, loading: coursesLoading } = useAppSelector((state) => state.course);
  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionFormData | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  
  // 获取教师课程
  useEffect(() => {
    dispatch(fetchCourses({ instructor: true }));
  }, [dispatch]);
  
  // 判断是创建还是编辑
  useEffect(() => {
    if (quizId) {
      setIsEdit(true);
      // 这里应该加载测验详情，暂时省略
    }
  }, [quizId]);
  
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
  
  // 处理问题类型变化
  const handleQuestionTypeChange = (questionType: string) => {
    if (currentQuestion) {
      // 根据问题类型，设置默认选项
      let choices: ChoiceFormData[] = [];
      
      if (questionType === 'single_choice') {
        choices = [
          { choice_text: '选项A', is_correct: false },
          { choice_text: '选项B', is_correct: false },
          { choice_text: '选项C', is_correct: false },
          { choice_text: '选项D', is_correct: false }
        ];
      } else if (questionType === 'multiple_choice') {
        choices = [
          { choice_text: '选项A', is_correct: false },
          { choice_text: '选项B', is_correct: false },
          { choice_text: '选项C', is_correct: false },
          { choice_text: '选项D', is_correct: false }
        ];
      } else if (questionType === 'true_false') {
        choices = [
          { choice_text: '正确', is_correct: true },
          { choice_text: '错误', is_correct: false }
        ];
      } else {
        choices = [];
      }
      
      setCurrentQuestion({
        ...currentQuestion,
        question_type: questionType as any,
        choices
      });
    }
  };
  
  // 添加新问题
  const handleAddQuestion = () => {
    setCurrentQuestion({
      question_text: '',
      question_type: 'single_choice',
      points: 10,
      explanation: '',
      choices: [
        { choice_text: '选项A', is_correct: false },
        { choice_text: '选项B', is_correct: false },
        { choice_text: '选项C', is_correct: false },
        { choice_text: '选项D', is_correct: false }
      ]
    });
    setEditingQuestionIndex(null);
  };
  
  // 编辑现有问题
  const handleEditQuestion = (index: number) => {
    setCurrentQuestion({ ...questions[index] });
    setEditingQuestionIndex(index);
  };
  
  // 删除问题
  const handleDeleteQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    message.success('问题已删除');
  };
  
  // 保存当前编辑的问题
  const handleSaveQuestion = () => {
    if (!currentQuestion) return;
    
    // 验证问题
    if (!currentQuestion.question_text) {
      message.error('请输入问题文本');
      return;
    }
    
    if (currentQuestion.question_type === 'single_choice' || 
        currentQuestion.question_type === 'multiple_choice') {
      // 验证有至少两个选项
      if (currentQuestion.choices.length < 2) {
        message.error('请至少添加两个选项');
        return;
      }
      
      // 验证选择了正确答案
      const hasCorrectChoice = currentQuestion.choices.some(c => c.is_correct);
      if (!hasCorrectChoice) {
        message.error('请标记至少一个正确答案');
        return;
      }
    }
    
    const newQuestions = [...questions];
    
    if (editingQuestionIndex !== null) {
      // 更新现有问题
      newQuestions[editingQuestionIndex] = currentQuestion;
    } else {
      // 添加新问题
      newQuestions.push(currentQuestion);
    }
    
    setQuestions(newQuestions);
    setCurrentQuestion(null);
    setEditingQuestionIndex(null);
    message.success('问题已保存');
  };
  
  // 处理选项变化
  const handleChoiceTextChange = (index: number, value: string) => {
    if (!currentQuestion) return;
    
    const newChoices = [...currentQuestion.choices];
    newChoices[index] = { ...newChoices[index], choice_text: value };
    
    setCurrentQuestion({
      ...currentQuestion,
      choices: newChoices
    });
  };
  
  // 处理正确答案变化（单选题和判断题）
  const handleSingleCorrectChange = (index: number) => {
    if (!currentQuestion) return;
    
    const newChoices = currentQuestion.choices.map((choice, i) => ({
      ...choice,
      is_correct: i === index
    }));
    
    setCurrentQuestion({
      ...currentQuestion,
      choices: newChoices
    });
  };
  
  // 处理正确答案变化（多选题）
  const handleMultipleCorrectChange = (index: number, checked: boolean) => {
    if (!currentQuestion) return;
    
    const newChoices = [...currentQuestion.choices];
    newChoices[index] = { ...newChoices[index], is_correct: checked };
    
    setCurrentQuestion({
      ...currentQuestion,
      choices: newChoices
    });
  };
  
  // 添加新选项
  const handleAddChoice = () => {
    if (!currentQuestion) return;
    
    const newChoices = [
      ...currentQuestion.choices,
      { choice_text: `选项${String.fromCharCode(65 + currentQuestion.choices.length)}`, is_correct: false }
    ];
    
    setCurrentQuestion({
      ...currentQuestion,
      choices: newChoices
    });
  };
  
  // 删除选项
  const handleDeleteChoice = (index: number) => {
    if (!currentQuestion) return;
    
    if (currentQuestion.choices.length <= 2) {
      message.error('至少需要保留两个选项');
      return;
    }
    
    const newChoices = [...currentQuestion.choices];
    newChoices.splice(index, 1);
    
    setCurrentQuestion({
      ...currentQuestion,
      choices: newChoices
    });
  };
  
  // 处理测验表单提交
  const handleSubmit = async (values: any) => {
    if (questions.length === 0) {
      message.error('请至少添加一个问题');
      return;
    }
    
    setLoading(true);
    
    try {
      // 构建测验数据
      const quizData: any = {
        title: values.title,
        description: values.description || '',
        time_limit: values.time_limit,
        pass_score: values.pass_score,
        allow_multiple_attempts: values.allow_multiple_attempts,
        max_attempts: values.max_attempts,
        randomize_questions: values.randomize_questions,
        show_correct_answers: values.show_correct_answers,
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          points: q.points,
          choices: q.choices.map((c) => ({
            choice_text: c.choice_text,
            is_correct: c.is_correct
          }))
        }))
      };
      
      // 如果选择了课时，则添加lesson字段
      if (values.lesson_id) {
        quizData.lesson = values.lesson_id;
      }
      
      // 创建测验
      const result = await dispatch(createQuiz(quizData)).unwrap();
      message.success('测验创建成功');
      if (result && result.id) {
        console.log('测验创建成功，ID:', result.id);
        navigate(`/teacher/quizzes/${result.id}`);
      } else {
        console.error('创建测验成功但未返回有效ID:', result);
        message.warning('测验已创建，但无法跳转到详情页');
        navigate('/teacher');
      }
    } catch (error: any) {
      console.error('创建测验失败:', error);
      message.error(error?.message || '创建测验失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 渲染问题编辑表单
  const renderQuestionForm = () => {
    if (!currentQuestion) return null;
    
    return (
      <Card 
        title={editingQuestionIndex !== null ? '编辑问题' : '添加新问题'}
        extra={
          <Button 
            type="primary"
            onClick={handleSaveQuestion}
          >
            保存问题
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Form layout="vertical">
          <Form.Item label="问题类型">
            <Select 
              value={currentQuestion.question_type} 
              onChange={handleQuestionTypeChange}
            >
              <Option value="single_choice">单选题</Option>
              <Option value="multiple_choice">多选题</Option>
              <Option value="true_false">判断题</Option>
              <Option value="short_answer">简答题</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="问题内容">
            <TextArea 
              rows={3} 
              value={currentQuestion.question_text}
              onChange={e => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
              placeholder="输入问题内容"
            />
          </Form.Item>
          
          <Form.Item label="分值">
            <InputNumber
              min={1}
              max={100}
              value={currentQuestion.points}
              onChange={value => setCurrentQuestion({ ...currentQuestion, points: Number(value) })}
            />
          </Form.Item>
          
          {(currentQuestion.question_type === 'single_choice' || 
            currentQuestion.question_type === 'multiple_choice') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Title level={5}>选项</Title>
                <Button 
                  type="dashed" 
                  onClick={handleAddChoice}
                  icon={<PlusOutlined />}
                >
                  添加选项
                </Button>
              </div>
              
              {currentQuestion.choices.map((choice, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                  {currentQuestion.question_type === 'single_choice' ? (
                    <Radio 
                      checked={choice.is_correct}
                      onChange={() => handleSingleCorrectChange(index)}
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <Checkbox 
                      checked={choice.is_correct}
                      onChange={e => handleMultipleCorrectChange(index, e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  
                  <Input 
                    value={choice.choice_text}
                    onChange={e => handleChoiceTextChange(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteChoice(index)}
                    style={{ marginLeft: 8 }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {currentQuestion.question_type === 'true_false' && (
            <div>
              <Title level={5}>选项</Title>
              
              {currentQuestion.choices.map((choice, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                  <Radio 
                    checked={choice.is_correct}
                    onChange={() => handleSingleCorrectChange(index)}
                    style={{ marginRight: 8 }}
                  />
                  
                  <Input 
                    value={choice.choice_text}
                    disabled // 判断题选项不可编辑
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>
          )}
          
          <Form.Item label="解析（可选）">
            <TextArea 
              rows={2} 
              value={currentQuestion.explanation || ''}
              onChange={e => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
              placeholder="输入问题解析，学生答题后可以查看"
            />
          </Form.Item>
        </Form>
      </Card>
    );
  };
  
  // 渲染问题列表
  const renderQuestionsList = () => {
    if (questions.length === 0) {
      return (
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <Paragraph>
            暂无问题，点击"添加问题"按钮开始创建测验题目
          </Paragraph>
        </div>
      );
    }
    
    return (
      <Collapse>
        {questions.map((question, index) => (
          <Panel 
            key={index} 
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>
                  {index + 1}. {question.question_text}
                </span>
                <Space>
                  <Tag color="blue">
                    {question.question_type === 'single_choice' ? '单选题' : 
                     question.question_type === 'multiple_choice' ? '多选题' : 
                     question.question_type === 'true_false' ? '判断题' : '简答题'}
                  </Tag>
                  <Tag color="green">{question.points}分</Tag>
                </Space>
              </div>
            }
            extra={
              <Space>
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={(e) => { e.stopPropagation(); handleEditQuestion(index); }}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除此问题吗？"
                  onConfirm={(e) => { e?.stopPropagation(); handleDeleteQuestion(index); }}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            }
          >
            <div>
              {(question.question_type === 'single_choice' || 
                question.question_type === 'multiple_choice' || 
                question.question_type === 'true_false') && (
                <List
                  itemLayout="horizontal"
                  dataSource={question.choices}
                  renderItem={(choice, choiceIndex) => (
                    <List.Item>
                      <Space>
                        {question.question_type === 'single_choice' || question.question_type === 'true_false' ? (
                          <Radio checked={choice.is_correct} disabled />
                        ) : (
                          <Checkbox checked={choice.is_correct} disabled />
                        )}
                        <span>{choice.choice_text}</span>
                        {choice.is_correct && <Tag color="green">正确答案</Tag>}
                      </Space>
                    </List.Item>
                  )}
                />
              )}
              
              {question.explanation && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>解析：</Text>
                  <Paragraph>{question.explanation}</Paragraph>
                </div>
              )}
            </div>
          </Panel>
        ))}
      </Collapse>
    );
  };
  
  if (coursesLoading) {
    return <Spin size="large" />;
  }
  
  return (
    <div>
      <Title level={2}>{isEdit ? '编辑测验' : '创建新测验'}</Title>
      <Paragraph>创建测验并添加问题，学生可以通过测验检验学习效果</Paragraph>
      
      <Row gutter={24}>
        <Col span={16}>
          {/* 问题编辑区域 */}
          {currentQuestion ? (
            renderQuestionForm()
          ) : (
            <Button 
              type="dashed" 
              onClick={handleAddQuestion} 
              icon={<PlusOutlined />}
              style={{ marginBottom: 24, width: '100%', height: 48 }}
            >
              添加问题
            </Button>
          )}
          
          {/* 问题列表区域 */}
          <Card title="测验问题列表" style={{ marginBottom: 24 }}>
            {renderQuestionsList()}
          </Card>
        </Col>
        
        <Col span={8}>
          {/* 测验基本信息 */}
          <Card title="测验基本信息">
            <Form
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                time_limit: 30,
                pass_score: 60,
                allow_multiple_attempts: true,
                max_attempts: 3,
                randomize_questions: false,
                show_correct_answers: true
              }}
            >
              <Form.Item
                name="title"
                label="测验标题"
                rules={[{ required: true, message: '请输入测验标题' }]}
              >
                <Input placeholder="输入测验标题" />
              </Form.Item>
              
              <Form.Item
                name="description"
                label="测验说明"
              >
                <TextArea rows={3} placeholder="输入测验说明" />
              </Form.Item>
              
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
              
              <Form.Item
                name="lesson_id"
                label="关联课时（可选）"
              >
                <Select 
                  placeholder="选择关联课时" 
                  disabled={!selectedCourse || lessons.length === 0}
                  allowClear
                >
                  {lessons.map(lesson => (
                    <Option key={lesson.id} value={lesson.id}>
                      {lesson.section_title} - {lesson.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="time_limit"
                label="时间限制（分钟）"
                rules={[{ required: true, message: '请输入时间限制' }]}
              >
                <InputNumber min={1} max={180} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="pass_score"
                label="通过分数（百分比）"
                rules={[{ required: true, message: '请输入通过分数' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="allow_multiple_attempts"
                label="允许多次尝试"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="max_attempts"
                label="最大尝试次数"
                rules={[{ required: true, message: '请输入最大尝试次数' }]}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="randomize_questions"
                label="随机问题顺序"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="show_correct_answers"
                label="显示正确答案"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    disabled={questions.length === 0}
                    icon={<CheckOutlined />}
                    loading={loading}
                  >
                    {isEdit ? '保存测验' : '创建测验'}
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/teacher')}
                    icon={<RollbackOutlined />}
                  >
                    返回
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QuizCreatePage; 