// 导入app、BrowserWindow模块
// app 控制应用程序的事件生命周期。事件调用app.on('eventName', callback)，方法调用app.functionName(arg)
// BrowserWindow 创建和控制浏览器窗口。new BrowserWindow([options]) 事件和方法调用同app
// Electron参考文档 https://www.electronjs.org/docs
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const { execSync } = require('child_process');
const path = require('path');
const unzip = require('unzipper');
const fs = require('fs');

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'config.json');
const savedConfig = loadConfig();
console.log(configPath, savedConfig);
let hdcPath = savedConfig.optionOsHdc === true ? getOsHdcPath() : getAppHdcPath()
console.log('hdcPath:', hdcPath);
const PACKAGE_NAME = "com.sohu.sohuvideoharmony";

// 读取配置
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (error) {
        console.error('Failed to load config:', error);
    }
    return {};
}

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800, // 窗口宽度
        height: 600,  // 窗口高度
        icon: path.join(process.resourcesPath, './public/logo.ico'),     //应用运行时的标题栏图标
        // title: "Electron app", // 窗口标题,如果由loadURL()加载的HTML文件中含有标签<title>，该属性可忽略
        webPreferences: { // 网页功能设置
            backgroundThrottling: false,   //设置应用在后台正常运行
            webviewTag: true, // 是否使用<webview>标签 在一个独立的 frame 和进程里显示外部 web 内容
            webSecurity: false, // 禁用同源策略
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true // 是否启用node集成 渲染进程的内容有访问node的能力,建议设置为true, 否则在render页面会提示node找不到的错误
        }
    })
    // 去掉菜单栏
    Menu.setApplicationMenu(null)

    // 加载应用 --打包react应用后，__dirname为当前文件路径
    console.log('__dirname: ', __dirname)
    if (process.env.NODE_ENV === 'production') {
        mainWindow.loadFile(path.join(__dirname, './index.html'));
    } else {
        // setTimeout(() => {
        //     mainWindow.loadURL('http://localhost:3000');
        //     // 在启动的时候打开DevTools
        //     mainWindow.webContents.openDevTools()
        // }, 800);
        mainWindow.loadFile(path.join(__dirname, './index.html'));
        // 在启动的时候打开DevTools
        mainWindow.webContents.openDevTools()
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

    // 监听来自渲染进程的配置保存事件
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('load-config', savedConfig);
    });

    // 监听来自渲染进程的保存配置消息
    ipcMain.handle('save-config', async (event, config) => {
        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            // 修改 hdc 路径
            hdcPath = config.optionOsHdc === true ? getOsHdcPath() : getAppHdcPath()
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    });

    // 处理文件选择请求
    ipcMain.handle('dialog:openFile', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                // { name: 'All Files', extensions: ['*'] },
                // { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
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
            const version = execSync(`${hdcPath} -v`);
            // 命令执行成功
            console.log(version.toString())
            console.log('hdc is ok')
            mainWindow.webContents.send('hdc-status', 'hdc is ok');
        } catch (error) {
            console.error(`命令执行错误: ${error}`);
            mainWindow.webContents.send('hdc-status', `error: 检查 hdc 环境变量.`);
        }
    });

    // 执行应用安装命令
    ipcMain.handle('install-app', async (event, filePath, isOverwrite) => {
        try {
            mainWindow.webContents.send('hdc-status', '开始安装应用...');
            // 停止 app
            stopApp(isOverwrite);
            // 获取文件名和目录
            const fileDir = path.dirname(filePath);
            if (filePath.endsWith('.app')) {
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

                        // 安装.app文件
                        const tmpDirPath = filePath.replace('.app', '');
                        installApp(mainWindow, tmpDirPath)
                    })
                    .on('error', (err) => {
                        console.error('解压过程中发生错误:', err);
                        fs.renameSync(zipFilePath, filePath);
                        mainWindow.webContents.send('hdc-status', `error: 解压过程中发生错误: ${err}`);
                    });
            } else if (filePath.endsWith('.hap')) {
                const fileName = path.basename(filePath, '.hap');
                const tmpDirPath = `${fileDir}/tmp_${fileName}`
                console.log('tmpDirPath:', tmpDirPath);
                const targetFilePath = path.join(tmpDirPath, path.basename(filePath));
                // 安装.app文件
                fs.mkdirSync(tmpDirPath)
                fs.cpSync(filePath, targetFilePath)
                installApp(mainWindow, tmpDirPath)
            }

        } catch (error) {
            console.error(`命令执行错误: ${error}`);
            mainWindow.webContents.send('hdc-status', `error: 安装失败，${error}`);
        }
    });

    // 截屏
    ipcMain.handle('hdc-snapshot', async () => {
        try {
            // 执行 `hdc shell snapshot_display` 命令
            const result = execSync(`${hdcPath} shell snapshot_display`)
            const output = result.toString();
            // 命令执行成功
            console.log(output)
            const pattern = /success:\s+.+?write to\s+([^\s]+)/
            const matchResult = output.match(pattern)
            if (matchResult && matchResult[1]) {
                const imagePath = matchResult[1]
                const desktopPath = app.getPath('desktop');
                execSync(`${hdcPath} file recv ${imagePath} ${desktopPath}`);
            }
        } catch (error) {
            console.error(`命令执行错误: ${error}`);
            mainWindow.webContents.send('hdc-status', `error: 检查 hdc 环境变量.`);
        }
    });

}

