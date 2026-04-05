# Supabase CORS 跨域问题排查指南

## 🔍 常见问题现象

浏览器控制台出现以下错误：
```
Access to fetch at 'https://diblhuossmbwbwylmnye.supabase.co/auth/v1/token?grant_type=password' 
from origin 'https://6666a12.github.io' has been blocked by CORS policy...
```

或：
```
Network Error
Failed to fetch
```

## ✅ 解决方案

### 方案 1: 配置 Supabase CORS（推荐）

1. 登录 [Supabase Dashboard](https://diblhuossmbwbwylmnye.supabase.co)
2. 进入 **Project Settings** → **API**（左侧菜单）
3. 找到 **CORS (Cross-Origin Resource Sharing)** 部分
4. 在 **Allowed Origins** 中添加：
   ```
   https://6666a12.github.io
   ```
   
   如果有本地开发，也添加：
   ```
   http://localhost:3000
   http://localhost:5500
   http://127.0.0.1:5500
   ```

### 方案 2: 使用通配符（测试环境）

如果方案 1 不生效，可以尝试添加通配符：
```
*
```
⚠️ 注意：生产环境不建议使用通配符

### 方案 3: 检查 API URL 配置

确认代码中使用的 URL 格式正确：

```javascript
// ✅ 正确
const SUPABASE_URL = 'https://diblhuossmbwbwylmnye.supabase.co';

// ❌ 错误 - 不要加尾缀
const SUPABASE_URL = 'https://diblhuossmbwbwylmnye.supabase.co/';
const SUPABASE_URL = 'https://diblhuossmbwbwylmnye.supabase.co/auth/v1';
```

### 方案 4: 检查 Site URL 和 Redirect URLs

1. 进入 **Authentication** → **URL Configuration**
2. 设置以下字段：

| 字段 | 值 |
|------|-----|
| **Site URL** | `https://6666a12.github.io` |
| **Redirect URLs** | `https://6666a12.github.io/src/admin.html` |

### 方案 5: 浏览器缓存问题

有时浏览器缓存会导致 CORS 问题：

1. **强制刷新页面**：`Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
2. **清除浏览器缓存**
3. **使用无痕模式**测试

### 方案 6: 检查网络请求详情

在浏览器开发者工具中检查：

1. 按 `F12` 打开开发者工具
2. 切换到 **Network** 标签
3. 找到失败的请求（红色）
4. 查看 **Headers** → **Response Headers**
   - 应该有 `access-control-allow-origin: https://6666a12.github.io`

## 🛠️ 验证步骤

按顺序执行以下检查：

### 步骤 1: 检查请求 URL
```javascript
// 在浏览器控制台执行
console.log(supabaseClient.supabaseUrl);
// 应该输出: https://diblhuossmbwbwylmnye.supabase.co
```

### 步骤 2: 简单测试请求
```javascript
// 在浏览器控制台测试
fetch('https://diblhuossmbwbwylmnye.supabase.co/rest/v1/')
  .then(r => console.log('CORS OK:', r.status))
  .catch(e => console.error('CORS Error:', e));
```

### 步骤 3: 检查 auth 请求
```javascript
// 测试 auth 端点
fetch('https://diblhuossmbwbwylmnye.supabase.co/auth/v1/settings')
  .then(r => r.json())
  .then(d => console.log('Auth settings:', d))
  .catch(e => console.error('Auth CORS Error:', e));
```

## 📝 完整的 config.toml 参考（Edge Functions 配置）

如果你使用 Edge Functions，在项目根目录创建 `supabase/config.toml`：

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://localhost:54321"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[auth]
site_url = "https://6666a12.github.io"
additional_redirect_urls = ["https://6666a12.github.io/src/admin.html"]
```

## 🚨 如果以上都无效

### 临时解决方案：使用代理

在 `components/auth.js` 中添加代理配置：

```javascript
const state.supabaseClient = supabaseLib.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        global: {
            headers: {
                'X-Client-Info': 'supabase-js/2.x'
            }
        }
    }
);
```

### 联系 Supabase 支持

如果配置正确仍然有问题：
1. 在 [Supabase Discord](https://discord.supabase.com/) 寻求帮助
2. 或提交 GitHub Issue: https://github.com/supabase/supabase/issues

## ✅ 成功验证标志

配置正确后，浏览器网络请求应该显示：

```
Status: 200 OK
access-control-allow-origin: https://6666a12.github.io
access-control-allow-methods: GET, POST, OPTIONS
```

## 🔗 参考链接

- [Supabase CORS 文档](https://supabase.com/docs/guides/api/cors)
- [GitHub Pages 自定义域名 CORS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
