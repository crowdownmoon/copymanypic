document.getElementById('screenshot')?.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'startScreenshot' });
    }
  });
  window.close();
});

document.getElementById('manage')?.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'toggleManage' });
    }
  });
  window.close();
}); 