const {app, Menu } = require('electron')
 
const isMac = process.platform === 'darwin'
 
const template = [
  // { role: 'appMenu' }
  // 如果是mac系统才有
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: '文件',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit', label: '退出' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤消' },
      { role: 'redo', label: '恢复' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete', label: '删除' },
        { type: 'separator' },
        { role: 'selectAll', label: '全选' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: '查看',
    submenu: [
      { role: 'reload', label: '重新加载' },
      { role: 'forceReload', label: '强制重新加载' },
      { role: 'toggleDevTools', label: '切换开发工具栏' },
      { type: 'separator' },
      { role: 'resetZoom', label: '原始开发工具栏窗口大小' },
      { role: 'zoomIn', label: '放大开发工具栏窗口'},
      { role: 'zoomOut', label: '缩小开发工具栏窗口' },
      { type: 'separator' },
      { role: 'togglefullscreen', label:'切换开发工具栏全屏' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: '窗口',
    submenu: [
      { role: 'minimize', label:'最小化' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close', label: '关闭' }
      ])
    ]
  },
  {
    role: 'help',
    label: '帮助',
    submenu: [
      {
        label: '从Electron官网学习更多',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
]
 
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)