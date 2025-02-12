import { Screenshot, StorageData } from '../types';

// 获取默认保存文件夹
export const getDefaultFolder = async (): Promise<string | undefined> => {
  const result = await chrome.storage.local.get('defaultSaveFolder');
  return result.defaultSaveFolder;
};

// 设置默认保存文件夹
export const setDefaultFolder = async (path: string): Promise<void> => {
  await chrome.storage.local.set({ defaultSaveFolder: path });
};

// 保存到下载
export const saveToDownloads = async (dataUrl: string): Promise<void> => {
  try {
    let defaultFolder = await getDefaultFolder();
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = defaultFolder 
      ? `${defaultFolder}/screenshot-${timestamp}.png`
      : `screenshot-${timestamp}.png`;

    // 通过 background 脚本执行下载
    const response = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({
        type: 'downloadScreenshot',
        dataUrl,
        filename,
        saveAs: !defaultFolder
      }, resolve);
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // 如果下载完成且没有默认文件夹，保存新的文件夹路径
    if (response.status === 'complete' && !defaultFolder && response.filename) {
      const folderPath = response.filename.split('/').slice(0, -1).join('/');
      if (folderPath) {
        await setDefaultFolder(folderPath);
      }
    }
  } catch (error) {
    console.error('Save failed:', error);
    throw new Error(error instanceof Error ? error.message : '保存失败，请重试');
  }
};

// 保存到缓存
export const saveScreenshot = async (dataUrl: string): Promise<void> => {
  const screenshots = await getScreenshots();
  const newScreenshot: Screenshot = {
    id: Date.now().toString(),
    dataUrl,
    timestamp: Date.now()
  };
  
  screenshots.push(newScreenshot);
  await chrome.storage.local.set({ screenshots });
};

// 获取所有缓存的截图
export const getScreenshots = async (): Promise<Screenshot[]> => {
  const result = await chrome.storage.local.get('screenshots');
  return result.screenshots || [];
};

// 复制图片到剪贴板
export const copyImagesToClipboard = async (screenshots: Screenshot[]): Promise<void> => {
  if (screenshots.length > 20) {
    throw new Error('最多只能选择20张图片');
  }

  try {
    // 创建一个临时的 div 来存放图片
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // 加载所有图片
    await Promise.all(
      screenshots.map(async (screenshot, index) => {
        const img = document.createElement('img');
        img.src = screenshot.dataUrl;
        
        // 等待图片加载完成
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        container.appendChild(img);
      })
    );

    // 选中内容
    const range = document.createRange();
    range.selectNode(container);
    
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // 执行复制命令
    const success = document.execCommand('copy');
    
    // 清理
    if (selection) {
      selection.removeAllRanges();
    }
    container.remove();

    if (!success) {
      throw new Error('复制失败');
    }
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    throw new Error('复制到剪贴板失败，请重试');
  }
};

export const clearScreenshots = async (): Promise<void> => {
  await chrome.storage.local.set({ screenshots: [] });
}; 