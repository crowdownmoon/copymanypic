export interface Screenshot {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export const captureArea = async (
  startX: number,
  startY: number,
  width: number,
  height: number
): Promise<string> => {
  try {
    // 创建一个新的Image对象来加载截图
    const imageUrl = await new Promise<string>((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'captureVisibleTab'
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error('No response from background script'));
          return;
        }
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        if (!response.dataUrl) {
          reject(new Error('No screenshot data received'));
          return;
        }
        resolve(response.dataUrl);
      });
    });

    // 创建临时图片加载截图数据
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load screenshot image'));
      img.src = imageUrl;
    });

    // 创建canvas并截取指定区域
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // 计算设备像素比
    const devicePixelRatio = window.devicePixelRatio || 1;

    // 调整截图区域以适应设备像素比
    ctx.drawImage(
      image,
      startX * devicePixelRatio,
      startY * devicePixelRatio,
      width * devicePixelRatio,
      height * devicePixelRatio,
      0,
      0,
      width,
      height
    );

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw error;
  }
}; 