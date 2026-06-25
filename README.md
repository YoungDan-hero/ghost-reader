# Terminal Reader

> 一个伪装成 macOS 终端的本地 TXT 小说阅读器 —— 一键切换，老板来了秒变构建日志。

[![platform](<https://img.shields.io/badge/platform-macOS%20(Apple%20Silicon)-black>)](#)
[![electron](https://img.shields.io/badge/Electron-31-47848F)](#)
[![license](https://img.shields.io/badge/license-MIT-green)](#)

A local TXT novel reader disguised as a macOS Terminal. Press **Space** to flip between your novel and a stream of fake build logs — instant camouflage when someone walks by.

## 为什么做这个

普通的阅读器一眼就能被认出来。这个工具把"看小说"伪装成"盯着终端跑构建"——

- 阅读界面就是 `cat ./logs/xxx.log` 的输出样式，没有书页、没有目录树、没有任何"阅读器"特征。
- 一个键就能切到一屏不停滚动的假构建日志，和真实的 `npm run build` 几乎无法区分。
- 窗口失焦（点到别处）会**自动切回伪装态**，多一道保险。

## 功能

- **老板键** —— `Space` 在「阅读」与「伪装日志」之间瞬时互切；`Esc` / 窗口失焦自动进伪装态。
- **幽灵悬浮** —— `v` 进入幽灵模式，窗口边框、标题栏、底色全部消失，只剩几行小说文字悬浮在桌面上，可拖到任意文档上"融为一体"，极致隐蔽。
- **深浅双主题** —— `t` 随时切换深色 / 浅色主题，伪装成深色终端或浅色 IDE 控制台，偏好自动记住。
- **进度记忆** —— 自动记住每本书读到的章节和章内位置，下次打开、来回切换都停在原处。
- **章节跳转** —— `g` 唤起命令行，输入章号（支持中文数字「二十八」）或标题关键字直达。
- **全文搜索** —— `/` 唤起 grep 风格搜索，列出所有命中章节，回车跳转并高亮定位。
- **多书书架** —— `b` 管理读过的所有书，显示各自进度，可切换 / 移除。
- **本地导入** —— `o` 导入本地 `.txt`，**全程零网络请求**，无任何痕迹。
- **编码兼容** —— UTF-8 为主，自动回退 GBK，乱码不再。
- **纯净阅读** —— 阅读态无工具栏、无菜单，整屏只有正文。
- **自由缩放** —— 窗口可缩到极小（仅剩标题栏），塞屏幕角落也不碍眼。

## 快捷键

| 按键              | 功能                                 |
| :---------------- | :----------------------------------- |
| `Space`           | 阅读 ⇄ 伪装日志 互切（核心老板键）   |
| `v`               | 幽灵悬浮模式：窗口装饰全隐，文字悬浮 |
| `t`               | 切换深色 / 浅色主题                  |
| `Esc`             | 退出幽灵；清高亮；否则切到伪装态     |
| `↑` `↓` / `j` `k` | 上下翻页                             |
| `←` `→` / `h` `l` | 上一章 / 下一章                      |
| `g`               | 跳转到指定章节                       |
| `/`               | 全文搜索关键字                       |
| `b`               | 打开书架                             |
| `o`               | 导入本地 TXT                         |
| `⌘ Space`         | 全局快捷键，任何界面下强制秒切伪装   |

## 快速开始

克隆仓库，安装依赖，本地运行：

```bash
git clone https://github.com/<your-name>/terminal-reader.git
cd terminal-reader
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

- `release/Terminal-x.y.z-arm64.dmg` —— 分发安装包
- `release/mac-arm64/Terminal.app` —— 可直接双击运行

> 国内打包加镜像：
>
> ```bash
> ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ \
> ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
>   npm run dmg
> ```

## 数据与隐私

- 阅读进度、书架仅保存在本机用户数据目录的 `store.json`（macOS：`~/Library/Application Support/Terminal/`）。
- **只记录文件路径与进度，不存储小说全文。**
- 应用不联网、不上报任何数据。

## 技术栈

- **Electron 31** —— 主进程 / 渲染进程 / `preload` 安全桥（`contextBridge`）
- 窗口伪装：`titleBarStyle: hiddenInset` + 隐藏 Dock 图标 + 不占任务栏
- 全局逃生键：`globalShortcut`
- 持久化：用户数据目录 JSON
- 零运行时第三方依赖，纯原生实现

## 目录结构

```
.
├── main.js        # 主进程：窗口、全局快捷键、IPC、缓存读写
├── preload.js     # 预加载：contextBridge 暴露安全 API
├── index.html     # 渲染层：全部 UI 与阅读 / 伪装 / 搜索逻辑
└── package.json   # 项目配置 + electron-builder 打包配置
```

## 兼容性

当前打包目标为 **macOS · Apple Silicon (arm64)**。如需 Intel (x64) 或 Windows，可在 `package.json` 的 `build.mac.target` / 新增 `build.win` 中扩展架构后重新打包。

## 免责声明

本项目仅供学习娱乐。请合理安排工作与摸鱼时间 🐟。

## License

[MIT](LICENSE)
