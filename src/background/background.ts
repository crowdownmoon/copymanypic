// 添加重试机制的工具函数
const retry = async <T>(
  fn: () => Promise<T>, 
  retries: number = 3, 
  delay: number = 500
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

// 处理截图请求
const handleScreenshot = async (
  windowId: number,
  options: chrome.tabs.CaptureVisibleTabOptions
): Promise<string> => {
  try {
    return await chrome.tabs.captureVisibleTab(windowId, options);
  } catch (error) {
    if (error instanceof Error && error.message.includes('context invalidated')) {
      // 如果是 context invalidated 错误，重新请求权限
      await chrome.tabs.query({ active: true, currentWindow: true });
      return await chrome.tabs.captureVisibleTab(windowId, options);
    }
    throw error;
  }
};

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'captureVisibleTab') {
    // 确保在活动标签页上执行截图
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        if (!tabs[0]?.id) {
          throw new Error('No active tab found');
        }

        // 使用重试机制执行截图
        const dataUrl = await retry(() => 
          handleScreenshot(
            tabs[0].windowId,
            { format: 'png', quality: 100 }
          )
        );

        sendResponse({ dataUrl });
      } catch (error: unknown) {
        console.error('Screenshot failed:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown error occurred';
        sendResponse({ error: errorMessage });
      }
    });

    return true;
  }

  // 添加下载处理
  if (message.type === 'downloadScreenshot') {
    const { dataUrl, filename, saveAs } = message;
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: saveAs
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        // 开始监控下载状态
        const checkDownload = () => {
          chrome.downloads.search({ id: downloadId }, (downloads) => {
            if (downloads && downloads.length > 0) {
              const download = downloads[0];
              if (download.state === 'complete') {
                sendResponse({ 
                  status: 'complete',
                  filename: download.filename
                });
              } else if (download.state === 'interrupted') {
                sendResponse({ 
                  error: 'Download interrupted'
                });
              } else {
                // 继续检查
                setTimeout(checkDownload, 100);
              }
            } else {
              sendResponse({ 
                error: 'Download not found'
              });
            }
          });
        };

        checkDownload();
      }
    });
    return true;
  }
});

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(() => {
  // 重置扩展状态
  chrome.storage.local.get(['screenshots', 'defaultSaveFolder'], (result) => {
    const data = {
      screenshots: result.screenshots || [],
      defaultSaveFolder: result.defaultSaveFolder || ''
    };
    chrome.storage.local.set(data);
  });
});

// 监听扩展错误
chrome.runtime.onSuspend.addListener(() => {
  // 清理资源
  console.log('Extension is being unloaded');
}); 