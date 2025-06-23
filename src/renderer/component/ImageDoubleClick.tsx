import React, { useState, useEffect } from 'react';
const navbarIcon = require('../../image/navbar.png');

interface ImageDoubleClickProps {
    src?: string | undefined;
    onDoubleClick?: () => void;
}

const ImageDoubleClick: React.FC<ImageDoubleClickProps> = ({ src, onDoubleClick}) => {
    const [clickCount, setClickCount] = useState(0);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLImageElement>) => {
        setClickCount(prevCount => prevCount + 1);
        
        // 清除之前的计时器
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // 设置新计时器
        const timer = setTimeout(() => {
            setClickCount(0);
            // 单击处理逻辑可以在这里添加
        }, 300);
        
        setTimeoutId(timer);
    };

    // 监听点击次数变化
    useEffect(() => {
        if (clickCount === 2) {
            // 清除计时器避免后续误判
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            setClickCount(0);
            
            // 执行双击回调
            if (onDoubleClick) {
                onDoubleClick(); // 这里需要捕获事件引用
            }
        }
    }, [clickCount, onDoubleClick, timeoutId]);

    return (
        <div>
            <img src={navbarIcon} alt="HarmonyOS Package Tool" onClick={handleClick} />
        </div>
    );
};

export default ImageDoubleClick;    