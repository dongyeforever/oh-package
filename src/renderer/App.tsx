import React, { useState, useEffect } from 'react';
import './App.css';
import AnimatedStatus from './component/AnimatedStatus';
import ImageDoubleClick from './component/ImageDoubleClick';

// 为 window.electronAPI 添加类型定义
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string | undefined>
      checkHdc: () => Promise<string>
      installApp: (filePath: string, isOverwrite: boolean) => Promise<string | undefined>
      adbSnapshot: () => Promise<string | undefined>
      snapshot: () => Promise<string | undefined>
      startScreenRecord: () => Promise<string | undefined>
      stopScreenRecord: () => Promise<string | undefined>
      saveConfig: (config: { optionUnInstall: boolean, optionOsHdc: boolean }) => void
    };
  }

  // 定义状态更新事件
  interface WindowEventMap {
    'configStatusUpdate': CustomEvent<{ optionUnInstall: boolean, optionOsHdc: boolean }>;
    'hdcStatusUpdate': CustomEvent<string>;
    'installStatusUpdate': CustomEvent<string>;
  }
}

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [hdcStatus, setHdcStatus] = useState('');
  const [hdcStatusAnimate, setHdcStatusAnimate] = useState(false);
  const [isCheckingHdc, setIsCheckingHdc] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [config, setConfig] = useState({
    optionUnInstall: false,
    optionOsHdc: false
  })

  useEffect(() => {
    const configStatusUpdate = (event: CustomEvent) => {
      // console.log('configStatusUpdate', event);
      setConfig(event.detail)
    }
    window.addEventListener('configStatusUpdate', configStatusUpdate);
    // 监听 HDC 状态更新事件
    const handleHdcStatusUpdate = (event: CustomEvent) => {
      const message = event.detail.message;
      setHdcStatus(message);
      setHdcStatusAnimate(event.detail.animate)
      if (message && (message.includes('error') || message.includes('install finished'))) {
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
      window.removeEventListener('configStatusUpdate', configStatusUpdate);
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

    if (isCheckingHdc) {
      return;
    }

    try {
      setIsCheckingHdc(true);
      setHdcStatus('正在检查 hdc 环境变量...');

      // 执行 HDC 检查
      await window.electronAPI.checkHdc();

      // HDC 检查成功后可以继续安装流程
      console.log('安装文件:', selectedFile, config.optionUnInstall);
      // 这里可以添加实际的安装逻辑
      await window.electronAPI.installApp(selectedFile, config.optionUnInstall);
    } catch (error) {
      console.error('安装失败:', error);
    }
  };

  const handleSnapshot = async () => {
    try {
      // 调用预加载脚本中暴露的 Electron API
      const filePath = await window.electronAPI.snapshot();
    } catch (error) {
      console.error('Error Snapshot:', error);
    }
  };

  const handleScreenRecord = async () => {
    try {
      // 调用预加载脚本中暴露的 Electron API
      console.log("handleScreenRecord isRecording", isRecording)
      if (isRecording) {
        setIsRecording(!isRecording)
        await window.electronAPI.stopScreenRecord()
      } else {
        setIsRecording(!isRecording)
        await window.electronAPI.startScreenRecord()
      }
    } catch (error) {
      console.error('Error Record:', error);
    }
  };

  const handleAdbSnapshot = async () => {
    try {
      // 调用预加载脚本中暴露的 Electron API
      await window.electronAPI.adbSnapshot();
    } catch (error) {
      console.error('Error Snapshot:', error);
    }
  };

  // 处理勾选变化
  const handleConfigChange = async (config: { optionUnInstall: boolean, optionOsHdc: boolean }) => {
    setConfig(config)
    await window.electronAPI.saveConfig(config);
  }

  return (
    <div className="container">

      <div className="title-container">
        <div className="title-wrapper">
          <div className="title">
            <div className="title-line" />
            <h2>关于</h2>
          </div>
          <p className="description">
            HarmonyOS Package Tool 是鸿蒙系统包安装工具，支持一键自动安装到模拟器与真机。
          </p>

          <button onClick={handleSnapshot} className='text-link'>截屏</button>

          <button onClick={handleScreenRecord} className='text-link' style={{ display: 'none' }}>{isRecording ? "停止录屏" : "录屏"}</button>
        </div>
        <div className="image-container">
          <ImageDoubleClick onDoubleClick={handleAdbSnapshot} />
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
            style={{ cursor: 'pointer', marginRight: '16px' }}
          />
          <button
            className="select-button"
            onClick={handleInstall}>{isCheckingHdc ? '安装中' : '安 装'}</button>
        </div>
      </div>

      {/* 覆盖安装选项 */}
      <div className="path-selection">
        <div className="input-container">
          <label className="path-label"> <input
            type="checkbox"
            checked={config.optionUnInstall}
            onChange={(e) => {
              handleConfigChange({
                ...config,
                optionUnInstall: e.target.checked
              })
            }}
          />安装前卸载app </label>
        </div>
      </div>

      {/* hdc 环境变量选项 */}
      <div className="path-selection">
        <div className="input-container">
          <label className="path-label"> <input
            type="checkbox"
            checked={config.optionOsHdc}
            onChange={(e) => {
              handleConfigChange({
                ...config,
                optionOsHdc: e.target.checked
              })
            }}
          />使用系统hdc</label>
        </div>
      </div>

      {/* HDC 状态显示区域 */}
      <AnimatedStatus hdcStatus={hdcStatus} animate={hdcStatusAnimate} />

    </div>
  );
}

export default App;