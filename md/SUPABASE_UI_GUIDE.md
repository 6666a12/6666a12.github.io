# Supabase 新版界面导航指南

## 🔍 找不到 API 选项？

Supabase 最近更新了界面，API 设置可能在不同位置。

## 📍 方案 1: 通过左侧菜单直接访问

### 方法 A - Project Settings 子菜单

1. 登录 https://supabase.com
2. 进入项目 `diblhuossmbwbwylmnye`
3. 看左侧菜单底部，找到 **Project Settings**（齿轮图标 ⚙️）
4. **点击展开** Project Settings（可能会有下拉箭头 ▶）
5. 在展开的子菜单中找：
   - **API** 或
   - **Configuration** → **API** 或
   - **Settings** → **API**

### 方法 B - 直接链接访问

直接在浏览器地址栏输入：
```
https://supabase.com/dashboard/project/diblhuossmbwbwylmnye/settings/api
```

如果上面的不行，试试：
```
https://app.supabase.com/project/diblhuossmbwbwylmnye/settings/api
```

## 📍 方案 2: 通过顶部导航

有些版本的 Supabase 在顶部有导航栏：

1. 进入项目后，看页面顶部
2. 找 **Settings** 或 **Project Settings**
3. 点击后选择 **API**

## 📍 方案 3: 通过 Database/Auth 设置

### CORS 可能在 Database 设置中：

1. 左侧菜单点击 **Database**
2. 找到 **Extensions** 或 **Settings**
3. 查看是否有 CORS 相关选项

### 或者在 Auth 设置中：

1. 左侧菜单点击 **Authentication**
2. 点击 **Settings** 或 **Providers**
3. 查看是否有 CORS/安全相关选项

## 📍 方案 4: 新版侧边栏结构（2024）

Supabase 新版界面结构：

```
📁 Project
   ├── 🏠 Home
   ├── 📊 Table Editor
   ├── 💾 SQL Editor
   ├── 🔌 API Docs
   ├── 📈 Reports
   └── ⚙️ Settings (点击展开)
       ├── General
       ├── Database
       ├── API 👈 在这里！
       ├── Authentication
       ├── Storage
       └── Edge Functions
```

**注意**: Settings 默认可能是折叠的，需要点击展开！

## 📍 方案 5: 搜索功能

Supabase 顶部有搜索框：

1. 按 `Cmd/Ctrl + K` 或点击顶部搜索框
2. 输入 "API" 或 "CORS"
3. 点击搜索结果

## 🎯 快速找到配置项

如果找到了 **API** 页面但找不到 CORS，看看这些位置：

### API 页面内的标签
```
[Project URL] [JWT Settings] [Data API] [Auth Settings] [CORS]
```

CORS 可能在最右侧的标签页。

## 📸 界面截图描述

### 旧版界面 (2023)
```
左侧菜单:
- Home
- Table Editor
- SQL Editor
- ...
- Settings ▼ (展开)
  - General
  - Database
  - API ✓
  - Auth
```

### 新版界面 (2024)
```
左侧菜单:
- Home
- Database ▼
- Auth ▼
- Storage ▼
- Edge Functions
- Logs
- Reports
- Settings ▼ (展开) ← 点击这里
  - General
  - Database
  - API ✓
  - Auth
  - Storage
```

## 🚨 如果还是找不到

### 可能的原因：

1. **权限不足** - 你可能不是项目所有者
   - 解决：联系项目创建者获取权限

2. **界面语言问题** - 尝试切换到英文界面
   - 点击头像 → Preferences → Language → English

3. **浏览器问题** - 尝试：
   - 换浏览器（Chrome/Firefox/Edge）
   - 清除缓存
   - 关闭浏览器插件

4. **项目未初始化** - 新创建的项目可能需要等待几分钟

### 替代方案：使用 SQL 配置

如果界面找不到，可以通过 SQL 设置 CORS：

1. 进入 **SQL Editor**（左侧菜单肯定有）
2. 新建查询
3. 执行以下 SQL（某些配置可能无法通过 SQL 修改）：

```sql
-- 查看当前 CORS 设置
select * from pg_settings where name like '%cors%';

-- 注意：Supabase CORS 通常不能通过 SQL 直接修改
-- 需要使用界面或 config.toml
```

### 联系支持

如果以上都无效：

1. **Supabase Discord**: https://discord.supabase.com/
   - 频道: `#help-and-questions`
   - 描述："Can't find API/CORS settings in dashboard"

2. **截图求助**: 
   - 截图你的左侧菜单
   - 截图 Project Settings 页面
   - 发到 Discord 或 GitHub Discussions

## ✅ 验证项目访问权限

确保你能访问正确的项目：

1. 浏览器地址栏应该包含：
   ```
   diblhuossmbwbwylmnye
   ```

2. 页面顶部应该显示项目名称：
   ```
   Default Project (或你的项目名)
   ```

3. 如果不是，点击项目切换器选择正确项目。
