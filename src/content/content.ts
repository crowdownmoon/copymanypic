import { createFloatingBalls } from './components/FloatingBalls';
import { initScreenshotTool } from './components/ScreenshotTool';
import { toggleManagePanel } from './components/FloatingBalls';

export let isScreenshotMode = false;

const init = (): void => {
  createFloatingBalls();
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isScreenshotMode) {
      exitScreenshotMode();
    }
  });

  // 处理来自 popup 的消息
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'startScreenshot') {
      isScreenshotMode = true;
      initScreenshotTool();
    } else if (message.type === 'toggleManage') {
      toggleManagePanel();
    }
  });
};

export const exitScreenshotMode = (): void => {
  isScreenshotMode = false;
  const screenshotArea = document.querySelector('.screenshot-area');
  const buttons = document.querySelector('.screenshot-buttons');
  const selection = document.querySelector('.screenshot-selection');
  
  if (screenshotArea) screenshotArea.remove();
  if (buttons) buttons.remove();
  if (selection) selection.remove();
};

init(); 