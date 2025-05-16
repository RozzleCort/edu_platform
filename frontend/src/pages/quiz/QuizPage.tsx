import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Button, Steps, Radio, Checkbox, 
  Input, Space, message, Spin, Progress, Modal, Result, Tag, Collapse, notification, Alert
} from 'antd';
import { 
  ClockCircleOutlined, CheckCircleOutlined,
  WarningOutlined, LoadingOutlined, SaveOutlined,
  ExclamationCircleOutlined, EyeOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchQuizDetail, startQuizAttempt, fetchQuizAttemptDetail,
  submitAnswer, submitQuizAttempt, updateTimeRemaining
} from '../../redux/slices/quizSlice';
import { Question, Choice } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;
const { Panel } = Collapse;

// 添加自动保存的时间间隔（秒）
const AUTO_SAVE_INTERVAL = 30;
// 添加防作弊警告次数上限
const MAX_VISIBILITY_WARNINGS = 3;

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { 
    currentQuiz, currentAttempt, submittedAnswers,
    loading, timeRemaining 
  } = useAppSelector((state) => state.quiz);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [visibilityWarnings, setVisibilityWarnings] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [showVisibilityWarning, setShowVisibilityWarning] = useState(false);
  const [focusLossTime, setFocusLossTime] = useState<number | null>(null);
  
  // 用于追踪是否答案变更，以便自动保存
  const answerChangedRef = useRef(false);
  // 追踪上次保存时间
  const lastSaveTimeRef = useRef(Date.now());
  
  // 加载测验详情
  useEffect(() => {
    if (quizId) {
      dispatch(fetchQuizDetail(Number(quizId)))
        .then((resultAction) => {
          if (fetchQuizDetail.fulfilled.match(resultAction)) {
            console.log('获取测验详情成功:', resultAction.payload);
            
            // 检查是否已达到最大尝试次数
            const quiz = resultAction.payload;
            if (quiz.user_attempts_count !== undefined && 
                quiz.max_attempts !== undefined &&
                quiz.user_attempts_count >= quiz.max_attempts) {
              message.warning('您已达到此测验的最大尝试次数，无法再次参加。');
            }
          }
        });
    }
  }, [dispatch, quizId]);
  
  // 监视currentAttempt的变化
  useEffect(() => {
    console.log('currentAttempt变化:', currentAttempt);
    if (currentAttempt) {
      console.log('测验尝试状态:', currentAttempt.status);
      console.log('测验尝试答案数量:', currentAttempt.answers?.length || 0);
    }
  }, [currentAttempt]);
  
  // 监视currentQuiz和currentAttempt的变化
  useEffect(() => {
    console.log('测验或尝试状态变化:',
      { 
        hasQuiz: !!currentQuiz, 
        questionsCount: currentQuiz?.questions?.length || 0,
        hasAttempt: !!currentAttempt,
        attemptStatus: currentAttempt?.status
      }
    );
    
    // 如果currentQuiz和currentAttempt都存在但currentQuiz没有问题，重新获取测验详情
    if (currentQuiz && currentAttempt && (!currentQuiz.questions || currentQuiz.questions.length === 0)) {
      console.log('测验没有问题，重新获取测验详情');
      if (quizId) {
        dispatch(fetchQuizDetail(Number(quizId)));
      }
    }
  }, [currentQuiz, currentAttempt, dispatch, quizId]);
  
  // 处理计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timeRemaining !== null && timeRemaining > 0 && currentAttempt?.status === 'in_progress') {
      timer = setInterval(() => {
        dispatch(updateTimeRemaining(timeRemaining - 1));
      }, 1000);
    } else if (timeRemaining === 0 && currentAttempt?.status === 'in_progress') {
      // 时间到，自动提交测验
      handleSubmitQuiz();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeRemaining, dispatch, currentAttempt]);
  
  // 自动保存答案
  useEffect(() => {
    let autoSaveTimer: NodeJS.Timeout;
    
    if (currentAttempt?.status === 'in_progress') {
      autoSaveTimer = setInterval(() => {
        const currentTime = Date.now();
        const timeSinceLastSave = currentTime - lastSaveTimeRef.current;
        
        if (answerChangedRef.current && timeSinceLastSave >= AUTO_SAVE_INTERVAL * 1000) {
          handleAutoSave();
        }
      }, 5000); // 每5秒检查一次是否需要自动保存
    }
    
    return () => {
      if (autoSaveTimer) clearInterval(autoSaveTimer);
    };
  }, [currentAttempt, currentQuestionIndex]);
  
  // 监控页面可见性变化（防作弊）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPageVisible(false);
        setFocusLossTime(Date.now());
        
        if (currentAttempt?.status === 'in_progress' && currentQuiz && currentQuiz.time_limit > 0) {
          setShowVisibilityWarning(true);
          setVisibilityWarnings(prev => prev + 1);
        }
      } else {
        setIsPageVisible(true);
        
        // 如果停留在其他页面超过30秒，且测验在进行中
        if (focusLossTime && (Date.now() - focusLossTime) > 30000 && currentAttempt?.status === 'in_progress') {
          notification.warning({
            message: '切换页面警告',
            description: '您已离开测验页面较长时间，这可能被视为作弊行为。请保持测验页面的专注。',
            duration: 10
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 监控鼠标离开窗口
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && currentAttempt?.status === 'in_progress') {
        notification.warning({
          message: '离开页面警告',
          description: '请不要离开测验页面，这可能被视为作弊行为。',
          duration: 5
        });
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [currentAttempt, currentQuiz, focusLossTime]);
  
  // 检查作弊警告次数
  useEffect(() => {
    if (visibilityWarnings >= MAX_VISIBILITY_WARNINGS && currentAttempt?.status === 'in_progress') {
      Modal.confirm({
        title: '作弊警告',
        icon: <ExclamationCircleOutlined />,
        content: '您多次离开测验页面，系统已记录此行为。是否继续测验？若继续离开页面，测验可能会被自动提交。',
        okText: '继续测验',
        cancelText: '提交测验',
        onCancel: () => handleSubmitQuiz()
      });
    }
  }, [visibilityWarnings]);
  
  // 开始测验
  const handleStartQuiz = async () => {
    if (quizId) {
      try {
        console.log('开始测验, quizId:', quizId);
        const resultAction = await dispatch(startQuizAttempt(Number(quizId)));
        
        // 检查action是否成功
        if (startQuizAttempt.fulfilled.match(resultAction)) {
          const quizAttempt = resultAction.payload;
          console.log('测验开始成功，返回的attempt:', quizAttempt);
          
          // 确保我们有attempt ID，然后获取详情
          if (quizAttempt && quizAttempt.id) {
            // 重新获取测验详情，确保包含问题
            await dispatch(fetchQuizDetail(Number(quizId)));
            
            // 获取测验尝试详情
            await dispatch(fetchQuizAttemptDetail(quizAttempt.id));
            
            message.success('测验已开始，请认真作答');
          }
        } else {
          const errorMsg = resultAction.error.message || '';
          console.error('开始测验失败:', resultAction.error);
          
          // 检查是否是达到最大尝试次数的错误
          if (errorMsg.includes('您已达到测验最大尝试次数')) {
            Modal.error({
              title: '无法开始测验',
              content: '您已达到此测验允许的最大尝试次数。',
              okText: '确定'
            });
          } else {
            message.error('开始测验失败，请稍后再试');
          }
        }
      } catch (error) {
        console.error('开始测验异常:', error);
        message.error('开始测验失败，请稍后再试');
      }
    }
  };
  
  // 自动保存当前答案
  const handleAutoSave = async () => {
    if (!currentQuiz || !currentAttempt) return;
    
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    // 验证是否有答案需要保存
    const hasAnswer = (
      (currentQuestion.question_type === 'single_choice' && selectedChoices.length > 0) ||
      (currentQuestion.question_type === 'multiple_choice' && selectedChoices.length > 0) ||
      (currentQuestion.question_type === 'true_false' && selectedChoices.length > 0) ||
      (currentQuestion.question_type === 'short_answer' && textAnswer.trim() !== '')
    );
    
    if (!hasAnswer) return;
    
    // 检查是否已经提交过该题的答案
    const existingAnswer = submittedAnswers.find(a => a.question.id === currentQuestion.id);
    if (existingAnswer) {
      // 如果答案没有变化，不需要保存
      if (
        (currentQuestion.question_type === 'short_answer' && existingAnswer.text_answer === textAnswer) ||
        (currentQuestion.question_type !== 'short_answer' && 
         JSON.stringify(existingAnswer.selected_choices.map(c => c.id).sort()) === 
         JSON.stringify(selectedChoices.sort()))
      ) {
        answerChangedRef.current = false;
        return;
      }
    }
    
    setAutoSaveStatus('saving');
    try {
      const answerData: any = {
        quiz_attempt: currentAttempt.id,
        question: currentQuestion.id
      };
      
      if (currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') {
        answerData.selected_choice_ids = selectedChoices;
      } else {
        answerData.text_answer = textAnswer;
      }
      
      await dispatch(submitAnswer(answerData));
      setAutoSaveStatus('saved');
      lastSaveTimeRef.current = Date.now();
      answerChangedRef.current = false;
      
      // 3秒后重置保存状态
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('自动保存失败:', error);
      
      // 5秒后重置错误状态
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 5000);
    }
  };
  
  // 加载当前问题的已提交答案
  useEffect(() => {
    if (currentQuiz && currentAttempt) {
      const currentQuestion = currentQuiz.questions[currentQuestionIndex];
      
      // 如果已经提交了答案，加载已选选项
      if (currentQuestion) {
        const answer = submittedAnswers.find(a => a.question.id === currentQuestion.id);
        
        if (answer) {
          if (currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'multiple_choice') {
            setSelectedChoices(answer.selected_choices.map(c => c.id));
          } else if (currentQuestion.question_type === 'true_false') {
            setSelectedChoices(answer.selected_choices.map(c => c.id));
          } else if (currentQuestion.question_type === 'short_answer') {
            setTextAnswer(answer.text_answer || '');
          }
          answerChangedRef.current = false;
        } else {
          // 清空选择
          setSelectedChoices([]);
          setTextAnswer('');
          answerChangedRef.current = false;
        }
      }
    }
  }, [currentQuiz, currentAttempt, currentQuestionIndex, submittedAnswers]);
  
  // 提交答案
  const handleSubmitAnswer = async () => {
    if (!currentQuiz || !currentAttempt) return;
    
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    // 验证答案
    if (
      (currentQuestion.question_type === 'single_choice' && selectedChoices.length === 0) ||
      (currentQuestion.question_type === 'true_false' && selectedChoices.length === 0) ||
      (currentQuestion.question_type === 'short_answer' && !textAnswer.trim())
    ) {
      message.warning('请回答问题');
      return;
    }
    
    setSubmitting(true);
    try {
      const answerData: any = {
        quiz_attempt: currentAttempt.id,
        question: currentQuestion.id
      };
      
      if (currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') {
        answerData.selected_choice_ids = selectedChoices;
      } else {
        answerData.text_answer = textAnswer;
      }
      
      await dispatch(submitAnswer(answerData));
      lastSaveTimeRef.current = Date.now();
      answerChangedRef.current = false;
      
      // 移动到下一题或完成测验
      if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        message.success('答案已提交，进入下一题');
      } else {
        message.success('所有问题已回答完成');
        setShowConfirmSubmit(true);
      }
    } catch (error) {
      message.error('提交答案失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 提交整个测验
  const handleSubmitQuiz = async () => {
    if (!currentAttempt) return;
    
    setSubmitting(true);
    try {
      await dispatch(submitQuizAttempt(currentAttempt.id));
      message.success('测验已提交，正在计算结果...');
      setShowConfirmSubmit(false);
      
      // 如果是自动提交（超时），显示结果
      if (timeRemaining === 0) {
        message.warning('测验时间已到，系统已自动提交');
      }
    } catch (error) {
      message.error('提交测验失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 导航到上一题
  const handlePrevQuestion = () => {
    // 自动保存当前答案
    if (answerChangedRef.current) {
      handleAutoSave();
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // 导航到下一题
  const handleNextQuestion = () => {
    // 检查当前问题是否已经作答
    if (currentQuiz) {
      const currentQuestion = currentQuiz.questions[currentQuestionIndex];
      
      // 检查是否已经提交过这个问题的答案
      const isAnswered = submittedAnswers.some(a => a.question.id === currentQuestion.id);
      
      // 如果已经修改了答案但未提交，先自动保存
      if (answerChangedRef.current) {
        handleAutoSave();
      } 
      // 如果没有提交过答案，且当前有选择，则先提交答案
      else if (!isAnswered) {
        // 检查是否已经选择了答案
        const hasAnswer = 
          (currentQuestion.question_type === 'single_choice' && selectedChoices.length > 0) ||
          (currentQuestion.question_type === 'multiple_choice' && selectedChoices.length > 0) ||
          (currentQuestion.question_type === 'true_false' && selectedChoices.length > 0) ||
          (currentQuestion.question_type === 'short_answer' && textAnswer.trim() !== '');
        
        if (hasAnswer) {
          // 如果有答案但未提交，先提交
          handleSubmitAnswer();
          return;
        } else {
          // 如果用户未选择任何答案，给予提示
          message.warning('请先作答再进入下一题');
          return;
        }
      }
    }
    
    // 如果已经提交过答案或没有答案，直接跳到下一题
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // 导航到指定题目
  const handleJumpToQuestion = (index: number) => {
    // 检查当前问题是否已经作答
    if (currentQuiz) {
      const currentQuestion = currentQuiz.questions[currentQuestionIndex];
      
      // 检查是否已经提交过这个问题的答案
      const isAnswered = submittedAnswers.some(a => a.question.id === currentQuestion.id);
      
      // 如果已经修改了答案但未提交，先自动保存
      if (answerChangedRef.current) {
        handleAutoSave();
      } 
      // 如果没有提交过答案，且当前有选择，自动提交当前答案
      else if (!isAnswered) {
        // 检查是否已经选择了答案
        const hasAnswer = 
          (currentQuestion.question_type === 'single_choice' && selectedChoices.length > 0) ||
          (currentQuestion.question_type === 'multiple_choice' && selectedChoices.length > 0) ||
          (currentQuestion.question_type === 'true_false' && selectedChoices.length > 0) ||
          (currentQuestion.question_type === 'short_answer' && textAnswer.trim() !== '');
        
        if (hasAnswer) {
          // 如果有答案但未提交，先提交
          handleSubmitAnswer();
          // 在提交完成后直接跳转到目标题目
          setTimeout(() => setCurrentQuestionIndex(index), 500);
          return;
        }
      }
    }
    
    setCurrentQuestionIndex(index);
  };
  
  // 处理单选/多选/判断题的选项改变
  const handleChoiceChange = (choiceId: number, questionType: string) => {
    if (questionType === 'single_choice' || questionType === 'true_false') {
      setSelectedChoices([choiceId]);
    } else if (questionType === 'multiple_choice') {
      if (selectedChoices.includes(choiceId)) {
        setSelectedChoices(selectedChoices.filter(id => id !== choiceId));
      } else {
        setSelectedChoices([...selectedChoices, choiceId]);
      }
    }
    answerChangedRef.current = true;
  };
  
  // 处理文本答案变化
  const handleTextAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAnswer(e.target.value);
    answerChangedRef.current = true;
  };
  
  // 渲染计时器
  const renderTimer = () => {
    if (timeRemaining === null || !currentQuiz?.time_limit) return null;
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    return (
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Card>
          <Space direction="horizontal" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <ClockCircleOutlined style={{ color: timeRemaining < 300 ? '#ff4d4f' : '#1890ff' }} />
              <Text strong style={{ color: timeRemaining < 300 ? '#ff4d4f' : undefined }}>
                剩余时间: {timeString}
              </Text>
            </Space>
            
            {/* 自动保存状态指示器 */}
            <Space>
              {autoSaveStatus === 'idle' && answerChangedRef.current && (
                <Text type="secondary">
                  <SaveOutlined /> 未保存
                </Text>
              )}
              {autoSaveStatus === 'saving' && (
                <Text type="warning">
                  <LoadingOutlined /> 保存中...
                </Text>
              )}
              {autoSaveStatus === 'saved' && (
                <Text type="success">
                  <CheckCircleOutlined /> 已保存
                </Text>
              )}
              {autoSaveStatus === 'error' && (
                <Text type="danger">
                  <WarningOutlined /> 保存失败
                </Text>
              )}
            </Space>
          </Space>
        </Card>
      </div>
    );
  };
  
  // 渲染测验开始页面
  const renderQuizStart = () => (
    <Card>
      <Title level={2}>{currentQuiz?.title}</Title>
      <Paragraph>{currentQuiz?.description}</Paragraph>
      
      <div style={{ margin: '24px 0' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>测验时间限制:</Text> {currentQuiz?.time_limit} 分钟
          </div>
          <div>
            <Text strong>通过分数:</Text> {currentQuiz?.pass_score} 分
          </div>
          <div>
            <Text strong>问题数量:</Text> {currentQuiz?.questions?.length || 0} 题
          </div>
          {currentQuiz?.allow_multiple_attempts && (
            <div>
              <Text strong>允许尝试次数:</Text> {currentQuiz?.max_attempts} 次
              {currentQuiz?.user_attempts_count !== undefined && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  (已尝试 {currentQuiz.user_attempts_count} 次)
                </Text>
              )}
            </div>
          )}
          {currentQuiz?.user_attempts_count !== undefined && 
           currentQuiz?.max_attempts !== undefined && 
           currentQuiz.user_attempts_count >= currentQuiz.max_attempts && (
            <Alert
              type="warning"
              message="您已达到此测验的最大尝试次数，无法再次参加。"
              style={{ marginTop: 16 }}
            />
          )}
        </Space>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button 
          type="primary" 
          size="large" 
          onClick={handleStartQuiz}
          loading={loading}
          disabled={currentQuiz?.user_attempts_count !== undefined && 
                   currentQuiz?.max_attempts !== undefined && 
                   currentQuiz.user_attempts_count >= currentQuiz.max_attempts}
        >
          开始测验
        </Button>
      </div>
    </Card>
  );
  
  // 渲染问题
  const renderQuestion = (question: Question) => {
    const { question_text, question_type, choices = [], explanation } = question;
    
    return (
      <div>
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>问题 {currentQuestionIndex + 1}/{currentQuiz?.questions?.length}</span>
              <Tag color={
                question_type === 'single_choice' ? 'blue' : 
                question_type === 'multiple_choice' ? 'purple' : 
                question_type === 'true_false' ? 'green' : 
                'orange'
              }>
                {
                  question_type === 'single_choice' ? '单选题' : 
                  question_type === 'multiple_choice' ? '多选题' : 
                  question_type === 'true_false' ? '判断题' : 
                  '简答题'
                }
              </Tag>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <div className="question-content" style={{ fontSize: '16px', marginBottom: 16 }}>
            {question_text}
          </div>
          
          {question_type === 'single_choice' && (
            <Radio.Group 
              value={selectedChoices[0]} 
              onChange={(e) => handleChoiceChange(e.target.value, question_type)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {choices.map(choice => (
                  <Radio key={choice.id} value={choice.id} style={{ width: '100%', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px', marginBottom: '8px' }}>
                    {choice.choice_text}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}
          
          {question_type === 'multiple_choice' && (
            <Checkbox.Group value={selectedChoices} style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {choices.map(choice => (
                  <Checkbox 
                    key={choice.id} 
                    value={choice.id}
                    onChange={() => handleChoiceChange(choice.id, question_type)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px', marginBottom: '8px' }}
                  >
                    {choice.choice_text}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          )}
          
          {question_type === 'true_false' && (
            <Radio.Group 
              value={selectedChoices[0]} 
              onChange={(e) => handleChoiceChange(e.target.value, question_type)}
              buttonStyle="solid"
              style={{ width: '100%' }}
            >
              <Space style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                {choices.map(choice => (
                  <Radio.Button key={choice.id} value={choice.id} style={{ width: '120px', textAlign: 'center' }}>
                    {choice.choice_text}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          )}
          
          {question_type === 'short_answer' && (
            <TextArea 
              rows={4} 
              value={textAnswer} 
              onChange={handleTextAnswerChange}
              placeholder="请在此输入您的答案"
              style={{ width: '100%', borderRadius: '4px' }}
            />
          )}
        </Card>
        
        {/* 答题技巧提示 */}
        <Card title="答题技巧" style={{ marginBottom: 16 }}>
          {question_type === 'single_choice' && (
            <Text>请仔细阅读题目，从提供的选项中选择一个最合适的答案。</Text>
          )}
          {question_type === 'multiple_choice' && (
            <Text>此题为多选题，可以选择多个正确答案，请全部选择才能得分。</Text>
          )}
          {question_type === 'true_false' && (
            <Text>请判断该题目是否正确，选择"正确"或"错误"。</Text>
          )}
          {question_type === 'short_answer' && (
            <Text>请用简洁的语言回答问题，注意关键词的使用。</Text>
          )}
        </Card>
      </div>
    );
  };
  
  // 渲染测验正在进行的页面
  const renderQuizInProgress = () => {
    console.log('renderQuizInProgress调用', { 
      currentQuiz, 
      questions: currentQuiz?.questions,
      questionsLength: currentQuiz?.questions?.length
    });
    
    if (!currentQuiz) {
      console.error('无法渲染测验页面：currentQuiz为空');
      return <div>正在加载测验信息...</div>;
    }
    
    if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
      console.error('无法渲染测验页面：questions为空或长度为0');
      // 如果测验问题为空，显示一个提示信息
      return (
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Title level={3}>此测验没有问题</Title>
            <Paragraph>教师尚未添加任何问题到此测验。请刷新页面或稍后再试。</Paragraph>
            <Space>
              <Button type="primary" onClick={() => navigate(-1)}>
                返回
              </Button>
              <Button 
                onClick={() => dispatch(fetchQuizDetail(Number(quizId)))} 
                icon={<ReloadOutlined />}
                loading={loading}
              >
                刷新测验
              </Button>
            </Space>
          </div>
        </Card>
      );
    }
    
    return (
      <div>
        {/* 时间提示 */}
        {renderTimer()}
        
        {/* 页面切换警告提示 */}
        {showVisibilityWarning && (
          <Alert
            message="离开页面警告"
            description={`您已离开测验页面${visibilityWarnings}次，多次离开可能被视为作弊行为，测验可能会被强制提交。`}
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setShowVisibilityWarning(false)}
          />
        )}
        
        <Card style={{ marginBottom: 16 }}>
          <Steps 
            current={currentQuestionIndex} 
            onChange={handleJumpToQuestion}
            type="navigation"
            style={{ marginBottom: 16 }}
          >
            {currentQuiz.questions.map((q, index) => {
              // 修改判断逻辑，当前题目如果有选择也视为已作答
              const hasCurrentSelection = 
                index === currentQuestionIndex && (
                  (q.question_type === 'single_choice' && selectedChoices.length > 0) ||
                  (q.question_type === 'multiple_choice' && selectedChoices.length > 0) ||
                  (q.question_type === 'true_false' && selectedChoices.length > 0) ||
                  (q.question_type === 'short_answer' && textAnswer.trim() !== '')
                );
              const answered = submittedAnswers.some(a => a.question.id === q.id) || hasCurrentSelection;
              
              return (
                <Step
                  key={index}
                  title={`题 ${index + 1}`}
                  description={answered ? <Tag color="green">已答</Tag> : <Tag>未答</Tag>}
                  status={answered ? 'finish' : 'wait'}
                />
              );
            })}
          </Steps>
          
          {/* 计算进度 */}
          <Progress
            percent={(() => {
              // 计算实际已回答的题目数量，包括已选择但未提交的当前题目
              const currentQuestionAnswered = (
                (currentQuiz.questions[currentQuestionIndex].question_type === 'single_choice' && selectedChoices.length > 0) ||
                (currentQuiz.questions[currentQuestionIndex].question_type === 'multiple_choice' && selectedChoices.length > 0) ||
                (currentQuiz.questions[currentQuestionIndex].question_type === 'true_false' && selectedChoices.length > 0) ||
                (currentQuiz.questions[currentQuestionIndex].question_type === 'short_answer' && textAnswer.trim() !== '')
              );
              
              // 如果当前题目已经在submittedAnswers中，则不重复计算
              const currentSubmitted = submittedAnswers.some(a => a.question.id === currentQuiz.questions[currentQuestionIndex].id);
              
              const totalAnswered = submittedAnswers.length + (currentQuestionAnswered && !currentSubmitted ? 1 : 0);
              return Math.round((totalAnswered / currentQuiz.questions.length) * 100);
            })()}
            status="active"
            style={{ marginBottom: 16 }}
          />
        </Card>
        
        {/* 渲染当前问题 */}
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                问题 {currentQuestionIndex + 1}/{currentQuiz.questions.length} 
                ({currentQuiz.questions[currentQuestionIndex].points} 分)
              </span>
              <Tag color="blue">
                {currentQuiz.questions[currentQuestionIndex].question_type === 'single_choice' && '单选题'}
                {currentQuiz.questions[currentQuestionIndex].question_type === 'multiple_choice' && '多选题'}
                {currentQuiz.questions[currentQuestionIndex].question_type === 'true_false' && '判断题'}
                {currentQuiz.questions[currentQuestionIndex].question_type === 'short_answer' && '简答题'}
              </Tag>
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          {renderQuestion(currentQuiz.questions[currentQuestionIndex])}
          
          {/* 添加操作提示 */}
          <Alert
            message="操作提醒"
            description="请选择答案后，点击「提交当前题目」按钮提交您的答案。提交后才能进入下一题。"
            type="info"
            showIcon
            style={{ marginTop: 16, marginBottom: 16 }}
          />

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space size="middle">
              <Button 
                onClick={handlePrevQuestion} 
                disabled={currentQuestionIndex === 0}
              >
                上一题
              </Button>
              <Button 
                type="primary" 
                onClick={handleSubmitAnswer}
                loading={submitting}
              >
                {currentQuiz && currentQuestionIndex === currentQuiz.questions.length - 1 ? '提交最后一题' : '提交当前题目'}
              </Button>
              <Button 
                onClick={handleNextQuestion} 
                disabled={currentQuestionIndex === currentQuiz.questions.length - 1}
              >
                跳过
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  };
  
  // 渲染测验结果页面
  const renderQuizResult = () => {
    if (!currentQuiz || !currentAttempt) return null;
    
    const isPassed = currentAttempt.passed;
    const totalQuestions = currentQuiz.questions?.length || 0;
    const answeredQuestions = submittedAnswers.length;
    const correctAnswers = submittedAnswers.filter(a => a.is_correct).length;
    const incorrectAnswers = submittedAnswers.filter(a => !a.is_correct).length;
    
    return (
      <Card>
        <Result
          status={isPassed ? 'success' : 'warning'}
          title={isPassed ? '恭喜您通过了测验!' : '很遗憾，未通过测验'}
          subTitle={`得分: ${currentAttempt.score}/${100} (通过分数: ${currentQuiz.pass_score})`}
          extra={[
            <Button 
              type="primary" 
              key="back" 
              onClick={() => navigate(-1)}
            >
              返回课程
            </Button>,
            currentQuiz.allow_multiple_attempts && !isPassed && (
              <Button 
                key="retry" 
                onClick={() => handleStartQuiz()}
              >
                重新尝试
              </Button>
            )
          ]}
        />
        
        <div style={{ marginTop: 32 }}>
          <Card title="测验统计" bordered={false}>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <Progress type="circle" percent={Math.round((correctAnswers / totalQuestions) * 100)} />
                <div style={{ marginTop: 16 }}>正确率</div>
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 'bold', color: '#1890ff' }}>
                  {correctAnswers}/{totalQuestions}
                </div>
                <div>答对题目</div>
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 'bold', color: isPassed ? '#52c41a' : '#ff4d4f' }}>
                  {currentAttempt.score}
                </div>
                <div>得分</div>
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 'bold' }}>
                  {currentAttempt.end_time && currentAttempt.start_time ? 
                    Math.round(
                      (new Date(currentAttempt.end_time).getTime() - 
                      new Date(currentAttempt.start_time).getTime()) / 60000
                    ) : 
                    '?'
                  }
                </div>
                <div>用时(分钟)</div>
              </div>
            </div>
          </Card>
        </div>
        
        {currentQuiz.show_correct_answers && (
          <div style={{ marginTop: 32 }}>
            <Card title="答案详情" style={{ marginBottom: 16 }}>
              <Collapse>
                {currentQuiz.questions.map((question, index) => {
                  const answer = submittedAnswers.find(a => a.question.id === question.id);
                  return (
                    <Panel 
                      key={index} 
                      header={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>问题 {index + 1}: {question.question_text.length > 50 ? 
                            question.question_text.substring(0, 50) + '...' : 
                            question.question_text}
                          </span>
                          <Tag color={answer?.is_correct ? 'success' : 'error'}>
                            {answer?.is_correct ? '正确' : '错误'}
                          </Tag>
                        </div>
                      }
                    >
                      <div>
                        <Text strong>问题：</Text> {question.question_text}
                      </div>
                      <div style={{ margin: '16px 0' }}>
                        <Text strong>您的答案：</Text>
                        {question.question_type === 'short_answer' ? (
                          <div>{answer?.text_answer || '未作答'}</div>
                        ) : (
                          <div>
                            {answer?.selected_choices.map(choice => (
                              <div key={choice.id}>
                                {choice.choice_text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {question.question_type !== 'short_answer' && (
                        <div style={{ margin: '16px 0' }}>
                          <Text strong>正确答案：</Text>
                          <div>
                            {question.choices?.filter(c => c.is_correct).map(choice => (
                              <div key={choice.id}>
                                {choice.choice_text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {question.explanation && (
                        <div style={{ margin: '16px 0' }}>
                          <Text strong>解析：</Text>
                          <div>{question.explanation}</div>
                        </div>
                      )}
                    </Panel>
                  );
                })}
              </Collapse>
            </Card>
          </div>
        )}
      </Card>
    );
  };
  
  // 修改提交确认对话框中已回答的题目计算
  const renderSubmitConfirmModal = () => {
    // 计算实际已回答的题目数量，包括已选择但未提交的当前题目
    const currentQuestionAnswered = currentQuiz && currentQuestionIndex < currentQuiz.questions.length ? (
      (currentQuiz.questions[currentQuestionIndex].question_type === 'single_choice' && selectedChoices.length > 0) ||
      (currentQuiz.questions[currentQuestionIndex].question_type === 'multiple_choice' && selectedChoices.length > 0) ||
      (currentQuiz.questions[currentQuestionIndex].question_type === 'true_false' && selectedChoices.length > 0) ||
      (currentQuiz.questions[currentQuestionIndex].question_type === 'short_answer' && textAnswer.trim() !== '')
    ) : false;
    
    // 如果当前题目已经在submittedAnswers中，则不重复计算
    const currentSubmitted = currentQuiz ? 
      submittedAnswers.some(a => a.question.id === currentQuiz.questions[currentQuestionIndex]?.id) : false;
    
    const totalAnswered = submittedAnswers.length + (currentQuestionAnswered && !currentSubmitted ? 1 : 0);
    
    return (
      <Modal
        title="确认提交测验"
        open={showConfirmSubmit}
        onOk={handleSubmitQuiz}
        onCancel={() => setShowConfirmSubmit(false)}
        okText="确认提交"
        cancelText="继续检查"
        confirmLoading={submitting}
      >
        <p>您确定要提交测验吗？提交后将无法更改答案。</p>
        <p>已回答: {totalAnswered}/{currentQuiz?.questions?.length || 0} 题</p>
      </Modal>
    );
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spin size="large" tip="正在加载测验..." />
      </div>
    );
  }
  
  if (!currentQuiz) {
    return <div>测验不存在或已被删除</div>;
  }
  
  // 根据测验状态渲染不同页面
  console.log('渲染QuizPage组件, currentAttempt:', currentAttempt, 'currentQuiz:', currentQuiz);
  
  // 如果测验没有问题，显示提示信息
  if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
    return (
      <Card>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Title level={3}>此测验没有问题</Title>
          <Paragraph>教师尚未添加任何问题到此测验。请刷新页面或稍后再试。</Paragraph>
          <Space>
            <Button type="primary" onClick={() => navigate(-1)}>
              返回
            </Button>
            <Button 
              onClick={() => dispatch(fetchQuizDetail(Number(quizId)))} 
              icon={<ReloadOutlined />}
              loading={loading}
            >
              刷新测验
            </Button>
          </Space>
        </div>
      </Card>
    );
  }
  
  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {!currentAttempt && currentQuiz && renderQuizStart()}
          {currentAttempt && currentAttempt.status === 'in_progress' && renderQuizInProgress()}
          {currentAttempt && currentAttempt.status === 'completed' && renderQuizResult()}
          {showConfirmSubmit && renderSubmitConfirmModal()}
        </>
      )}
    </div>
  );
};

export default QuizPage; 