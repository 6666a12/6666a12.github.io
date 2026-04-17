# AGENTS.md - 项目文档（供 AI 编码助手阅读）

## 项目概述

本项目是一个托管在 GitHub Pages 上的**个人静态网站**（域名：`6666a12.github.io`）。它是一个零构建（zero-build）的纯前端项目，使用 HTML、CSS 和原生 JavaScript 编写，主要面向中文用户，内容涵盖个人简介、艺术鉴赏、爱好制作等模块。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | HTML5、CSS3、JavaScript (ES6+) |
| 外部库 | jQuery 4.0.0（CDN）、Supabase JS Client v2（CDN） |
| 构建工具 | 无 —— 纯静态网站，无需编译或打包 |
| 包管理器 | npm（存在 `package-lock.json` 但为空，无实际依赖） |
| 部署 | GitHub Pages（`main` 分支自动部署） |

## 项目结构

```
6666a12.github.io/
├── index.html                  # 网站入口 / 主页
├── package-lock.json           # 空的 npm 锁文件
├── .vscode/settings.json       # VS Code 配置：默认预览 /src/articles.html
├── audio/                      # 音频资源（MP3）
├── components/                 # 可复用 JavaScript 组件
│   ├── auth.js                 # 全局认证模块（Supabase Auth）
│   ├── admin-auth.js           # 管理后台认证专用组件
│   ├── audio-player.js         # 音频播放器模块
│   ├── charts-submit.js        # Charts 画廊提交/展示模块
│   ├── clock.js                # 顶部导航栏时钟
│   └── Hash.js                 # 基于 Hash 的前端路由
├── css/                        # 样式表
│   ├── main.css                # 全局样式
│   ├── audio.css               # 音频播放器样式
│   ├── auth.css                # 顶部认证状态样式
│   ├── admin.css               # 认证页面（admin.html）样式
│   ├── log-in.css              # 遗留的登录表单样式
│   ├── minecraft.css           # 爱好制作/画廊页面样式
│   └── submit.css              # 内容提交页样式
├── pic/                        # 图片资源
├── src/                        # 子页面 HTML
│   ├── admin.html              # 登录/注册/用户中心（SPA）
│   ├── home.html               # 网站简介
│   ├── articles.html           # 艺术鉴赏（含 Hash Router）
│   ├── minecraft.html          # 爱好制作 / GitHub Charts 画廊（需登录）
│   ├── minecraft-legacy.html   # 旧版 Charts 画廊（Supabase，Hash Router）
│   ├── submit.html             # 提交新内容到 GitHub Charts（原 666.html）
│   ├── submit-legacy.html      # 旧版提交页（Supabase Charts）
│   ├── update.html             # 更新日志
│   ├── arrange.html            # 空文件（占位）
│   └── charts.html             # 空文件（占位）
└── md/                         # 项目文档
    ├── AGENTS.md               # 本文件
    ├── AUTH_SETUP.md           # 认证系统配置指南
    ├── DATABASE_SETUP.md       # Supabase 数据库设置 SQL
    ├── CORS_SETUP_DETAILED.md  # CORS 配置详细步骤
    ├── CORS_TROUBLESHOOTING.md # CORS 问题排查
    ├── SUPABASE_CLI_CORS.md    # 通过 CLI 配置 CORS
    └── SUPABASE_UI_GUIDE.md    # Supabase 界面导航指南
```

## 架构细节

### 1. 页面与导航

所有页面共享相同的顶部导航栏结构，主要链接如下：

- **主页** → `index.html`
- **网站简介** → `src/home.html`
- **艺术鉴赏** → `src/articles.html`
- **爱好制作** → `src/minecraft.html`
- **随如🖊 / 投喂** → `#blog` / `#donation`（未实现，带 `undo` 类标记）

页面间通过相对路径跳转。根目录文件引用资源时不带前导斜杠；`src/` 下的文件引用上级资源时使用 `../`。

### 2. 前端路由（HashRouter）

`components/Hash.js` 提供了一个基于 URL Hash 的轻量级路由：`HashRouter`。

- 路由格式：`#/path`
- 使用 `<template>` 标签定义页面片段
- 切换页面时有 200ms 的淡入淡出过渡
- 支持 `isdirty` 状态拦截（未保存数据时弹出确认框）

使用路由的页面：`admin.html`、`articles.html`、`minecraft.html`。

### 3. 认证系统

认证功能基于 **Supabase Auth**，核心文件是 `components/auth.js`。

**功能特性：**
- 邮箱/密码注册与登录
- 会话 24 小时自动过期（`SESSION_TIMEOUT = 24 * 60 * 60 * 1000`）
- 多标签页状态实时同步（`BroadcastChannel` + `localStorage`）
- 登录时自动在 Supabase `User` 表中记录/更新用户数据
- 所有页面顶部导航栏实时显示登录状态

**硬编码的 Supabase 配置（认证）：**
```javascript
SUPABASE_URL: 'https://diblhuossmbwbwylmnye.supabase.co'
SUPABASE_ANON_KEY: 'sb_publishable_hwUuS2OHWH_OPkAExyQUYA_uqTdNLW6'
```

