# Ghost Reader

> 让小说文字悬浮在你的屏幕上，像原本就长在那里一样。

[![platform](<https://img.shields.io/badge/platform-macOS%20(Apple%20Silicon)-black>)](#)
[![electron](https://img.shields.io/badge/Electron-31-47848F)](#)
[![license](https://img.shields.io/badge/license-MIT-green)](#)

A local TXT reader whose killer feature is **Ghost Mode** — strip away all window chrome and let your novel float as bare text on top of any document, blended so seamlessly it looks like part of the page.

## 为什么做这个

市面上的阅读器都有窗口、有边框、有标题栏、有底色 —— 一眼就能看出"这里开着个软件"。如果你想在写文档、看代码、填表格的间隙偷看几行小说，这些窗口装饰就是最大的破绽。

**Ghost Mode** 把这一切全部抹掉：边框没了、标题栏没了、底色没了，屏幕上只剩下几行文字，透明地悬浮在你正在操作的内容之上。配合取色器，文字颜色、字号、行高可以和底下文档完全对齐 —— 读起来就像是这段文字本来就在那一页里。

需要隐蔽时，它又能瞬间切回一屏不停滚动的假构建日志，伪装成你正在盯终端跑 `npm run build`。

## 核心：幽灵悬浮模式

按 `v` 进入 Ghost Mode，会发生这些事：

- **窗口装饰全部消失** —— 标题栏、红黄绿按钮、边框、阴影，一个不留。
- **背景完全透明** —— 没有底色，没有任何遮罩，只有文字本身。
- **文字直接悬浮** —— 几行小说文字贴在桌面上 / 文档上 / 代码上，像贴纸一样。
- **可拖动** —— 拖动文字本身就能移动整个窗口，摆到任意位置。
- **可融入** —— 拖到一份 Word / PDF / 网页 / 代码编辑器上方，文字就和原文档"长在一起"。

进入 Ghost Mode 后，用快捷键把文字格式调成和底下文档一致：

| 按键        | 功能                                  |
| :---------- | :------------------------------------ |
| `+` `=`     | 字号 +0.5px                           |
| `-` `_`     | 字号 −0.5px                           |
| `[` `]`     | 行高 −0.1 / +0.1                      |
| `,` `.`     | 字间距 −0.3px / +0.3px                |
| `c`         | **一键拾取鼠标位置像素颜色套到文字**  |
| `0`         | 重置字号 / 行高 / 字间距 / 颜色       |

> 取色器读取的是鼠标当前所在屏幕位置的真实像素颜色 —— 把鼠标移到文档里某行文字上，按 `c`，你的小说文字立刻变成一模一样的颜色。所有样式会**自动缓存**，下次打开仍是上次的设置。

## 其他功能

- **老板键** —— `Space` 在「阅读」与「伪装构建日志」之间瞬时互切；`Esc` / 窗口失焦自动进伪装态。
- **深浅双主题** —— `t` 切换深色 / 浅色，伪装成深色终端或浅色 IDE 控制台，偏好自动记住。
- **进度记忆** —— 自动记住每本书读到的章节和章内位置，来回切换都停在原处。
- **章节跳转** —— `g` 唤起命令行，输入章号（支持中文数字「二十八」）或标题关键字直达。
- **全文搜索** —— `/` 唤起 grep 风格搜索，列出所有命中章节，回车跳转并高亮定位。
- **多书书架** —— `b` 管理读过的所有书，显示各自进度，可切换 / 移除。
- **中文输入兼容** —— 跳章 / 搜索面板完整支持拼音等中文输入法，输入不卡、候选框不丢。
- **本地导入** —— `o` 导入本地 `.txt`，**全程零网络请求**，无任何痕迹。
- **编码兼容** —— UTF-8 为主，自动回退 GBK，乱码不再。
- **自由缩放** —— 窗口可缩到极小，塞屏幕角落也不碍眼。

## 快捷键

### 全局

| 按键        | 功能                                   |
| :---------- | :------------------------------------- |
| `v`         | **进入 / 退出幽灵悬浮模式（核心）**   |
| `Space`     | 阅读 ⇄ 伪装日志 互切（老板键）        |
| `⌘ Space`   | 全局快捷键，任何界面下强制秒切伪装    |
| `t`         | 切换深色 / 浅色主题                    |
| `Esc`       | 退出幽灵；清高亮；否则切到伪装态      |

### 阅读态

| 按键              | 功能                |
| :---------------- | :------------------ |
| `↑` `↓` / `j` `k` | 上下翻页            |
| `←` `→` / `h` `l` | 上一章 / 下一章     |
| `g`               | 跳转到指定章节      |
| `/`               | 全文搜索关键字      |
| `b`               | 打开书架            |
| `o`               | 导入本地 TXT        |

### 幽灵模式专属

见上方[核心：幽灵悬浮模式](#核心幽灵悬浮模式)的样式调整表。

## 快速开始

克隆仓库，安装依赖，本地运行：

```bash
git clone https://github.com/<your-name>/ghost-reader.git
cd ghost-reader
npm install
npm start
```

国内网络下载 Electron 较慢，可使用镜像：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
  npm install --registry=https://registry.npmmirror.com
```

## 构建打包

```bash
# 生成 .app（不打包 dmg，构建快）
npm run pack

# 生成可分发的 .dmg
npm run dmg
```

产物输出在 `release/` 目录：

- `release/Ghost-x.y.z-arm64.dmg` —— 分发安装包
- `release/mac-arm64/Ghost.app` —— 可直接双击运行

> 国内打包加镜像：
>
> ```bash
> ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
> ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
>   npm run dmg
> ```

## 数据与隐私

- 阅读进度、书架、Ghost 样式仅保存在本机（macOS：`~/Library/Application Support/Terminal/`）。
- **只记录文件路径与进度，不存储小说全文。**
- 应用不联网、不上报任何数据。

## 技术栈

- **Electron 31** —— 主进程 / 渲染进程 / `preload` 安全桥（`contextBridge`）
- 透明窗口：`transparent: true` + `backgroundColor: '#00000000'` 实现 Ghost 悬浮
- 窗口装饰控制：`setHasShadow` + `setWindowButtonVisibility` + `app.dock.hide()`
- 屏幕取色：`desktopCapturer` 截屏 + `nativeImage.toBitmap()` 读取像素 Buffer
- 全局逃生键：`globalShortcut`
- 主题系统：CSS 变量 + `data-theme` 切换，`localStorage` 持久化
- 中文输入兼容：`isComposing` 守卫 + DOM 不重建（输入框与列表分离）
- 零运行时第三方依赖，纯原生实现

## 目录结构

```
.
├── main.js        # 主进程：透明窗口、全局快捷键、取色、IPC、缓存读写
├── preload.js     # 预加载：contextBridge 暴露安全 API
├── index.html     # 渲染层：全部 UI 与阅读 / 幽灵 / 搜索逻辑
└── package.json   # 项目配置 + electron-builder 打包配置
```

## 兼容性

当前打包目标为 **macOS · Apple Silicon (arm64)**。如需 Intel (x64) 或 Windows，可在 `package.json` 的 `build.mac.target` / 新增 `build.win` 中扩展架构后重新打包。

> Ghost Mode 的透明窗口在 macOS 上效果最佳。Windows / Linux 透明窗口行为略有差异，需额外适配。

## 免责声明

本项目仅供学习娱乐。请合理安排工作与摸鱼时间 🐟。

## License

[MIT](LICENSE)
