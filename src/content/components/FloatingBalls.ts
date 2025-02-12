import { initScreenshotTool } from './ScreenshotTool';
import { initManagePanel } from './ManagePanel';

let managePanel: HTMLElement | null = null;

export const toggleManagePanel = async (): Promise<void> => {
  if (managePanel) {
    managePanel.remove();
    managePanel = null;
    return;
  }
  
  managePanel = await initManagePanel();
};

export const createFloatingBalls = (): void => {
  const screenshotBall = document.createElement('div');
  screenshotBall.className = 'floating-ball screenshot-ball';
  screenshotBall.textContent = '截图';
  
  const manageBall = document.createElement('div');
  manageBall.className = 'floating-ball manage-ball';
  manageBall.textContent = '管理';
  
  document.body.appendChild(screenshotBall);
  document.body.appendChild(manageBall);
  
  screenshotBall.addEventListener('click', () => {
    initScreenshotTool();
  });
  
  manageBall.addEventListener('click', () => {
    toggleManagePanel();
  });
}; 