app.allowRendererProcessReuse = true;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    console.log('whenready');
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

function stopApp(isOverwrite) {
    console.log("stop app.");
    execSync(`${hdcPath} shell aa force-stop ${PACKAGE_NAME}`);

    if (isOverwrite) {
        // 卸载
        console.log("uninstall...");
        execSync(`${hdcPath} uninstall ${PACKAGE_NAME}`);
    }
}

function installApp(mainWindow, tmpDirPath) {
    console.log("send file.");
    const reomteFileName = path.basename(tmpDirPath);
    mainWindow.webContents.send('hdc-status', 'send file.');
    const sendOutput = execSync(`${hdcPath} file send ${tmpDirPath} data/local/tmp/`);
    console.log(sendOutput.toString())
    if (sendOutput.toString().indexOf('Fail') > -1) {
        mainWindow.webContents.send('hdc-status', 'error: send file error.');
        return;
    }
    console.log("install ...");
    mainWindow.webContents.send('hdc-status', 'install ...');
    const installOutput = execSync(`${hdcPath} shell bm install -r -p data/local/tmp/${reomteFileName}`);
    console.log(installOutput.toString())
    if (installOutput.toString().indexOf('Fail') > -1) {
        mainWindow.webContents.send('hdc-status', 'error: send file error.');
        return;
    }
    execSync(`${hdcPath} shell aa start -a AppAbility -b ${PACKAGE_NAME} -m app`);
    execSync(`${hdcPath} shell rm -rf data/local/tmp/${reomteFileName}`);
    // clean up
    if (tmpDirPath && fs.existsSync(tmpDirPath)) {
        fs.rm(tmpDirPath, { recursive: true }, (err, data) => { });
    }

    console.log("app install finished.");
    mainWindow.webContents.send('hdc-status', 'app install finished.');
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// 获取当前平台对应的HDC可执行文件路径
function getOsHdcPath() {
    let envHdcPath = '';
    try {
        // 在 Windows 平台使用 where 命令查找 hdc 可执行文件
        if (process.platform === 'win32') {
            const output = execSync('where hdc', { stdio: 'pipe' }).toString().trim();
            if (output && fs.existsSync(output)) {
                envHdcPath = output;
            }
        } else {
            // 非 Windows 平台使用 which 命令
            envHdcPath = execSync('which hdc', { stdio: 'pipe' }).toString().trim();
        }
    } catch (e) {
        // 如果命令执行失败，说明环境变量中没有 hdc
        envHdcPath = '';
    }
    return envHdcPath;
}
// 获取app内置HDC可执行文件路径
function getAppHdcPath() {
    let hdcDir;
    if (process.env.NODE_ENV === 'production') {
        // 生产环境路径（打包后）
        hdcDir = path.join(process.resourcesPath, 'hdc');
    } else {
        // 开发环境路径
        hdcDir = path.join(__dirname, 'hdc');
    }

    const platform = process.platform;
    if (platform === 'win32') {
        return path.join(hdcDir, 'win', 'hdc.exe');
    } else if (platform === 'darwin') {
        if (process.arch === 'arm64') {
            return path.join(hdcDir, 'mac/arm64', 'hdc');
        } else {
            return path.join(hdcDir, 'mac/x64', 'hdc');
        }
    } else {
        throw new Error(`不支持的平台: ${platform}`);
    }
}