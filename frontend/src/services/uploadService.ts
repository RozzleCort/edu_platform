import api from './api';

// 上传图片
export const uploadImage = async (file: File, onProgress?: (percent: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/api/upload/image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('图片上传失败:', error);
    throw error;
  }
};

// 上传视频
export const uploadVideo = async (file: File, onProgress?: (percent: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/api/upload/video/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('视频上传失败:', error);
    throw error;
  }
};

export default {
  uploadImage,
  uploadVideo
}; 