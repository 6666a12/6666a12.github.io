# Supabase 数据库设置指南

## 1. 创建 User 表

登录 Supabase Dashboard (https://diblhuossmbwbwylmnye.supabase.co)，执行以下 SQL：

```sql
-- 创建 User 表
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    last_active TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_is_online ON "User"(is_online);

-- 启用 RLS (Row Level Security)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看和修改自己的数据
CREATE POLICY "Users can view own data" ON "User"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON "User"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON "User"
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许认证服务在注册时插入数据
CREATE POLICY "Service role can manage all users" ON "User"
    FOR ALL USING (auth.role() = 'service_role');
```

## 2. 创建自动更新 updated_at 的函数

```sql
-- 创建自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 3. 设置 Auth Webhook (可选，用于自动同步用户)

如果你想在用户注册时自动创建 User 表记录，可以设置 webhook：

1. 进入 Authentication > Hooks
2. 添加以下 SQL 触发器：

```sql
-- 当新用户注册时自动创建 User 记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."User" (id, email, created_at, updated_at, login_count)
    VALUES (NEW.id, NEW.email, NEW.created_at, NOW(), 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

## 4. 启用 Email 认证

1. 进入 Authentication > Providers
2. 确保 **Email** 已启用
3. 可选配置：
   - Confirm email: 可以关闭以跳过邮箱验证
   - Secure email change: 建议开启
   - Secure password change: 建议开启

## 5. 配置 CORS (跨域) - 重要！

⚠️ **这是最常见的配置问题，务必正确设置！**

### 快速配置

1. 进入 **Project Settings** → **API** → **CORS**
2. 在 **Allowed Origins** 中添加：
   ```
   https://6666a12.github.io
   ```
3. 点击 **Save**

### 详细步骤

参见 [CORS_SETUP_DETAILED.md](CORS_SETUP_DETAILED.md) 获取完整的图文配置指南。

### 验证配置

配置完成后，在浏览器控制台执行：
```javascript
fetch('https://diblhuossmbwbwylmnye.supabase.co/rest/v1/')
  .then(r => console.log('✅ CORS OK:', r.status))
  .catch(e => console.error('❌ CORS Error:', e));
```

如果显示 `✅ CORS OK: 200`，说明配置成功。

## 6. 测试连接

设置完成后，打开 `src/admin.html` 测试：

1. 注册一个新用户
2. 登录后查看 User 表是否有记录
3. 检查登录时间是否正确记录
4. 等待查看是否超过24小时后自动下线

## 表结构说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键，关联 auth.users |
| email | TEXT | 用户邮箱 |
| created_at | TIMESTAMP | 记录创建时间 |
| updated_at | TIMESTAMP | 最后更新时间 |
| last_login | TIMESTAMP | 本次登录时间 |
| last_active | TIMESTAMP | 最后活跃时间 |
| login_count | INTEGER | 总登录次数 |
| is_online | BOOLEAN | 是否在线 |

## 会话超时说明

- **超时时间**: 24小时 (24 * 60 * 60 * 1000 毫秒)
- **检查频率**: 每分钟检查一次
- **触发条件**: 页面可见性变化时也会检查
- **下线方式**: 自动跳转回登录页并提示"登录已过期"

## 故障排除

### "Failed to save user to database"

检查 RLS 策略是否正确设置，确保用户可以插入自己的数据。

### 登录后 User 表没有数据

检查浏览器控制台的网络请求，查看是否有权限错误。

### 24小时下线不生效

检查 `localStorage` 中的 `auth_login_time` 是否正确设置。
