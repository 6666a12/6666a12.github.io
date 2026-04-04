// ============================================
// Global Auth Module - 全局认证模块
// 提供跨页面的用户状态同步和会话管理
// ============================================

(function(global) {
    'use strict';

    // ============================================
    // 配置
    // ============================================
    const CONFIG = {
        SUPABASE_URL: 'https://diblhuossmbwbwylmnye.supabase.co',
        SUPABASE_ANON_KEY: 'sb_publishable_hwUuS2OHWH_OPkAExyQUYA_uqTdNLW6',
        STORAGE_KEY: 'auth_user',
        LOGIN_TIME_KEY: 'auth_login_time',
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000  // 24小时超时 (毫秒)
    };

    // ============================================
    // 状态管理
    // ============================================
    let state = {
        currentUser: null,
        loginTime: null,
        supabaseClient: null,
        initialized: false,
        listeners: []
    };

    // BroadcastChannel 用于跨页面通信
    let channel = null;

    // ============================================
    // 初始化
    // ============================================
    async function init(customConfig) {
        if (state.initialized) return true;
        
        // 合并自定义配置
        if (customConfig) {
            Object.assign(CONFIG, customConfig);
        }

        // 尝试从 localStorage 恢复用户和登录时间
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            const storedLoginTime = localStorage.getItem(CONFIG.LOGIN_TIME_KEY);
            
            if (stored && storedLoginTime) {
                const loginTime = parseInt(storedLoginTime);
                const now = Date.now();
                
                // 检查是否超过24小时
                if (now - loginTime > CONFIG.SESSION_TIMEOUT) {
                    console.log('[Auth] Session expired (>24h), logging out');
                    clearStoredData();
                } else {
                    state.currentUser = JSON.parse(stored);
                    state.loginTime = loginTime;
                }
            }
        } catch (e) {
            console.warn('[Auth] Failed to restore user from storage:', e);
        }

        // 初始化 BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
            channel = new BroadcastChannel('auth-channel');
            channel.onmessage = handleBroadcastMessage;
        }

        // 监听 storage 事件
        window.addEventListener('storage', handleStorageEvent);

        // 启动会话超时检查器
        startSessionChecker();

        // 如果页面上有 Supabase，初始化客户端
        await initSupabase();

        state.initialized = true;
        notifyListeners();
        
        return true;
    }

    // ============================================
    // Supabase 初始化
    // ============================================
    async function initSupabase() {
        if (typeof supabase === 'undefined' && typeof global.supabase === 'undefined') {
            console.warn('[Auth] Supabase not loaded, auth features limited to local storage');
            return;
        }

        const supabaseLib = supabase || global.supabase;
        
        try {
            state.supabaseClient = supabaseLib.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_ANON_KEY
            );

            // 监听认证状态变化
            state.supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('[Auth] Supabase state change:', event);
                
                if (event === 'SIGNED_IN' && session) {
                    handleSignIn(session.user);
                } else if (event === 'SIGNED_OUT') {
                    handleSignOut();
                } else if (event === 'USER_UPDATED' && session) {
                    setUser(session.user);
                } else if (event === 'INITIAL_SESSION' && session) {
                    // 检查登录时间是否过期
                    checkSessionTimeout();
                }
            });

            // 检查当前会话
            const { data: { session } } = await state.supabaseClient.auth.getSession();
            if (session) {
                // 检查是否过期
                if (isSessionExpired()) {
                    console.log('[Auth] Initial session expired');
                    await logout();
                } else {
                    state.currentUser = session.user;
                    notifyListeners();
                }
            }

        } catch (err) {
            console.error('[Auth] Failed to initialize Supabase:', err);
        }
    }

    // ============================================
    // 会话超时检查
    // ============================================
    function startSessionChecker() {
        // 每分钟检查一次
        setInterval(() => {
            checkSessionTimeout();
        }, 60 * 1000);
        
        // 页面可见性变化时也检查
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkSessionTimeout();
            }
        });
    }

    function checkSessionTimeout() {
        if (state.currentUser && isSessionExpired()) {
            console.log('[Auth] Session timeout detected, logging out');
            logout();
            // 通知用户
            alert('您的登录已过期（超过24小时），请重新登录。');
            // 重定向到登录页
            if (window.location.pathname.includes('admin.html')) {
                if (typeof router !== 'undefined') {
                    router.push('/login');
                }
            }
        }
    }

    function isSessionExpired() {
        if (!state.loginTime) return true;
        return Date.now() - state.loginTime > CONFIG.SESSION_TIMEOUT;
    }

    // ============================================
    // 登录/登出处理
    // ============================================
    async function handleSignIn(user) {
        const now = Date.now();
        state.loginTime = now;
        
        // 保存到 User 表
        await saveUserToDatabase(user, now);
        
        // 记录登录时间
        localStorage.setItem(CONFIG.LOGIN_TIME_KEY, now.toString());
        
        setUser(user);
    }

    function handleSignOut() {
        state.loginTime = null;
        clearStoredData();
        setUser(null);
    }

    // ============================================
    // 数据库操作 - 保存用户数据
    // ============================================
    async function saveUserToDatabase(user, loginTime) {
        if (!state.supabaseClient || !user) return;

        try {
            // 检查 User 表是否存在该用户
            const { data: existingUser, error: fetchError } = await state.supabaseClient
                .from('User')
                .select('*')
                .eq('id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                // PGRST116 = 未找到记录，其他错误需要处理
                console.warn('[Auth] Error checking existing user:', fetchError);
            }

            const userData = {
                id: user.id,
                email: user.email,
                last_login: new Date(loginTime).toISOString(),
                login_count: existingUser ? (existingUser.login_count || 0) + 1 : 1,
                updated_at: new Date().toISOString()
            };

            if (existingUser) {
                // 更新现有用户
                const { error: updateError } = await state.supabaseClient
                    .from('User')
                    .update(userData)
                    .eq('id', user.id);
                
                if (updateError) throw updateError;
                console.log('[Auth] User login time updated in database');
            } else {
                // 插入新用户
                userData.created_at = new Date().toISOString();
                const { error: insertError } = await state.supabaseClient
                    .from('User')
                    .insert([userData]);
                
                if (insertError) throw insertError;
                console.log('[Auth] New user saved to database');
            }
        } catch (err) {
            console.error('[Auth] Failed to save user to database:', err);
        }
    }

    // ============================================
    // 更新用户在线状态
    // ============================================
    async function updateOnlineStatus() {
        if (!state.supabaseClient || !state.currentUser) return;
        
        try {
            await state.supabaseClient
                .from('User')
                .update({ 
                    last_active: new Date().toISOString(),
                    is_online: true 
                })
                .eq('id', state.currentUser.id);
        } catch (err) {
            console.warn('[Auth] Failed to update online status:', err);
        }
    }

    // ============================================
    // 事件处理
    // ============================================
    function handleBroadcastMessage(event) {
        if (event.data && event.data.type === 'AUTH_CHANGE') {
            console.log('[Auth] Received broadcast:', event.data);
            state.currentUser = event.data.user;
            state.loginTime = event.data.loginTime;
            notifyListeners();
        }
    }

    function handleStorageEvent(e) {
        if (e.key === CONFIG.STORAGE_KEY) {
            const user = e.newValue ? JSON.parse(e.newValue) : null;
            state.currentUser = user;
            notifyListeners();
        } else if (e.key === CONFIG.LOGIN_TIME_KEY) {
            state.loginTime = e.newValue ? parseInt(e.newValue) : null;
        }
    }

    // ============================================
    // 用户状态管理
    // ============================================
    function setUser(user) {
        state.currentUser = user;
        
        // 广播给其他页面
        if (channel) {
            channel.postMessage({
                type: 'AUTH_CHANGE',
                user: user,
                loginTime: state.loginTime,
                timestamp: Date.now()
            });
        }
        
        // 保存到 localStorage
        if (user) {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(user));
            if (state.loginTime) {
                localStorage.setItem(CONFIG.LOGIN_TIME_KEY, state.loginTime.toString());
            }
        } else {
            clearStoredData();
        }
        
        notifyListeners();
    }

    function clearStoredData() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        localStorage.removeItem(CONFIG.LOGIN_TIME_KEY);
    }

    function getUser() {
        return state.currentUser;
    }

    function getLoginTime() {
        return state.loginTime;
    }

    // 获取登录时长（格式化字符串）
    function getSessionDuration() {
        if (!state.loginTime) return '-';
        const duration = Date.now() - state.loginTime;
        const hours = Math.floor(duration / (60 * 60 * 1000));
        const minutes = Math.floor((duration % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}小时${minutes}分钟`;
    }

    // 获取剩余时间（毫秒）
    function getRemainingTime() {
        if (!state.loginTime) return 0;
        const remaining = CONFIG.SESSION_TIMEOUT - (Date.now() - state.loginTime);
        return Math.max(0, remaining);
    }

    // 获取剩余时间（格式化字符串）
    function getRemainingTimeFormatted() {
        const remaining = getRemainingTime();
        if (remaining === 0) return '已过期';
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}小时${minutes}分钟`;
    }

    function isLoggedIn() {
        return !!state.currentUser && !isSessionExpired();
    }

    // ============================================
    // 监听器管理
    // ============================================
    function subscribe(callback) {
        if (typeof callback !== 'function') return () => {};
        
        state.listeners.push(callback);
        
        // 立即调用一次，传递当前状态
        try {
            callback(state.currentUser);
        } catch (e) {
            console.error('[Auth] Initial callback error:', e);
        }
        
        // 返回取消订阅函数
        return () => {
            const index = state.listeners.indexOf(callback);
            if (index > -1) {
                state.listeners.splice(index, 1);
            }
        };
    }

    function notifyListeners() {
        state.listeners.forEach(cb => {
            try {
                cb(state.currentUser);
            } catch (e) {
                console.error('[Auth] Listener error:', e);
            }
        });
    }

    // ============================================
    // 认证操作
    // ============================================
    async function login(email, password) {
        if (!state.supabaseClient) {
            throw new Error('Supabase not initialized');
        }
        
        const { data, error } = await state.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // handleSignIn 会在 onAuthStateChange 中自动调用
        return data;
    }

    async function register(email, password) {
        if (!state.supabaseClient) {
            throw new Error('Supabase not initialized');
        }
        
        const { data, error } = await state.supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    }

    async function logout() {
        // 更新数据库中的在线状态
        if (state.supabaseClient && state.currentUser) {
            try {
                await state.supabaseClient
                    .from('User')
                    .update({ is_online: false, last_active: new Date().toISOString() })
                    .eq('id', state.currentUser.id);
            } catch (err) {
                console.warn('[Auth] Failed to update offline status:', err);
            }
        }
        
        handleSignOut();
        
        // 如果 Supabase 可用，也登出服务端
        if (state.supabaseClient) {
            const { error } = await state.supabaseClient.auth.signOut();
            if (error) throw error;
        }
    }

    // ============================================
    // 获取 User 表数据
    // ============================================
    async function getUserData() {
        if (!state.supabaseClient || !state.currentUser) return null;
        
        try {
            const { data, error } = await state.supabaseClient
                .from('User')
                .select('*')
                .eq('id', state.currentUser.id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[Auth] Failed to get user data:', err);
            return null;
        }
    }

    // ============================================
    // 工具方法
    // ============================================
    function updateConfig(newConfig) {
        Object.assign(CONFIG, newConfig);
    }

    // ============================================
    // 公共 API
    // ============================================
    const Auth = {
        init,
        getUser,
        getLoginTime,
        getSessionDuration,
        getRemainingTime,
        getRemainingTimeFormatted,
        isLoggedIn,
        subscribe,
        login,
        register,
        logout,
        setUser,
        getUserData,
        updateConfig,
        get supabase() { return state.supabaseClient; },
        get config() { return CONFIG; }
    };

    // 暴露到全局
    global.Auth = Auth;

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        setTimeout(() => init(), 0);
    }

})(window);
