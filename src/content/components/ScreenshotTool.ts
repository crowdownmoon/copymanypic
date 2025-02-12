import { saveScreenshot, saveToDownloads } from '../../utils/storage';
import { captureArea } from '../../utils/screenshot';
import { exitScreenshotMode } from '../content';

export const initScreenshotTool = (): void => {
  const screenshotArea = document.createElement('div');
  screenshotArea.className = 'screenshot-area';
  
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let selection: HTMLDivElement | null = null;
  let previewArea: HTMLDivElement | null = null;
  
  const cleanup = () => {
    if (selection) {
      selection.remove();
      selection = null;
    }
    if (previewArea) {
      previewArea.remove();
      previewArea = null;
    }
    isDrawing = false;
  };

  const handleMouseDown = (e: MouseEvent) => {
    // 只处理左键点击
    if (e.button !== 0) return;
    
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    
    selection = document.createElement('div');
    selection.className = 'screenshot-selection';
    selection.style.position = 'fixed';
    selection.style.border = '2px solid #1a73e8';
    selection.style.background = 'rgba(26, 115, 232, 0.1)';
    selection.style.zIndex = '999999';
    selection.style.pointerEvents = 'none'; // 防止选择框影响事件
    
    document.body.appendChild(selection);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !selection) return;
    
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    
    selection.style.left = `${width > 0 ? startX : e.clientX}px`;
    selection.style.top = `${height > 0 ? startY : e.clientY}px`;
    selection.style.width = `${Math.abs(width)}px`;
    selection.style.height = `${Math.abs(height)}px`;
  };

  const handleMouseUp = async (e: MouseEvent) => {
    if (!isDrawing || !selection) return;
    
    const width = Math.abs(e.clientX - startX);
    const height = Math.abs(e.clientY - startY);
    
    if (width < 5 || height < 5) {
      cleanup();
      exitScreenshotMode();
      return;
    }

    try {
      // 保存选择区域的位置信息
      const captureRegion = {
        x: Math.min(startX, e.clientX),
        y: Math.min(startY, e.clientY),
        width,
        height
      };

      // 隐藏截图区域的半透明背景，但保留选择框
      screenshotArea.style.background = 'none';
      
      // 创建预览区域
      previewArea = document.createElement('div');
      previewArea.className = 'screenshot-preview';
      previewArea.style.position = 'fixed';
      previewArea.style.left = `${captureRegion.x}px`;
      previewArea.style.top = `${captureRegion.y}px`;
      previewArea.style.width = `${width}px`;
      previewArea.style.height = `${height}px`;
      previewArea.style.border = '2px solid #1a73e8';
      previewArea.style.backgroundColor = 'rgba(26, 115, 232, 0.1)';
      previewArea.style.zIndex = '999999';
      document.body.appendChild(previewArea);

      // 隐藏原始选择框
      if (selection) {
        selection.style.display = 'none';
      }

      const dataUrl = await captureArea(
        captureRegion.x,
        captureRegion.y,
        width,
        height
      );

      // 显示按钮
      showScreenshotButtons(dataUrl, e.clientX, e.clientY, () => {
        cleanup();
        exitScreenshotMode();
      });

    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('截图失败，请重试');
      cleanup();
      exitScreenshotMode();
    }
  };

  // 点击空白区域退出
  const handleClick = (e: MouseEvent) => {
    if (e.target === screenshotArea && !isDrawing) {
      exitScreenshotMode();
    }
  };

  screenshotArea.addEventListener('mousedown', handleMouseDown);
  screenshotArea.addEventListener('mousemove', handleMouseMove);
  screenshotArea.addEventListener('mouseup', handleMouseUp);
  screenshotArea.addEventListener('click', handleClick);
  
  // 添加ESC键退出支持
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      cleanup();
      exitScreenshotMode();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  document.body.appendChild(screenshotArea);
};

const showScreenshotButtons = (
  dataUrl: string, 
  x: number, 
  y: number,
  onComplete: () => void
): void => {
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'screenshot-buttons';
  
  // 确保按钮在视口内
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const buttonWidth = 200;
  const buttonHeight = 40;
  
  let left = Math.min(x, viewportWidth - buttonWidth);
  let top = Math.min(y + 10, viewportHeight - buttonHeight);
  
  buttonsContainer.style.left = `${left}px`;
  buttonsContainer.style.top = `${top}px`;

  const saveButton = document.createElement('button');
  saveButton.className = 'screenshot-button';
  saveButton.textContent = '保存';
  saveButton.onclick = async () => {
    try {
      saveButton.disabled = true;
      saveButton.textContent = '保存中...';
      await saveToDownloads(dataUrl);
      onComplete();
    } catch (error) {
      console.error('Save failed:', error);
      alert(error instanceof Error ? error.message : '保存失败，请重试');
      saveButton.disabled = false;
      saveButton.textContent = '保存';
    }
  };

  const cacheButton = document.createElement('button');
  cacheButton.className = 'screenshot-button';
  cacheButton.textContent = '缓存';
  cacheButton.onclick = async () => {
    try {
      cacheButton.disabled = true;
      cacheButton.textContent = '缓存中...';
      await saveScreenshot(dataUrl);
      onComplete();
    } catch (error) {
      console.error('Cache failed:', error);
      alert(error instanceof Error ? error.message : '缓存失败，请重试');
      cacheButton.disabled = false;
      cacheButton.textContent = '缓存';
    }
  };

  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(cacheButton);
  document.body.appendChild(buttonsContainer);
}; 