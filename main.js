const { app, BrowserWindow, globalShortcut, ipcMain, dialog, screen, desktopCapturer, nativeImage } = require('electron');
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
    minWidth: 120,    // 允许极度缩小,只剩标题栏也能缩
    minHeight: 30,    // 仅标题栏高度,几乎贴底
    title: 'Terminal',
    backgroundColor: '#00000000', // 透明:允许 ghost 模式把背景完全藏掉
    transparent: true,            // 窗口透明(创建时设定,不可运行时切换)
    hasShadow: true,              // 正常态保留阴影更像真窗口;ghost 态关掉
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
  // ghost(幽灵悬浮)模式下不切:用户故意让文字悬浮在别的窗口上,失焦是常态
  win.on('blur', () => {
    if (win && !win.isDestroyed() && !ghostMode) {
      win.webContents.send('force-disguise');
    }
  });
}

// ghost(幽灵悬浮)模式:隐藏标题栏红黄绿 / 阴影,渲染层把背景设透明
// 效果:只剩几行小说文字悬浮在桌面上,可拖到任何文档上"融为一体"
let ghostMode = false;
function setGhostMode(on) {
  ghostMode = on;
  if (!win || win.isDestroyed()) return;
  win.setHasShadow(!on);
  // 隐藏/显示左上角红黄绿按钮(macOS)
  try { win.setWindowButtonVisibility(!on); } catch (e) {}
  // ghost 模式下注册全局取色快捷键;退出时注销
  if (on) {
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      if (win && !win.isDestroyed()) win.webContents.send('pick-color-now');
    });
  } else {
    globalShortcut.unregister('CommandOrControl+Shift+C');
  }
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

// 幽灵悬浮模式:隐藏窗口装饰,只剩文字
ipcMain.on('set-ghost', (e, on) => {
  setGhostMode(!!on);
});

// 屏幕取色:读取当前鼠标所在屏幕位置的像素颜色
// 用法:渲染层把鼠标移到目标位置后调 pickColor,返回 #rrggbb
ipcMain.handle('pick-color', async () => {
  try {
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    const sf = display.scaleFactor || 1;
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.floor(display.size.width * sf),
        height: Math.floor(display.size.height * sf),
      },
    });
    // 找到对应这块屏的 source;display_id 可能是字符串
    const src = sources.find(s => s.display_id === String(display.id)) || sources[0];
    if (!src) return null;
    const img = nativeImage.createFromBuffer(src.thumbnail.toPNG());
    // 缩略图实际尺寸(display.size * sf)
    const w = img.getSize().width;
    const h = img.getSize().height;
    const sx = w / (display.size.width * sf);
    const sy = h / (display.size.height * sf);
    // 鼠标相对该屏原点的坐标,换算到缩略图像素坐标
    const px = Math.max(0, Math.min(w - 1, Math.floor((cursor.x - display.bounds.x) * sf * sx)));
    const py = Math.max(0, Math.min(h - 1, Math.floor((cursor.y - display.bounds.y) * sf * sy)));
    const color = img.getPixel(px, py); // [r,g,b,a] 0-255
    if (!color || color.length < 3) return null;
    const hex = '#' + [color[0], color[1], color[2]]
      .map(n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0'))
      .join('');
    return hex;
  } catch (err) {
    return null;
  }
});
