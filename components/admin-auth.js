// Admin Auth Component - 管理后台认证专用组件
const AdminAuth = (function() {
    let router = null;
    let sessionTimer = null;
    
    // 初始化
    function init(routerInstance) {
        router = routerInstance;
        
        // 覆盖 auth.js 中的 supabase 配置
        const SUPABASE_URL = 'https://diblhuossmbwbwylmnye.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_hwUuS2OHWH_OPkAExyQUYA_uqTdNLW6';
        
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.Auth._supabase = supabaseClient;
    }
    
    // 查看返回地址（不清除）
    function peekReturnUrl() {
        return localStorage.getItem('login_return_url');
    }
    
    // 获取并清除返回地址
    function getReturnUrl() {
        const url = localStorage.getItem('login_return_url');
        localStorage.removeItem('login_return_url');
        return url;
    }
    
    // 路由守卫 - 登录页
    function routeLogin() {
        if (Auth.isLoggedIn()) {
            const returnUrl = getReturnUrl();
            if (returnUrl) {
                window.location.href = returnUrl;
            } else {
                router.push('/user');
            }
            return false;
        }
        return true;
    }
    
    // 路由守卫 - 注册页
    function routeRegister() {
        if (Auth.isLoggedIn()) {
            const returnUrl = getReturnUrl();
            if (returnUrl) {
                window.location.href = returnUrl;
            } else {
                router.push('/user');
            }
            return false;
        }
        return true;
    }
    
    // 路由守卫 - 用户中心
    function routeUser() {
        if (!Auth.isLoggedIn()) {
            router.push('/login');
            return false;
        }
        return true;
    }
    
    // 处理登录
    async function handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-submit');
        
        setButtonLoading(submitBtn, true, '登录中...');
        
        try {
            await Auth.login(email, password);
            showMessage('login-message', '✅ 登录成功！', false);
            
            setTimeout(() => {
                const returnUrl = getReturnUrl();
                if (returnUrl) {
                    window.location.href = returnUrl;
                } else {
                    router.push('/user');
                }
            }, 500);
        } catch (error) {
            console.error('登录失败:', error);
            showMessage('login-message', '❌ ' + getErrorMessage(error), true);
            setButtonLoading(submitBtn, false, '登录');
        }
        
        return false;
    }
    
    // 处理注册
    async function handleRegister(event) {
        event.preventDefault();
        
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        const submitBtn = document.getElementById('reg-submit');
        
        if (password !== confirm) {
            showMessage('register-message', '❌ 两次输入的密码不一致！', true);
            return false;
        }
        
        if (password.length < 6) {
            showMessage('register-message', '❌ 密码至少需要6个字符！', true);
            return false;
        }
        
        setButtonLoading(submitBtn, true, '注册中...');
        
        try {
            await Auth.register(email, password);
            showMessage('register-message', '✅ 注册成功！请检查邮箱验证账户。', false);
            event.target.reset();
            
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            console.error('注册失败:', error);
            showMessage('register-message', '❌ ' + getErrorMessage(error), true);
            setButtonLoading(submitBtn, false, '注册');
        }
        
        return false;
    }
    
    // 处理退出
    async function handleLogout() {
        const btn = document.getElementById('logout-btn');
        setButtonLoading(btn, true, '退出中...');
        
        try {
            await Auth.logout();
            router.push('/login');
        } catch (error) {
            console.error('退出失败:', error);
            showMessage('user-message', '❌ 退出失败: ' + error.message, true);
            setButtonLoading(btn, false, '退出登录');
        }
    }
    
    // 设置用户中心页面
    function setupUserPage() {
        const user = Auth.getUser();
        if (!user) return;
        
        document.getElementById('user-email').textContent = user.email || '-';
        document.getElementById('user-id').textContent = user.id || '-';
        
        const loginTime = Auth.getLoginTime();
        document.getElementById('user-login-time').textContent = loginTime 
            ? new Date(loginTime).toLocaleString('zh-CN')
            : '-';
        
        document.getElementById('user-last-signin').textContent = user.last_sign_in_at 
            ? new Date(user.last_sign_in_at).toLocaleString('zh-CN')
            : '-';
        
        document.getElementById('user-created').textContent = user.created_at 
            ? new Date(user.created_at).toLocaleString('zh-CN')
            : '-';
        
        updateSessionDuration();
        
        if (sessionTimer) clearInterval(sessionTimer);
        sessionTimer = setInterval(updateSessionDuration, 1000);
    }
    
    // 更新会话时长显示
    function updateSessionDuration() {
        const durationEl = document.getElementById('user-session-duration');
        if (durationEl) {
            durationEl.textContent = Auth.getSessionDuration();
        }
        
        const remainingEl = document.getElementById('user-remaining-time');
        if (remainingEl) {
            remainingEl.textContent = Auth.getRemainingTimeFormatted();
            remainingEl.classList.remove('warning', 'danger');
            
            const remaining = Auth.getRemainingTime();
            if (remaining < 30 * 60 * 1000) {
                remainingEl.classList.add('danger');
            } else if (remaining < 2 * 60 * 60 * 1000) {
                remainingEl.classList.add('warning');
            }
        }
    }
    
    // 清理定时器
    function cleanup() {
        if (sessionTimer) {
            clearInterval(sessionTimer);
            sessionTimer = null;
        }
    }
    
    // 工具函数
    function showMessage(elementId, text, isError) {
        const box = document.getElementById(elementId);
        if (!box) return;
        
        box.textContent = text;
        box.className = 'message ' + (isError ? 'error' : 'success');
        box.style.display = 'block';
    }
    
    function setButtonLoading(btn, loading, text) {
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = `<span class="loading-spinner"></span>${text}`;
        } else {
            btn.disabled = false;
            btn.innerHTML = `<span class="btn-text">${text}</span>`;
        }
    }
    
    function getErrorMessage(error) {
        const messages = {
            'Invalid login credentials': '邮箱或密码错误',
            'Email not confirmed': '邮箱尚未验证，请检查邮箱',
            'User already registered': '该邮箱已注册',
            'Password should be at least 6 characters': '密码至少需要6个字符',
            'Unable to validate email address: invalid format': '邮箱格式不正确',
            'AuthApiError': '认证失败，请稍后重试',
            'Network error': '网络错误，请检查网络连接',
            'Email rate limit exceeded': '请求过于频繁，请稍后再试'
        };
        return messages[error.message] || error.message || '发生错误，请重试';
    }
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', cleanup);
    
    return {
        init,
        handleLogin,
        handleRegister,
        handleLogout,
        setupUserPage,
        routeLogin,
        routeRegister,
        routeUser,
        cleanup
    };
})();
