import { getScreenshots, copyImagesToClipboard, clearScreenshots } from '../../utils/storage';
import { Screenshot } from '../../types';

export const initManagePanel = async (): Promise<HTMLElement> => {
  const panel = document.createElement('div');
  panel.className = 'manage-panel';

  // 添加标题
  const title = document.createElement('h2');
  title.textContent = '截图管理';
  title.style.margin = '0 0 16px 0';
  panel.appendChild(title);

  // 添加操作栏
  const actionBar = document.createElement('div');
  actionBar.style.marginBottom = '16px';
  actionBar.style.display = 'flex';
  actionBar.style.justifyContent = 'space-between';
  actionBar.style.alignItems = 'center';

  const selectedCount = document.createElement('span');
  selectedCount.textContent = '已选择: 0';

  // 添加按钮容器
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.gap = '8px';  // 按钮之间的间距

  // 清空按钮
  const clearButton = document.createElement('button');
  clearButton.className = 'screenshot-button';
  clearButton.textContent = '清空';
  clearButton.style.backgroundColor = '#ff4d4f';  // 红色背景
  clearButton.style.minWidth = '60px';  // 保持按钮小巧
  clearButton.style.padding = '4px 8px';  // 调整内边距
  clearButton.style.fontSize = '12px';  // 小字体

  const copyButton = document.createElement('button');
  copyButton.className = 'screenshot-button';
  copyButton.textContent = '复制选中图片';
  copyButton.disabled = true;

  // 添加清空功能
  clearButton.onclick = async () => {
    if (confirm('确定要清空所有缓存的截图吗？')) {
      try {
        await clearScreenshots();  // 调用清空函数
        listContainer.innerHTML = '';  // 清空列表
        selectedScreenshots.clear();  // 清空选中集合
        selectedCount.textContent = '已选择: 0';
        copyButton.disabled = true;
        alert('清空成功！');
      } catch (error) {
        console.error('Clear failed:', error);
        alert('清空失败，请重试');
      }
    }
  };

  buttonsContainer.appendChild(clearButton);
  buttonsContainer.appendChild(copyButton);
  actionBar.appendChild(selectedCount);
  actionBar.appendChild(buttonsContainer);
  panel.appendChild(actionBar);

  // 创建图片列表容器
  const listContainer = document.createElement('div');
  listContainer.className = 'screenshot-list';
  listContainer.style.maxHeight = '400px';
  listContainer.style.overflowY = 'auto';

  // 获取并显示截图
  const screenshots = await getScreenshots();
  const selectedScreenshots = new Set<Screenshot>();

  screenshots.forEach((screenshot) => {
    const item = document.createElement('div');
    item.className = 'screenshot-item';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.padding = '8px';
    item.style.borderBottom = '1px solid #eee';

    // 添加复选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.marginRight = '8px';
    
    // 添加时间信息
    const time = document.createElement('div');
    time.style.fontSize = '12px';
    time.style.color = '#666';
    time.style.width = '150px';
    time.textContent = new Date(screenshot.timestamp).toLocaleString();

    // 添加缩略图
    const thumbnail = document.createElement('img');
    thumbnail.src = screenshot.dataUrl;
    thumbnail.style.maxWidth = '100px';
    thumbnail.style.maxHeight = '60px';
    thumbnail.style.marginLeft = '8px';
    thumbnail.style.objectFit = 'contain';

    // 处理选择逻辑
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        if (selectedScreenshots.size >= 20) {
          checkbox.checked = false;
          alert('最多只能选择20张图片');
          return;
        }
        selectedScreenshots.add(screenshot);
      } else {
        selectedScreenshots.delete(screenshot);
      }

      // 更新UI状态
      selectedCount.textContent = `已选择: ${selectedScreenshots.size}`;
      copyButton.disabled = selectedScreenshots.size === 0;
    });

    item.appendChild(checkbox);
    item.appendChild(time);
    item.appendChild(thumbnail);
    listContainer.appendChild(item);
  });

  panel.appendChild(listContainer);

  // 处理复制功能
  copyButton.addEventListener('click', async () => {
    try {
      await copyImagesToClipboard(Array.from(selectedScreenshots));
      alert('复制成功！');
    } catch (error) {
      console.error('Copy failed:', error);
      alert(error instanceof Error ? error.message : '复制失败，请重试');
    }
  });

  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.right = '8px';
  closeButton.style.top = '8px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => panel.remove();

  panel.appendChild(closeButton);
  document.body.appendChild(panel);

  return panel;
}; 