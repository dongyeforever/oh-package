HarmonyOS Tool 是鸿蒙系统包安装工具，基于开源 OpenHarmony 项目的 hdc 工具一键自动安装到模拟器与真机。


![截图](https://github.com/dongyeforever/oh-package/blob/main/screenshot/screenshort.png)

#### 使用 Yarn 的命令：

**安装依赖：**
```shell
yarn install
```

**开发模式**
```shell
yarn dev
```

**打包应用**
```shell
yarn build

yarn package:mac  // macOS 
yarn package:mac2 // macOS universal包
yarn package:win  // windows
```

#### 项目结构：

```html
electron-app/
├── hdc/
├── public/
│   └── index.html
├── src/
│   ├── main/               # Electron 主进程代码
│   │   └── index.js
│   │   └── preload.js
│   └── renderer/            # React 渲染进程代码
│       ├── App.tsx
│       ├── index.tsx
│       └── components/
├── package.json
├── tsconfig.json
├── webpack.main.ts      # 主进程打包配置
├── webpack.renderer.ts  # 渲染进程打包配置
└── yarn.lock
```

