# 认证系统配置指南

## 概述

网站已集成 **Supabase Authentication** 提供完整的用户认证功能，包括：

- ✅ 用户注册（邮箱验证可选）
- ✅ 用户登录
- ✅ 会话持久化（24小时自动过期）
- ✅ 用户个人中心（显示登录时长、剩余时间）
- ✅ 安全退出
- ✅ 用户数据存储在 Supabase `User` 表中

## 配置信息

项目已配置以下 Supabase 连接信息：

```javascript
SUPABASE_URL: 'https://diblhuossmbwbwylmnye.supabase.co'
SUPABASE_ANON_KEY: 'sb_publishable_hwUuS2OHWH_OPkAExyQUYA_uqTdNLW6'
```

## 数据库设置（必须）

⚠️ **重要**: 需要在 Supabase Dashboard 中创建 `User` 表才能正常使用！

### 快速设置

1. 访问 https://diblhuossmbwbwylmnye.supabase.co
2. 进入 SQL Editor
3. 执行 `DATABASE_SETUP.md` 中的 SQL 语句

### 表结构

```sql
CREATE TABLE "User" (
    id UUID PRIMARY KEY,           -- 用户ID
    email TEXT,                     -- 邮箱
    created_at TIMESTAMP,          -- 创建时间
    updated_at TIMESTAMP,          -- 更新时间
    last_login TIMESTAMP,          -- 本次登录时间
    last_active TIMESTAMP,         -- 最后活跃时间
    login_count INTEGER,           -- 登录次数
    is_online BOOLEAN              -- 是否在线
);
```

## 功能说明

### 登录页面 (`#/login`)

- 邮箱/密码登录
- 表单验证
- 错误提示（中文）
- 登录成功后自动跳转到用户中心
- **登录时间自动记录到数据库**

### 注册页面 (`#/register`)

- 邮箱/密码注册
- 密码确认验证
- 密码最小长度：6字符
- 注册后提示邮箱验证（如果启用）

### 用户中心 (`#/user`)

- 显示用户信息（邮箱、ID）
- **本次登录时间**
- **已登录时长（实时更新）**
- **剩余有效时间（24小时倒计时）**
- 上次登录时间
- 账户创建时间
- 退出登录按钮

### 24小时自动下线

- 会话有效期：**24小时**
- 检查频率：每分钟
- 剩余时间显示：实时更新
- 过期后：自动跳转登录页并提示

## 安全特性

1. **密码安全**: 密码通过 HTTPS 直接传输到 Supabase
2. **会话管理**: 24小时自动过期，防止长期未关闭的会话
3. **Row Level Security**: 用户只能访问自己的数据
4. **自动同步**: 多标签页间状态实时同步

## 测试清单

- [ ] 使用有效邮箱注册新账户
- [ ] 登录后检查 User 表是否有记录
- [ ] 检查登录时间是否正确显示
- [ ] 检查已登录时长是否正常计数
- [ ] 检查剩余时间是否倒计时
- [ ] 刷新页面后检查会话是否保持
- [ ] 测试退出登录功能
- [ ] 等待24小时或手动修改 localStorage 测试自动下线

## 故障排除

### 无法登录/注册

1. 检查网络连接
2. 检查浏览器控制台错误信息
3. 确认 Supabase 服务状态

### User 表没有数据

1. 检查是否执行了 DATABASE_SETUP.md 中的 SQL
2. 检查 RLS 策略是否正确设置
3. 查看浏览器网络请求的返回错误

### 登录时间不显示

1. 检查 localStorage 中是否有 `auth_login_time`
2. 检查 User 表的 `last_login` 字段

## 相关文档

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - 数据库详细设置
- [AGENTS.md](AGENTS.md) - 项目架构文档
