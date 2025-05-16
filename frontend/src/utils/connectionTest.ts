import api from '../services/api';

/**
 * 测试前后端连接状态
 * @returns 包含连接状态和详细信息的对象
 */
export const testConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    // 尝试请求一个不需要认证的接口，例如获取课程分类列表
    const response = await api.get('/courses/categories/');
    
    return {
      success: true,
      message: '前后端连接成功！服务器返回数据正常。',
      details: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }
    };
  } catch (error: any) {
    // 处理各种错误情况
    if (error.response) {
      // 服务器响应了，但状态码不是2xx
      return {
        success: false,
        message: `前后端连接成功，但API返回了错误: ${error.response.status} ${error.response.statusText}`,
        details: {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        }
      };
    } else if (error.request) {
      // 请求已发送但没有收到响应
      return {
        success: false,
        message: '前后端连接失败: 未收到服务器响应。请检查后端服务是否正在运行，以及CORS设置是否正确。',
        details: {
          request: error.request
        }
      };
    } else {
      // 请求设置时出现错误
      return {
        success: false,
        message: `前后端连接失败: ${error.message}`,
        details: error
      };
    }
  }
};

/**
 * 测试用户认证状态
 * @returns 包含认证状态和详细信息的对象
 */
export const testAuthentication = async (): Promise<{ authenticated: boolean; message: string; details?: any }> => {
  try {
    // 尝试请求一个需要认证的接口，例如获取当前用户信息
    const response = await api.get('/accounts/users/me/');
    
    return {
      authenticated: true,
      message: '用户已认证，可以访问受保护的API。',
      details: {
        user: response.data
      }
    };
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      return {
        authenticated: false,
        message: '用户未认证或认证已过期。请登录后再试。',
        details: {
          status: error.response.status,
          statusText: error.response.statusText
        }
      };
    } else {
      return {
        authenticated: false,
        message: `无法验证认证状态: ${error.message}`,
        details: error.response || error
      };
    }
  }
}; 