**相关组件：**
- `components/auth.js` — 全局认证状态管理
- `components/admin-auth.js` — `admin.html` 内的表单处理与路由守卫
- `css/auth.css` — 顶部导航栏认证状态的统一样式

### 4. 音频播放器

`components/audio-player.js` 实现了一个跨页面状态同步的音频播放器。

- 默认播放列表包含 5 首本地 MP3
- 支持播放/暂停、上一首/下一首、进度拖拽
- 通过 `localStorage` 保存并恢复播放位置、音量、播放状态
- 多标签页间通过 `storage` 事件同步播放状态

### 5. Charts 画廊与提交系统

`minecraft.html` 内嵌了一个名为 **Charts** 的内容画廊，展示通过 `submit.html` 上传到 GitHub 的用户内容。

- 展示逻辑：`components/github-charts.js`
- 每页展示 **1 条**内容（`ITEMS_PER_PAGE = 1`）
- **查看画廊需要登录**
- 内容提交在独立的 `submit.html` 页面

旧版 Supabase Charts（`minecraft-legacy.html` + `submit-legacy.html`）仍保留备份，使用 `components/charts-submit.js`。

**注意：Charts 系统使用了另一个独立的 Supabase 项目：**
```javascript
SUPABASE_URL: 'https://czhmbfiqbtcqwdnoyzxl.supabase.co'
SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```
数据表名：`submissions`。

### 6. 时钟组件

`components/clock.js` 在顶部导航栏显示实时数字时钟，使用 `requestAnimationFrame` 每秒更新。

## 开发规范

### 文件组织
- HTML：根目录放入口页，`src/` 放子页面
- CSS：`main.css` 负责全局，其他按页面/组件拆分
- JS：可复用逻辑放在 `components/`，页面特有逻辑内联在 HTML 底部
- 资源：音频放 `audio/`，图片放 `pic/`

### 路径规范
- 统一使用相对路径
- `src/` 内页面引用上级资源：`../css/main.css`、`../components/auth.js`
- 根目录页面引用资源：`css/main.css`、`pic/bg.jpg`
- 统一使用正斜杠 `/`

### 代码风格
- **注释与 UI 文本**：中文
- **变量/函数名**：英文，camelCase
- **类名**：PascalCase（如 `HashRouter`、`AudioPlayer`）
- **缩进**：4 个空格
- **引号与分号**：不强制，现有代码混合使用

### CSS 约定
- ID 选择器：camelCase 或描述性命名，如 `#audiom`、`#trackinfo`
- 类选择器：kebab-case，如 `.topmenu`、`.bottom-bar`
- 常用工具类：
  - `.highlight` — 当前导航项高亮（dodgerblue 背景）
  - `.undo` — 未完成功能（aquamarine 颜色）
  - `.breathe` — 呼吸动画
  - `.flipInY` / `.flipInX` — 3D 翻转动画

## 构建与测试

### 构建命令
**无。** 本项目是零构建的纯静态网站，直接通过浏览器打开 HTML 文件即可运行。

### 本地测试
1. 直接用浏览器打开 `index.html`
2. 或使用 VS Code 的 Live Preview 扩展（已配置默认预览 `/src/articles.html`）
3. 或使用任意本地静态服务器（如 `npx serve`、Python `http.server`）

### 手动测试清单
- [ ] 各页面导航链接可正常跳转
- [ ] 音频播放器可播放、暂停、切歌、拖拽进度
- [ ] 时钟显示正确时间
- [ ] Hash 路由页面（admin、articles、minecraft-legacy）能正常切换视图
- [ ] 认证流程：注册 → 登录 → 顶部显示用户图标 → 退出 → 状态同步
- [ ] 24 小时过期机制：可手动修改 `localStorage` 的 `auth_login_time` 测试
- [ ] Charts 画廊：登录后可在 `minecraft.html` 查看，未登录显示提示
- [ ] 提交页：`submit.html`（根目录）可上传标题、封面和谱面 zip

## 部署流程

1. 将修改推送至 GitHub `main` 分支
2. GitHub Pages 自动部署
3. 线上地址：`https://6666a12.github.io`

无需任何构建步骤或 CI/CD 配置。

## 安全与隐私

1. **Supabase 凭据**：`anon` key 和 URL 直接硬编码在 JS 文件中。这是 Supabase 客户端库的标准做法（anon key 是公开的），但应确保数据库表启用了 **Row Level Security (RLS)**。
2. **会话管理**：本地实现了 24 小时强制过期，结合 Supabase 自身的 token 刷新机制。
3. **CORS**：Supabase 项目中必须将 `https://6666a12.github.io` 加入 Allowed Origins，否则认证和数据库请求会失败。详细配置参见 `md/CORS_SETUP_DETAILED.md`。
4. **HTTPS**：GitHub Pages 默认强制 HTTPS。

## 已知状态与注意事项

- `src/arrange.html` 和 `src/charts.html` 当前是空文件，仅作为占位。
- `package-lock.json` 为空，项目不依赖任何 npm 包。
- 认证系统依赖 Supabase `User` 自定义表，若未创建会导致登录时控制台报错但不阻塞登录流程。建表 SQL 见 `md/DATABASE_SETUP.md`。
- 项目存在**两个独立的 Supabase 项目**：一个用于用户认证，另一个用于 Charts 内容存储。修改配置时需区分清楚。
