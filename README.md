项目结构：

electron-app/

├── public/

│   └── index.html

├── src/

│   ├── main/               # Electron 主进程代码

│   │   └── index.js

│   └── renderer/            # React 渲染进程代码

│       ├── App.tsx

│       ├── index.tsx

│       └── components/

├── package.json

├── tsconfig.json

├── webpack.main.ts      # 主进程打包配置

├── ebpack.renderer.ts  # 渲染进程打包配置

└── yarn.lock


#### 使用 Yarn 的命令：
- 安装依赖：yarn
- 开发模式：yarn dev
- 生产构建：yarn build
- 打包应用：yarn package:mac
