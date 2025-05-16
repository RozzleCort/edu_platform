import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Spin, Empty, List, Tag, Space, Button, Input } from 'antd';
import { 
  FormOutlined, BookOutlined, SearchOutlined, ReloadOutlined 
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchQuizzes } from '../../redux/slices/quizSlice';
import { Link } from 'react-router-dom';
import { Quiz } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const QuizListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchText, setSearchText] = useState('');
  const { quizzes, loading } = useAppSelector((state) => state.quiz);
  
  // 获取测验列表
  useEffect(() => {
    dispatch(fetchQuizzes({}));
  }, [dispatch]);
  
  // 筛选测验
  const filteredQuizzes = quizzes?.filter((quiz: Quiz) => 
    quiz.title.toLowerCase().includes(searchText.toLowerCase()) ||
    (quiz.description && quiz.description.toLowerCase().includes(searchText.toLowerCase()))
  );
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
  };
  
  // 刷新测验列表
  const refreshQuizzes = () => {
    dispatch(fetchQuizzes({}));
  };
  
  // 如果正在加载，则显示加载指示器
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <p>加载测验列表...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>在线测验</Title>
        <Space>
          <Search
            placeholder="搜索测验"
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refreshQuizzes}
          >
            刷新
          </Button>
        </Space>
      </div>
      
      <Paragraph>
        参与在线测验，检验学习成果，提高学习效率。您可以选择任意测验进行尝试！
      </Paragraph>
      
      {(!filteredQuizzes || filteredQuizzes.length === 0) ? (
        <Empty description="暂无可用测验" />
      ) : (
        <List
          grid={{ 
            gutter: 16, 
            xs: 1, 
            sm: 2, 
            md: 3, 
            lg: 3, 
            xl: 4, 
            xxl: 4 
          }}
          dataSource={filteredQuizzes}
          renderItem={(quiz: Quiz) => (
            <List.Item>
              <Link to={`/quiz-preview/${quiz.id}`}>
                <Card 
                  hoverable 
                  cover={
                    <div style={{ 
                      height: 140, 
                      background: '#1890ff1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FormOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    </div>
                  }
                >
                  <Card.Meta
                    title={quiz.title}
                    description={
                      <Space direction="vertical">
                        <Text ellipsis>
                          {quiz.description || '没有描述'}
                        </Text>
                        <Space>
                          <Tag color="blue">问题: {quiz.questions?.length || 0}</Tag>
                          <Tag color="orange">{quiz.time_limit} 分钟</Tag>
                          {quiz.lesson && (
                            <Tag color="green">
                              <BookOutlined /> {quiz.lesson.title}
                            </Tag>
                          )}
                        </Space>
                      </Space>
                    }
                  />
                </Card>
              </Link>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default QuizListPage; 