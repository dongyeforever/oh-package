// 导入app、BrowserWindow模块
// app 控制应用程序的事件生命周期。事件调用app.on('eventName', callback)，方法调用app.functionName(arg)
// BrowserWindow 创建和控制浏览器窗口。new BrowserWindow([options]) 事件和方法调用同app
// Electron参考文档 https://www.electronjs.org/docs
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { execSync } = require('child_process');
const path = require('path');
const unzip = require('unzipper');
const fs = require('fs');
const iconPath = path.join(__dirname, './public/logo.ico')   //应用运行时的标题栏图标

function createWindow() {
    // Create the browser window.
    // require('./menu.js')
    const mainWindow = new BrowserWindow({
        width: 800, // 窗口宽度
        height: 650,  // 窗口高度
        icon: iconPath,     //应用运行时的标题栏图标
        // title: "Electron app", // 窗口标题,如果由loadURL()加载的HTML文件中含有标签<title>，该属性可忽略
        webPreferences: { // 网页功能设置
            backgroundThrottling: false,   //设置应用在后台正常运行
            webviewTag: true, // 是否使用<webview>标签 在一个独立的 frame 和进程里显示外部 web 内容
            webSecurity: false, // 禁用同源策略
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true // 是否启用node集成 渲染进程的内容有访问node的能力,建议设置为true, 否则在render页面会提示node找不到的错误
        }
    })


    // 加载应用 --打包react应用后，__dirname为当前文件路径
    console.log('__dirname: ', __dirname)
    if (process.env.NODE_ENV === 'dev') {
        setTimeout(() => {
            mainWindow.loadURL('http://localhost:3000');
            // 在启动的时候打开DevTools
            mainWindow.webContents.openDevTools()
        }, 800);
    } else {
        console.log('in prod', __dirname)
        mainWindow.loadFile(path.join(__dirname, './build/index.html'));
    }

    // 解决应用启动白屏问题
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // 当窗口关闭时发出。在你收到这个事件后，你应该删除对窗口的引用，并避免再使用它。
    mainWindow.on('closed', () => {
        // mainWindow = null;
    });

    // 处理文件选择请求
    ipcMain.handle('dialog:openFile', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                // { name: 'All Files', extensions: ['*'] },
                // { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
                // { name: 'Documents', extensions: ['pdf', 'docx', 'txt'] },
                { name: 'HarmonyPackage', extensions: ['app', 'hap'] }
            ]
        });

        if (!canceled) {
            return filePaths[0];
        }
    });

    // 执行 HDC 命令检查环境
    ipcMain.handle('check-hdc', async () => {
        try {
            // 发送开始检查的消息
            mainWindow.webContents.send('hdc-status', '正在检查 hdc 环境变量...');
            // 执行 hdc -v 命令
            const version = execSync('hdc -v');
            // 命令执行成功
            console.log(version.toString())
            console.log('hdc is ok')
            mainWindow.webContents.send('hdc-status', 'hdc is ok');
        } catch (error) {
            console.error(`命令执行错误: ${error}`);
            mainWindow.webContents.send('hdc-status', `检查 hdc 环境变量.`);
        }
    });

    // 执行应用安装命令
    ipcMain.handle('install-app', async (event, filePath, isOverwrite) => {
        try {
            mainWindow.webContents.send('hdc-status', '开始安装应用...');
            const PACKAGE_NAME = "com.sohu.sohuvideoharmony";
            // 获取文件名和目录
            const fileDir = path.dirname(filePath);
            const fileName = path.basename(filePath, '.app');
            // 构建目标 ZIP 文件路径
            const zipFilePath = path.join(fileDir, `${fileName}.zip`);
            // 重命名文件为 ZIP
            fs.renameSync(filePath, zipFilePath);
            // 解压
            fs.createReadStream(zipFilePath)
                .pipe(unzip.Extract({ path: fileDir }))
                .on('close', () => {
                    console.log('解压完成！');
                    fs.renameSync(zipFilePath, filePath);
                    // 停止 app
                    console.log("stop app.");
                    execSync(`hdc shell aa force-stop ${PACKAGE_NAME}`);

                    if (isOverwrite) {
                        // 卸载
                        console.log("uninstall...");
                        execSync(`hdc uninstall ${PACKAGE_NAME}`);
                    }

                    // 安装.app文件
                    const tmpDirPath = filePath.replace('.app', '');
                    console.log("send file.");
                    mainWindow.webContents.send('hdc-status', 'send file.');
                    const sendOutput = execSync(`hdc file send ${tmpDirPath} data/local/tmp/`);
                    console.log(sendOutput.toString())
                    console.log("install ...");
                    mainWindow.webContents.send('hdc-status', 'install ...');
                    const installOutput = execSync(`hdc shell bm install -r -p data/local/tmp/${fileName}`);
                    console.log(installOutput.toString())
                    execSync(`hdc shell aa start -a AppAbility -b ${PACKAGE_NAME} -m app`);
                    execSync(`hdc shell rm -rf data/local/tmp/${fileName}`);

                    // clean up
                    if (fs.existsSync(tmpDirPath)) {
                        fs.rm(tmpDirPath, { recursive: true }, (err, data) => { });
                    }
                    console.log("app install finished.");
                    mainWindow.webContents.send('hdc-status', 'app install finished.');
                })
                .on('error', (err) => {
                    console.error('解压过程中发生错误:', err);
                    fs.renameSync(zipFilePath, filePath);
                });

        } catch (error) {
            console.error(`命令执行错误: ${error}`);
            mainWindow.webContents.send('hdc-status', `安装失败，${error}`);
        }
    });

}

app.allowRendererProcessReuse = true;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    console.log('qpp---whenready');
    createWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    console.log('window-all-closed');
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.