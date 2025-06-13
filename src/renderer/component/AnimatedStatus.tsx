import React, { useState, useEffect } from 'react';
import './AnimatedStatus.css'

interface AnimatedStatusProps {
  hdcStatus: string | null | undefined;
  animate?: boolean; // 是否需要动画效果，默认为 false
}

const AnimatedStatus: React.FC<AnimatedStatusProps> = ({ hdcStatus,  animate = false }) => {
  // 存储当前显示的文本
  const [displayedText, setDisplayedText] = useState('');
  // 存储上一次的文本，用于比较变化
  const [prevText, setPrevText] = useState('');
  
  // 当hdcStatus变化时，重置显示文本并开始动画
  useEffect(() => {
    // 如果文本没有变化或为空，不执行动画
    if (!hdcStatus /**|| hdcStatus === prevText*/) return;
    
    setPrevText(hdcStatus);
    // 根据animate参数决定是直接显示还是动画显示
    if (!animate) {
      // 不使用动画，直接显示完整文本
      setDisplayedText(hdcStatus);
      return;
    }

    setDisplayedText('');
    
    // 逐字显示动画
    let index = 0;
    const intervalId = setInterval(() => {
      if (index <= hdcStatus.length) {
        setDisplayedText(hdcStatus.substring(0, index));
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, 25); // 每20毫秒显示一个字符，可以根据需要调整速度
    
    // 清理定时器
    return () => clearInterval(intervalId);
  }, [hdcStatus, prevText]);

  return (
    <div className="hdc-status">
      {hdcStatus && (
        <div className={`status-message ${hdcStatus.includes('error') ? 'error' : 'success'}`}>
          <span>{displayedText}</span>
        </div>
      )}
    </div>
  );
};

export default AnimatedStatus;
