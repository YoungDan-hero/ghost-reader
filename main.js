const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let win = null;

// ===== 持久化缓存:存到用户数据目录的 store.json =====
// 结构:{ lastFile, books: { [absPath]: { name, chapterIdx, scrollRatio, updatedAt } } }
function storeFile() {
  return path.join(app.getPath('userData'), 'store.json');
}
function readStore() {
  try {
    const raw = fs.readFileSync(storeFile(), 'utf-8');
    const obj = JSON.parse(raw);
    if (!obj.books) obj.books = {};
    return obj;
  } catch (e) {
    return { lastFile: null, books: {} };
  }
}
function writeStore(obj) {
  try {
    fs.writeFileSync(storeFile(), JSON.stringify(obj, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

// ===== 读取并解码 txt(utf-8 / gbk 兜底)=====
function readNovelFile(filePath) {
  const buf = fs.readFileSync(filePath);
  let content;
  try {
    content = buf.toString('utf-8');
    if ((content.match(/\uFFFD/g) || []).length > 20) {
      content = decodeGbk(buf);
    }
  } catch (e) {
    content = decodeGbk(buf);
  }
  return content;
}

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 560,
    minWidth: 520,
    minHeight: 320,
    title: 'Terminal',
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 9 },
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');

  // 失焦自动切到伪装态(领导路过点了别处也安全)
  win.on('blur', () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('force-disguise');
    }
  });
}

app.whenReady().then(() => {
  // 从 Dock 隐藏图标,程序坞里看不到这个 app
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  createWindow();

  // 全局老板键:即使窗口没聚焦也能秒切伪装态
  // 用 CommandOrControl+Space 作为全局逃生键(系统级,任何时候有效)
  globalShortcut.register('CommandOrControl+Space', () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('toggle-state');
      if (!win.isFocused()) {
        win.focus();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 渲染进程请求打开 txt 文件(弹框选择)
ipcMain.handle('open-novel', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: '选择小说文件',
    filters: [{ name: 'Text', extensions: ['txt'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = readNovelFile(filePath);
  // 记录/更新到缓存,并标记为最后打开
  const store = readStore();
  const prev = store.books[filePath] || {};
  store.books[filePath] = {
    name: path.basename(filePath),
    chapterIdx: prev.chapterIdx || 0,
    scrollRatio: prev.scrollRatio || 0,
    updatedAt: Date.now(),
  };
  store.lastFile = filePath;
  writeStore(store);
  return { path: filePath, name: path.basename(filePath), content, saved: store.books[filePath] };
});

// 按路径直接加载(用于启动恢复、书架点选);文件不存在则返回 missing 标记
ipcMain.handle('load-novel-by-path', async (e, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { missing: true, path: filePath };
    }
    const content = readNovelFile(filePath);
    const store = readStore();
    const saved = store.books[filePath] || { name: path.basename(filePath), chapterIdx: 0, scrollRatio: 0 };
    store.lastFile = filePath;
    writeStore(store);
    return { path: filePath, name: path.basename(filePath), content, saved };
  } catch (err) {
    return { missing: true, path: filePath, error: String(err) };
  }
});

// 启动时取回上次状态(最后文件 + 书架列表,按时间倒序)
ipcMain.handle('get-state', async () => {
  const store = readStore();
  const books = Object.keys(store.books).map((p) => ({
    path: p,
    name: store.books[p].name,
    chapterIdx: store.books[p].chapterIdx || 0,
    scrollRatio: store.books[p].scrollRatio || 0,
    updatedAt: store.books[p].updatedAt || 0,
    exists: fs.existsSync(p),
  })).sort((a, b) => b.updatedAt - a.updatedAt);
  return { lastFile: store.lastFile, books };
});

// 保存阅读进度(章 + 章内滚动比例)
ipcMain.on('save-progress', (e, { filePath, chapterIdx, scrollRatio }) => {
  if (!filePath) return;
  const store = readStore();
  const prev = store.books[filePath] || { name: path.basename(filePath) };
  store.books[filePath] = {
    name: prev.name || path.basename(filePath),
    chapterIdx: chapterIdx || 0,
    scrollRatio: typeof scrollRatio === 'number' ? scrollRatio : 0,
    updatedAt: Date.now(),
  };
  store.lastFile = filePath;
  writeStore(store);
});

// 从书架移除一本(仅删缓存记录,不动原文件)
ipcMain.handle('remove-book', async (e, filePath) => {
  const store = readStore();
  if (store.books[filePath]) delete store.books[filePath];
  if (store.lastFile === filePath) store.lastFile = null;
  writeStore(store);
  return true;
});

// 极简 gbk 解码(无外部依赖时的兜底,使用 TextDecoder)
function decodeGbk(buf) {
  try {
    return new TextDecoder('gbk').decode(buf);
  } catch (e) {
    return buf.toString('utf-8');
  }
}

// 退出
ipcMain.on('quit-app', () => app.quit());

// 最小化
ipcMain.on('minimize-app', () => {
  if (win && !win.isDestroyed()) win.minimize();
});
