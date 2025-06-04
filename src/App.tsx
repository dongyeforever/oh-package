import React, { useState, useEffect } from 'react';
import './App.css';
const navbarIcon = require('./image/navbar.png');

// 为 window.electronAPI 添加类型定义
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string | undefined>
      checkHdc: () => Promise<string>
      installApp: (filePath: string, isOverwrite: boolean) => Promise<string | undefined>;
    };
  }

  // 定义状态更新事件
  interface WindowEventMap {
    'hdcStatusUpdate': CustomEvent<string>;
    'installStatusUpdate': CustomEvent<string>;
  }
}

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState('');
  const [isOverwrite, setIsOverwrite] = useState(false);
  const [hdcStatus, setHdcStatus] = useState('');
  const [isCheckingHdc, setIsCheckingHdc] = useState(false);
  const [installStatus, setInstallStatus] = useState('');

  useEffect(() => {
    // 监听 HDC 状态更新事件
    const handleHdcStatusUpdate = (event: CustomEvent) => {
      setHdcStatus(event.detail);
      if (event.detail.includes('error') || event.detail.includes('install finished')) {
        setIsCheckingHdc(false);
      }
    };
    window.addEventListener('hdcStatusUpdate', handleHdcStatusUpdate);

    // 监听安装状态更新事件
    const handleInstallStatusUpdate = (event: CustomEvent) => {
      setInstallStatus(event.detail);
    };
    window.addEventListener('installStatusUpdate', handleInstallStatusUpdate);

    return () => {
      window.removeEventListener('hdcStatusUpdate', handleHdcStatusUpdate);
      window.removeEventListener('installStatusUpdate', handleInstallStatusUpdate);
    };
  }, []);
  const selectFile = async () => {
    try {
      // 调用预加载脚本中暴露的 Electron API
      const filePath = await window.electronAPI.openFile();
      if (filePath) {
        setSelectedFile(filePath);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleInstall = async () => {
    if (!selectedFile) {
      alert('请先选择文件');
      return;
    }

    if  (isCheckingHdc) {
      alert('安装中！');
      return;
    }

    try {
      setIsCheckingHdc(true);
      setHdcStatus('正在检查 hdc 环境变量...');

      // 执行 HDC 检查
      await window.electronAPI.checkHdc();

      // HDC 检查成功后可以继续安装流程
      console.log('安装文件:', selectedFile, isOverwrite);
      // 这里可以添加实际的安装逻辑
      await window.electronAPI.installApp(selectedFile, isOverwrite);
    } catch (error) {
      console.error('安装失败:', error);
    }
  };

  return (
    <div className="container">

      <div className="title-container">
        <div className="title-wrapper">
          <div className="title">
            <div className="title-line" />
            <h2>关于 Package Tool</h2>
          </div>
          <p className="description">
            OpenHarmony Package Tool 是鸿蒙系统专用包安装工具，支持一键自动安装，可部署到模拟器与真机，操作简便。
          </p>
        </div>
        <div className="image-container">
          <img src={navbarIcon} alt="HarmonyOS Package Tool" />
        </div>
      </div>

      <div className="title" style={{ marginTop: '30px' }}>
        <div className="title-line" style={{ height: '32px' }} /><h2>设置</h2>
      </div>

      <div className="path-selection">
        <label htmlFor="packagePath" className="path-label">安装包路径</label>
        <div className="input-container">
          <input
            type="text"
            id="packagePath"
            value={selectedFile}
            placeholder="请选择安装包路径"
            readOnly
            className="path-input"
            onClick={selectFile}
            style={{ cursor: 'pointer' }}
          />
          <button
            className="select-button"
            onClick={handleInstall}>安 装</button>
        </div>
      </div>

      {/* 新增覆盖安装选项 */}
      <div className="path-selection">
        <div className="input-container">
          <label className="path-label"> <input
            type="checkbox"
            checked={isOverwrite}
            onChange={(e) => setIsOverwrite(e.target.checked)}
          />安装前卸载app </label>
        </div>
      </div>

      {/* HDC 状态显示区域 */}
      <div className="hdc-status">
        {hdcStatus && (
          <div className={`status-message ${hdcStatus.includes('error') ? 'error' : 'success'}`}>
            <span>{hdcStatus}</span>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;