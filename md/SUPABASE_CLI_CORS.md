# 使用 Supabase CLI 配置 CORS

如果界面找不到 CORS 设置，可以使用 Supabase CLI 配置。

## 方法 1: 使用 Supabase CLI（推荐开发者）

### 步骤 1: 安装 CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (使用 scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 或下载安装包
# https://github.com/supabase/cli/releases
```

### 步骤 2: 登录 CLI

```bash
supabase login
```

会打开浏览器让你授权。

### 步骤 3: 链接项目

```bash
# 进入你的项目文件夹（或任意文件夹）
cd your-project-folder

# 链接到远程项目
supabase link --project-ref diblhuossmbwbwylmnye
```

### 步骤 4: 下载配置

```bash
supabase config pull
```

这会创建 `supabase/config.toml` 文件。

### 步骤 5: 编辑配置

打开 `supabase/config.toml`，找到或添加：

```toml
[api]
enabled = true
port = 54321
# 添加 CORS 配置
extra_headers = [
    "Access-Control-Allow-Origin: https://6666a12.github.io",
    "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers: Authorization, Content-Type, apikey, x-client-info"
]
```

### 步骤 6: 推送配置

```bash
supabase config push
```

## 方法 2: 直接在代码中处理（临时方案）

如果无法配置 Supabase CORS，可以在代码中添加代理：

### 修改 components/auth.js

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://diblhuossmbwbwylmnye.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_hwUuS2OHWH_OPkAExyQUYA_uqTdNLW6',
    // 添加代理配置
    USE_PROXY: false,  // 改为 true 启用代理
    PROXY_URL: 'https://your-cors-proxy.herokuapp.com/'
};

// 如果使用代理
async function initSupabase() {
    const supabaseLib = supabase || global.supabase;
    
    const options = {};
    
    if (CONFIG.USE_PROXY) {
        options.global = {
            fetch: (url, options) => {
                // 通过代理发送请求
                const proxyUrl = CONFIG.PROXY_URL + url;
                return fetch(proxyUrl, options);
            }
        };
    }
    
    state.supabaseClient = supabaseLib.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY,
        options
    );
    // ...
}
```

## 方法 3: 使用 Cloudflare Worker 代理

创建一个免费的代理服务：

### 步骤 1: 注册 Cloudflare
https://dash.cloudflare.com/sign-up

### 步骤 2: 创建 Worker

1. 进入 Workers & Pages
2. 创建 Service
3. 粘贴以下代码：

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 只允许你的域名
    const allowedOrigins = ['https://6666a12.github.io'];
    const origin = request.headers.get('Origin');
    
    if (!allowedOrigins.includes(origin)) {
      return new Response('CORS not allowed', { status: 403 });
    }
    
    // 转发到 Supabase
    const targetUrl = 'https://diblhuossmbwbwylmnye.supabase.co' + url.pathname + url.search;
    
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    const response = await fetch(newRequest);
    
    // 添加 CORS 头
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey');
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  }
};
```

### 步骤 3: 部署并更新代码

获取 Worker URL（如 `https://your-proxy.your-subdomain.workers.dev`），然后修改 auth.js：

```javascript
const CONFIG = {
    // 使用代理地址代替直接连接
    SUPABASE_URL: 'https://your-proxy.your-subdomain.workers.dev',
    SUPABASE_ANON_KEY: 'sb_publishable_hwUuS2OHWH_OPkAExyQUYA_uqTdNLW6'
};
```

## 最简单的解决方案

如果以上都太复杂，**建议直接联系 Supabase 支持**：

1. 发邮件到：support@supabase.com
2. 内容模板：

```
Subject: CORS Configuration Issue

Project ID: diblhuossmbwbwylmnye

I can't find the API/CORS settings in the dashboard. 
I need to add https://6666a12.github.io to allowed origins.

Can you help configure this or point me to the correct location?

Thank you!
```

他们通常会在 24 小时内回复。
