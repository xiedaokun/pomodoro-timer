# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指引。

## 项目概览

苹果风格桌面端番茄钟，基于 Electron 构建。无边框透明窗口，毛玻璃效果，环形进度条，macOS 风格 UI。

## 常用命令

- `npm start` — 开发模式运行应用
- `npm run build` — 通过 electron-builder 构建 Windows NSIS 安装包
- 未配置测试和代码检查工具

## 架构

```
main.js          Electron 主进程 — 创建无边框 BrowserWindow、系统托盘、IPC 处理器
  └─ preload.js  上下文桥接 — 暴露 window.api（最小化、隐藏、关闭、切换置顶、更新标题）
  └─ index.html  界面 + 全部 CSS + Tailwind CDN — 内联 <style> 块，Tailwind 配置含自定义 apple 配色
  └─ renderer.js 渲染逻辑 — IIFE 封装的计时器状态机、DOM 操作、Web Audio API 提示音
```

**IPC 通信流程：** 渲染进程 → `window.api.*`（preload）→ `ipcMain` 处理器（主进程）。`toggleAlwaysOnTop` 使用 `invoke/handle`（有返回值）；其余使用 `send/on`（单向触发）。

## 关键模式

- **CSS：** Tailwind 从 CDN 加载（非本地安装）。暗色模式通过 Tailwind `"class"` 策略实现 — 在 `<body>` 上添加/移除 `"dark"` 类名切换。所有自定义 CSS 位于 `index.html` 的 `<style>` 块中（毛玻璃用 `backdrop-filter`、SVG 环形进度条、弹性动画）。
- **状态管理：** 纯原生 JS 变量，封装在 IIFE 闭包中 — 无框架。计时器使用 `Date.now()` 差值计算，防止时间漂移。
- **计时模式：** `work`（25 分钟）、`short`（5 分钟）、`long`（15 分钟）。专注结束后自动切换到休息；每 4 次专注触发长休息。
- **音频：** 通过 Web Audio API 合成三音符提示音 — 无音频文件。
- **窗口：** 无边框 + 透明。自定义标题栏使用 `-webkit-app-region: drag` 实现拖拽。关闭时隐藏到托盘。托盘图标由 SVG 程序化生成。
- **安全：** `contextIsolation: true`，`nodeIntegration: false`。
