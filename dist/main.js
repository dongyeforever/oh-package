/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main/index.js":
/*!***************************!*\
  !*** ./src/main/index.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("// 导入app、BrowserWindow模块\n// app 控制应用程序的事件生命周期。事件调用app.on('eventName', callback)，方法调用app.functionName(arg)\n// BrowserWindow 创建和控制浏览器窗口。new BrowserWindow([options]) 事件和方法调用同app\n// Electron参考文档 https://www.electronjs.org/docs\nconst { app, BrowserWindow, Menu, ipcMain, dialog } = __webpack_require__(/*! electron */ \"electron\")\nconst { execSync, exec } = __webpack_require__(/*! child_process */ \"child_process\");\nconst path = __webpack_require__(/*! path */ \"path\");\nconst unzip = __webpack_require__(/*! unzipper */ \"unzipper\");\nconst fs = __webpack_require__(/*! fs */ \"fs\");\n\n// 配置文件路径\nconst configPath = path.join(app.getPath('userData'), 'config.json');\nconst savedConfig = loadConfig();\nconsole.log(configPath, savedConfig);\nlet hdcPath = (savedConfig && savedConfig.optionOsHdc === true) ? `\"${getOsHdcPath()}\"` : `\"${getAppHdcPath()}\"`\nconsole.log('hdcPath:', hdcPath);\nconst PACKAGE_NAME = \"com.sohu.sohuvideoharmony\";\nlet recordingVideoName = \"\";\n\n// 读取配置\nfunction loadConfig() {\n    try {\n        if (fs.existsSync(configPath)) {\n            return JSON.parse(fs.readFileSync(configPath, 'utf8'));\n        }\n    } catch (error) {\n        console.error('Failed to load config:', error);\n    }\n    return {};\n}\n\nfunction createWindow() {\n    // Create the browser window.\n    const mainWindow = new BrowserWindow({\n        width: 800, // 窗口宽度\n        height: 600,  // 窗口高度\n        icon: path.join(process.resourcesPath, './public/logo.ico'),     //应用运行时的标题栏图标\n        // title: \"Electron app\", // 窗口标题,如果由loadURL()加载的HTML文件中含有标签<title>，该属性可忽略\n        webPreferences: { // 网页功能设置\n            backgroundThrottling: false,   //设置应用在后台正常运行\n            webviewTag: true, // 是否使用<webview>标签 在一个独立的 frame 和进程里显示外部 web 内容\n            webSecurity: false, // 禁用同源策略\n            preload: path.join(__dirname, 'preload.js'),\n            nodeIntegration: true // 是否启用node集成 渲染进程的内容有访问node的能力,建议设置为true, 否则在render页面会提示node找不到的错误\n        }\n    })\n    // 去掉菜单栏\n    Menu.setApplicationMenu(null)\n\n    // 加载应用 --打包react应用后，__dirname为当前文件路径\n    console.log('__dirname: ', __dirname)\n    if (false) // removed by dead control flow\n{} else {\n        // setTimeout(() => {\n        //     mainWindow.loadURL('http://localhost:3000');\n        //     // 在启动的时候打开DevTools\n        //     mainWindow.webContents.openDevTools()\n        // }, 800);\n        mainWindow.loadFile(path.join(__dirname, './index.html'));\n        // 在启动的时候打开DevTools\n        mainWindow.webContents.openDevTools()\n    }\n\n    // 解决应用启动白屏问题\n    mainWindow.on('ready-to-show', () => {\n        mainWindow.show();\n        mainWindow.focus();\n    });\n\n    // 当窗口关闭时发出。在你收到这个事件后，你应该删除对窗口的引用，并避免再使用它。\n    mainWindow.on('closed', () => {\n        // mainWindow = null;\n    });\n\n    // 监听来自渲染进程的配置保存事件\n    mainWindow.webContents.on('did-finish-load', () => {\n        mainWindow.webContents.send('load-config', savedConfig);\n    });\n\n    // 监听来自渲染进程的保存配置消息\n    ipcMain.handle('save-config', async (event, config) => {\n        try {\n            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));\n\n            // 修改 hdc 路径\n            hdcPath = config.optionOsHdc === true ? getOsHdcPath() : getAppHdcPath()\n        } catch (error) {\n            console.error('Failed to save config:', error);\n        }\n    });\n\n    // 处理文件选择请求\n    ipcMain.handle('dialog:openFile', async () => {\n        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {\n            properties: ['openFile'],\n            filters: [\n                // { name: 'All Files', extensions: ['*'] },\n                // { name: 'Images', extensions: ['jpg', 'png', 'gif'] },\n                { name: 'HarmonyPackage', extensions: ['app', 'hap'] }\n            ]\n        });\n\n        if (!canceled) {\n            return filePaths[0];\n        }\n    });\n\n    // 执行 HDC 命令检查环境\n    ipcMain.handle('check-hdc', async () => {\n        try {\n            // 发送开始检查的消息\n            mainWindow.webContents.send('hdc-status', '正在检查 hdc 环境变量...');\n            // 执行 hdc -v 命令\n            const version = execSync(`${hdcPath} -v`);\n            // 命令执行成功\n            console.log(version.toString())\n            console.log('hdc is ok')\n            mainWindow.webContents.send('hdc-status', { message: 'hdc is ok' });\n        } catch (error) {\n            console.error(`命令执行错误: ${error}`);\n            mainWindow.webContents.send('hdc-status', { message: 'error: 检查 hdc 环境变量.' });\n        }\n    });\n\n    // 执行应用安装命令\n    ipcMain.handle('install-app', async (event, filePath, isOverwrite) => {\n        try {\n            mainWindow.webContents.send('hdc-status', { message: '开始安装应用...' });\n            // 停止 app\n            stopApp(isOverwrite);\n            // 获取文件名和目录\n            const fileDir = path.dirname(filePath);\n            if (filePath.endsWith('.app')) {\n                const fileName = path.basename(filePath, '.app');\n                // 构建目标 ZIP 文件路径\n                const zipFilePath = path.join(fileDir, `${fileName}.zip`);\n                // 重命名文件为 ZIP\n                fs.renameSync(filePath, zipFilePath);\n                // 解压\n                fs.createReadStream(zipFilePath)\n                    .pipe(unzip.Extract({ path: fileDir }))\n                    .on('close', () => {\n                        console.log('解压完成！');\n                        fs.renameSync(zipFilePath, filePath);\n\n                        // 安装.app文件\n                        const tmpDirPath = filePath.replace('.app', '');\n                        installApp(mainWindow, tmpDirPath)\n                    })\n                    .on('error', (err) => {\n                        console.error('解压过程中发生错误:', err);\n                        fs.renameSync(zipFilePath, filePath);\n                        mainWindow.webContents.send('hdc-status', { message: `error: 解压过程中发生错误: ${err}` });\n                    });\n            } else if (filePath.endsWith('.hap')) {\n                const fileName = path.basename(filePath, '.hap');\n                const tmpDirPath = `${fileDir}/tmp_${fileName}`\n                console.log('tmpDirPath:', tmpDirPath);\n                const targetFilePath = path.join(tmpDirPath, path.basename(filePath));\n                // 安装.app文件\n                fs.mkdirSync(tmpDirPath)\n                fs.cpSync(filePath, targetFilePath)\n                installApp(mainWindow, tmpDirPath)\n            }\n\n        } catch (error) {\n            console.error(`命令执行错误: ${error}`);\n            mainWindow.webContents.send('hdc-status', { message: `error: 安装失败，${error}` });\n        }\n    });\n\n    // 截屏\n    ipcMain.handle('hdc-snapshot', async () => {\n        try {\n            // 执行 `hdc shell snapshot_display` 命令\n            const device = execSync(`${hdcPath} list targets | head -n 1`).toString().trim().replace(/[\\n\\r]/g, '');\n            const result = execSync(`${hdcPath}  -t ${device} shell snapshot_display`)\n            const output = result.toString();\n            // 命令执行成功\n            console.log(output)\n            const pattern = /success:\\s+.+?write to\\s+([^\\s]+)/\n            const matchResult = output.match(pattern)\n            if (matchResult && matchResult[0]) {\n                const imagePath = matchResult[0]\n                const desktopPath = app.getPath('desktop');\n                execSync(`${hdcPath} file recv ${imagePath} ${desktopPath}`);\n                mainWindow.webContents.send('hdc-status', { message: `截屏已发送到桌面 > ${path.basename(imagePath)}`, animate: true });\n            }\n        } catch (error) {\n            console.error(`命令执行错误: ${error}`);\n            mainWindow.webContents.send('hdc-status', { message: 'error: 检查 hdc 环境变量.' });\n        }\n    });\n\n    // 录屏\n    ipcMain.handle('hdc-start-record', async () => {\n        try {\n            // 执行 `hdc shell` 命令\n            recordingVideoName = `sohu_${Date.now()}.mp4`\n            const device = execSync(`${hdcPath} list targets | head -n 1`).toString().trim().replace(/[\\n\\r]/g, '');\n            exec(`${hdcPath} -t ${device} shell aa start -b com.huawei.hmos.screenrecorder -a com.huawei.hmos.screenrecorder.ServiceExtAbility --ps \"CustomizedFileName\" ${recordingVideoName}`, (error, stdout, stderr) => {\n                const output = stdout.toString();\n                // 命令执行成功\n                console.log(output)\n            })\n        } catch (error) {\n            console.error(`命令执行错误: ${error}`);\n            mainWindow.webContents.send('hdc-status', { message: 'error: 检查 hdc 环境变量.' });\n        }\n    });\n\n    // 停止录屏\n    ipcMain.handle('hdc-stop-record', async () => {\n        try {\n            // 执行 `hdc shell` 命令\n            console.log(`hdc-stop-record: ${recordingVideoName}`);\n            exec(`${hdcPath} shell aa start -b com.huawei.hmos.screenrecorder -a com.huawei.hmos.screenrecorder.ServiceExtAbility`, (error, stdout, stderr) => {\n                const output = stdout.toString();\n                // 命令执行成功\n                console.log(output)\n                // 查询录屏文件位置(官方文档的命令，实际查询不到文件)\n                const searchResult = execSync(`${hdcPath} shell mediatool query ${recordingVideoName}`).toString()\n                // 复制录屏文件位置的视频\n                const pattern = /\\/storage\\/.*\\.mp4/\n                const matchResult = searchResult.match(pattern)\n                console.log(matchResult[0])\n                if (matchResult && matchResult[0]) {\n                    const videoPath = matchResult[0]\n                    const desktopPath = app.getPath('desktop');\n                    execSync(`${hdcPath} file recv ${videoPath} ${desktopPath}`);\n                }\n            })\n        } catch (error) {\n            console.error(`命令执行错误: ${error}`);\n            mainWindow.webContents.send('hdc-status', { message: 'error: 检查 hdc 环境变量.' });\n        }\n    });\n}\n\napp.allowRendererProcessReuse = true;\n\n// This method will be called when Electron has finished\n// initialization and is ready to create browser windows.\n// Some APIs can only be used after this event occurs.\napp.whenReady().then(() => {\n    console.log('whenready');\n    createWindow();\n})\n\n// Quit when all windows are closed.\napp.on('window-all-closed', function () {\n    // On macOS it is common for applications and their menu bar\n    // to stay active until the user quits explicitly with Cmd + Q\n    console.log('window-all-closed');\n    if (process.platform !== 'darwin') app.quit()\n})\n\napp.on('activate', function () {\n    // On macOS it's common to re-create a window in the app when the\n    // dock icon is clicked and there are no other windows open.\n    if (BrowserWindow.getAllWindows().length === 0) createWindow()\n})\n\nfunction stopApp(isOverwrite) {\n    console.log(\"stop app.\");\n    execSync(`${hdcPath} shell aa force-stop ${PACKAGE_NAME}`);\n\n    if (isOverwrite) {\n        // 卸载\n        console.log(\"uninstall...\");\n        execSync(`${hdcPath} uninstall ${PACKAGE_NAME}`);\n    }\n}\n\nfunction installApp(mainWindow, tmpDirPath) {\n    console.log(\"send file.\");\n    const reomteFileName = path.basename(tmpDirPath);\n    mainWindow.webContents.send('hdc-status', { message: 'send file.' });\n    const sendOutput = execSync(`${hdcPath} file send ${tmpDirPath} data/local/tmp/`);\n    console.log(sendOutput.toString())\n    if (sendOutput.toString().indexOf('Fail') > -1) {\n        mainWindow.webContents.send('hdc-status', { message: 'error: send file error.' });\n        return;\n    }\n    console.log(\"install ...\");\n    mainWindow.webContents.send('hdc-status', { message: 'install ...' });\n    const installOutput = execSync(`${hdcPath} shell bm install -r -p data/local/tmp/${reomteFileName}`);\n    console.log(installOutput.toString())\n    if (installOutput.toString().indexOf('Fail') > -1) {\n        mainWindow.webContents.send('hdc-status', { message: 'error: send file error.' });\n        return;\n    }\n    execSync(`${hdcPath} shell aa start -a AppAbility -b ${PACKAGE_NAME} -m app`);\n    execSync(`${hdcPath} shell rm -rf data/local/tmp/${reomteFileName}`);\n    // clean up\n    if (tmpDirPath && fs.existsSync(tmpDirPath)) {\n        fs.rm(tmpDirPath, { recursive: true }, (err, data) => { });\n    }\n\n    console.log(\"app install finished.\");\n    mainWindow.webContents.send('hdc-status', { message: 'app install finished.' });\n}\n\n// In this file you can include the rest of your app's specific main process\n// code. You can also put them in separate files and require them here.\n\n// 获取当前平台对应的HDC可执行文件路径\nfunction getOsHdcPath() {\n    let envHdcPath = '';\n    try {\n        // 在 Windows 平台使用 where 命令查找 hdc 可执行文件\n        if (process.platform === 'win32') {\n            const output = execSync('where hdc', { stdio: 'pipe' }).toString().trim();\n            if (output && fs.existsSync(output)) {\n                envHdcPath = output;\n            }\n        } else {\n            // 非 Windows 平台使用 which 命令\n            envHdcPath = execSync('which hdc', { stdio: 'pipe' }).toString().trim();\n        }\n    } catch (e) {\n        // 如果命令执行失败，说明环境变量中没有 hdc\n        envHdcPath = '';\n    }\n    return envHdcPath;\n}\n// 获取app内置HDC可执行文件路径\nfunction getAppHdcPath() {\n    let hdcDir;\n    if (false) // removed by dead control flow\n{} else {\n        // 开发环境路径\n        hdcDir = path.join(__dirname, 'hdc');\n    }\n\n    const platform = process.platform;\n    if (platform === 'win32') {\n        return path.join(hdcDir, 'win', 'hdc.exe');\n    } else if (platform === 'darwin') {\n        if (process.arch === 'arm64') {\n            return path.join(hdcDir, 'mac/arm64', 'hdc');\n        } else {\n            return path.join(hdcDir, 'mac/x64', 'hdc');\n        }\n    } else {\n        throw new Error(`不支持的平台: ${platform}`);\n    }\n}\n\n//# sourceURL=webpack://electron-app/./src/main/index.js?");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "unzipper":
/*!***************************!*\
  !*** external "unzipper" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("unzipper");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main/index.js");
/******/ 	
/******/ })()
;