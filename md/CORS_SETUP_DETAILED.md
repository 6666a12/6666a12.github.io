# Supabase CORS 配置详细步骤

## 📍 进入配置页面

1. 打开浏览器，访问你的 Supabase 项目：
   ```
   https://supabase.com/dashboard/project/diblhuossmbwbwylmnye/settings/api
   ```

2. 或者手动导航：
   - 登录 https://supabase.com
   - 选择项目 `diblhuossmbwbwylmnye`
   - 左侧菜单点击 **Project Settings** → **API**

## 🔧 配置 Allowed Origins

### 步骤 1: 找到 CORS 配置区域

在 API 设置页面中，向下滚动找到 **"CORS (Cross-Origin Resource Sharing)"** 部分。

### 步骤 2: 添加你的域名

在 **Allowed Origins** 输入框中，添加以下内容：

```
https://6666a12.github.io
```

**注意**：
- 不要加斜杠 `/`
- 必须包含 `https://`
- 必须包含完整的子域名

### 步骤 3: 本地开发配置（可选）

如果你在本地测试，也需要添加本地地址：

```
https://6666a12.github.io
http://localhost:3000
http://localhost:5500
http://127.0.0.1:5500
```

每个地址占一行，或者逗号分隔（取决于界面）。

### 步骤 4: 保存配置

点击 **Save** 按钮保存更改。

## 🔄 配置 Auth URL

CORS 问题解决后，还需要配置 Auth 的 URL：

### 步骤 1: 进入 Auth 设置

左侧菜单点击 **Authentication** → **URL Configuration**

### 步骤 2: 设置 Site URL

找到 **Site URL** 字段，填入：
```
https://6666a12.github.io
```

### 步骤 3: 设置 Redirect URLs

找到 **Redirect URLs**（或 Additional Redirect URLs），添加：
```
https://6666a12.github.io/src/admin.html
https://6666a12.github.io/src/admin.html#/user
```

### 步骤 4: 保存

点击 **Save** 按钮。

## 🧪 测试配置

### 方法 1: 浏览器控制台测试

打开你的网站 https://6666a12.github.io，按 `F12` 打开控制台，粘贴：

```javascript
// 测试 1: 简单的 REST API 请求
fetch('https://diblhuossmbwbwylmnye.supabase.co/rest/v1/')
  .then(r => console.log('✅ REST API CORS OK:', r.status))
  .catch(e => console.error('❌ REST API CORS Error:', e));

// 测试 2: Auth 设置端点
fetch('https://diblhuossmbwbwylmnye.supabase.co/auth/v1/settings')
  .then(r => r.json())
  .then(d => console.log('✅ Auth CORS OK:', d))
  .catch(e => console.error('❌ Auth CORS Error:', e));
```

如果显示 `✅ OK`，说明 CORS 配置成功。

### 方法 2: 查看网络请求头

1. 按 `F12` 打开开发者工具
2. 切换到 **Network**（网络）标签
3. 刷新页面
4. 找到任意 Supabase 请求（如 `token` 或 `settings`）
5. 点击请求，查看 **Response Headers**
6. 确认包含：
   ```
   access-control-allow-origin: https://6666a12.github.io
   ```

## 🚨 常见问题

### 问题 1: 配置后仍提示 CORS 错误

**原因**: 浏览器缓存了旧的 CORS 响应

**解决**:
1. 强制刷新：`Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
2. 清除浏览器缓存
3. 使用无痕/隐私模式测试

### 问题 2: 通配符 * 不生效

Supabase 可能不允许某些端点使用通配符。建议明确指定域名。

### 问题 3: GitHub Pages 域名错误

确认你的 GitHub Pages 地址是：
- ✅ `https://6666a12.github.io`
- ❌ 不是 `http://6666a12.github.io`（缺少 https）
- ❌ 不是 `https://www.6666a12.github.io`（多了 www）

### 问题 4: 子路径问题

如果你的网站部署在子路径，确保完整路径：
- ✅ `https://6666a12.github.io`
- ❌ 不是 `https://6666a12.github.io/`（结尾斜杠）

## 📝 配置检查清单

- [ ] 已进入 Project Settings → API
- [ ] 已添加 `https://6666a12.github.io` 到 Allowed Origins
- [ ] 已点击 Save 保存
- [ ] 已进入 Authentication → URL Configuration
- [ ] 已设置 Site URL 为 `https://6666a12.github.io`
- [ ] 已添加 Redirect URLs
- [ ] 已清除浏览器缓存
- [ ] 已在无痕模式测试

## 🔗 相关配置截图位置

| 配置项 | 路径 |
|--------|------|
| CORS Allowed Origins | Project Settings → API → CORS |
| Site URL | Authentication → URL Configuration → Site URL |
| Redirect URLs | Authentication → URL Configuration → Redirect URLs |

## 📞 如果仍有问题

1. **检查精确错误信息**：
   在控制台复制完整的 CORS 错误信息

2. **在 Supabase 官方 Discord 求助**：
   https://discord.supabase.com/
   频道：`#help-and-questions`

3. **创建 GitHub Issue**：
   https://github.com/supabase/supabase/issues

4. **发送邮件给支持团队**：
   support@supabase.com
