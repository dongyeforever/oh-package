const { contextBridge, ipcRenderer } = require('electron');

// 暴露文件选择 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  checkHdc: () => ipcRenderer.invoke('check-hdc'),
  installApp: (filePath, isOverwrite) => ipcRenderer.invoke('install-app', filePath, isOverwrite),
  snapshot: () => ipcRenderer.invoke('hdc-snapshot'),
  startScreenRecord: () => ipcRenderer.invoke('hdc-start-record'),
  stopScreenRecord: () => ipcRenderer.invoke('hdc-stop-record')
});

// load config 状态改变
ipcRenderer.on('load-config', (event, config) => {
  window.dispatchEvent(new CustomEvent('configStatusUpdate', { detail: config }));
});

// 监听 HDC 状态更新
ipcRenderer.on('hdc-status', (event, message) => {
  window.dispatchEvent(new CustomEvent('hdcStatusUpdate', { detail: message }));
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})