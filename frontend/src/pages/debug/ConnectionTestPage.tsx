import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Typography, Spin, Space, Divider, Collapse } from 'antd';
import { testConnection, testAuthentication } from '../../utils/connectionTest';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

// 格式化JSON以便更好地显示
const formatJSON = (json: any) => {
  return JSON.stringify(json, null, 2);
};

const ConnectionTestPage: React.FC = () => {
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [authTest, setAuthTest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // 页面加载时自动运行连接测试
  useEffect(() => {
    runConnectionTest();
  }, []);

  // 运行连接测试
  const runConnectionTest = async () => {
    setLoading(true);
    try {
      const result = await testConnection();
      setConnectionTest(result);
    } catch (error) {
      setConnectionTest({
        success: false,
        message: '运行测试时发生错误',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  // 运行认证测试
  const runAuthTest = async () => {
    setAuthLoading(true);
    try {
      const result = await testAuthentication();
      setAuthTest(result);
    } catch (error) {
      setAuthTest({
        authenticated: false,
        message: '运行认证测试时发生错误',
        details: error
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Title level={2}>前后端连接测试</Title>
      <Paragraph>
        此页面用于测试前端React应用是否能够成功连接到后端Django API。
      </Paragraph>

      <Divider />

      <Card title="基础连接测试" style={{ marginBottom: 24 }}>
        <Paragraph>
          测试前端是否能够连接到后端API，不需要用户认证。
        </Paragraph>

        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            onClick={runConnectionTest} 
            loading={loading}
          >
            测试连接
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin tip="正在测试连接..." />
          </div>
        ) : connectionTest ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message={connectionTest.success ? "连接成功" : "连接失败"}
              description={connectionTest.message}
              type={connectionTest.success ? "success" : "error"}
              showIcon
            />
            {connectionTest.details && (
              <Collapse>
                <Panel header="查看详细信息" key="1">
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    overflowX: 'auto' 
                  }}>
                    {formatJSON(connectionTest.details)}
                  </pre>
                </Panel>
              </Collapse>
            )}
          </Space>
        ) : null}
      </Card>

      <Card title="用户认证测试">
        <Paragraph>
          测试用户认证状态，检查是否能够访问需要认证的API。
        </Paragraph>

        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            onClick={runAuthTest} 
            loading={authLoading}
          >
            测试认证
          </Button>
        </div>

        {authLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin tip="正在测试认证..." />
          </div>
        ) : authTest ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message={authTest.authenticated ? "已认证" : "未认证"}
              description={authTest.message}
              type={authTest.authenticated ? "success" : "warning"}
              showIcon
            />
            {authTest.details && (
              <Collapse>
                <Panel header="查看详细信息" key="1">
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 4,
                    overflowX: 'auto' 
                  }}>
                    {formatJSON(authTest.details)}
                  </pre>
                </Panel>
              </Collapse>
            )}
          </Space>
        ) : null}
      </Card>

      <Divider />

      <Title level={3}>解决连接问题</Title>
      <Paragraph>
        <Text strong>如果连接测试失败，请检查以下几点：</Text>
      </Paragraph>
      <ul>
        <li>确保后端Django服务器正在运行（python manage.py runserver）</li>
        <li>确认API基础URL配置正确（检查 src/services/api.ts 中的 API_BASE_URL）</li>
        <li>检查后端CORS设置是否允许前端域名访问（在settings.py中配置CORS_ALLOWED_ORIGINS）</li>
        <li>查看浏览器控制台是否有网络错误或CORS错误</li>
        <li>如果使用代理服务器，确保代理配置正确</li>
      </ul>

      <Paragraph>
        <Text strong>如果认证测试失败，但基础连接成功，请检查：</Text>
      </Paragraph>
      <ul>
        <li>是否已经登录（localStorage中是否有有效的token）</li>
        <li>认证Token是否过期</li>
        <li>认证Token格式是否正确</li>
        <li>JWT密钥配置是否一致</li>
      </ul>
    </div>
  );
};

export default ConnectionTestPage; 