// Charts Submit 模块 - 处理提交和展示逻辑
const ChartsSubmit = (function() {
    // Supabase 配置 - 从 auth.js 复用
    const SUPABASE_URL = 'https://czhmbfiqbtcqwdnoyzxl.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6aG1iZmlxYnRjcXdkbm95enhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NjA1NjgsImV4cCI6MjA1OTMzNjU2OH0.SljM-L7SsD0R5MB_WCzrWO2-0nPF0B4D0k44RhcLl3c';
    
    let supabaseClient = null;
    let currentPage = 1;
    let totalPages = 1;
    const ITEMS_PER_PAGE = 10;

    // 初始化 Supabase 客户端
    function initSupabase() {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } else {
            console.error('Supabase library not loaded');
        }
    }

    // 文件转 Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 提交新内容
    async function submit(title, imageFile, zipFile) {
        if (!supabaseClient) initSupabase();
        
        try {
            // 转换文件为 base64
            const imageData = imageFile ? await fileToBase64(imageFile) : null;
            const fileData = zipFile ? await fileToBase64(zipFile) : null;
            
            const { data, error } = await supabaseClient
                .from('submissions')
                .insert([{
                    title: title,
                    image_data: imageData,
                    file_name: zipFile ? zipFile.name : null,
                    file_data: fileData
                }]);
            
            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('提交失败:', err);
            return { success: false, error: err.message };
        }
    }

    // 获取分页数据
    async function getPage(pageNum) {
        if (!supabaseClient) initSupabase();
        
        try {
            const from = (pageNum - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;
            
            const { data, error, count } = await supabaseClient
                .from('submissions')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            
            totalPages = Math.ceil(count / ITEMS_PER_PAGE) || 1;
            currentPage = pageNum;
            
            return { 
                success: true, 
                data: data || [], 
                total: count,
                totalPages: totalPages,
                currentPage: currentPage
            };
        } catch (err) {
            console.error('获取数据失败:', err);
            return { success: false, error: err.message };
        }
    }

    // 获取总数
    async function getTotal() {
        if (!supabaseClient) initSupabase();
        
        try {
            const { count, error } = await supabaseClient
                .from('submissions')
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('获取总数失败:', err);
            return 0;
        }
    }

    // 下载文件
    function downloadFile(fileData, fileName) {
        if (!fileData || !fileName) {
            alert('文件数据不存在');
            return;
        }
        
        const link = document.createElement('a');
        link.href = fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 渲染单个卡片
    function renderCard(item) {
        return `
            <div class="submission-card" data-id="${item.id}">
                <div class="card-image">
                    <img src="${item.image_data || '../pic/placeholder.png'}" alt="${item.title}">
                </div>
                <div class="card-info">
                    <h3>${item.title}</h3>
                    <button class="download-btn" onclick="ChartsSubmit.downloadFile('${item.file_data}', '${item.file_name}')">
                        下载 ${item.file_name || '文件'}
                    </button>
                </div>
            </div>
        `;
    }

    // 渲染画廊
    async function renderGallery(containerId, pageNum = 1) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const result = await getPage(pageNum);
        
        if (!result.success) {
            container.innerHTML = '<p>加载失败，请稍后重试</p>';
            return;
        }
        
        if (result.data.length === 0) {
            container.innerHTML = '<p>暂无内容</p>';
            return;
        }
        
        const html = result.data.map(item => renderCard(item)).join('');
        container.innerHTML = html;
        
        // 更新分页控件
        updatePagination(result.currentPage, result.totalPages);
    }

    // 更新分页控件
    function updatePagination(current, total) {
        const pageNumEl = document.getElementById('pageNum');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (pageNumEl) pageNumEl.textContent = current;
        if (prevBtn) prevBtn.disabled = current <= 1;
        if (nextBtn) nextBtn.disabled = current >= total;
    }

    // 上一页
    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
            renderGallery('gallery-grid', currentPage);
            updateUrlPage(currentPage);
        }
    }

    // 下一页
    function nextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            renderGallery('gallery-grid', currentPage);
            updateUrlPage(currentPage);
        }
    }

    // 跳转到指定页
    function goToPage(pageNum) {
        if (pageNum >= 1 && pageNum <= totalPages) {
            currentPage = pageNum;
            renderGallery('gallery-grid', currentPage);
            updateUrlPage(currentPage);
        }
    }

    // 更新 URL 页码
    function updateUrlPage(pageNum) {
        if (window.router && window.router.push) {
            window.router.push(`/Charts/page/${pageNum}`);
        }
    }

    // 初始化
    function init() {
        initSupabase();
    }

    return {
        init: init,
        submit: submit,
        getPage: getPage,
        getTotal: getTotal,
        downloadFile: downloadFile,
        renderGallery: renderGallery,
        prevPage: prevPage,
        nextPage: nextPage,
        goToPage: goToPage,
        get currentPage() { return currentPage; },
        get totalPages() { return totalPages; }
    };
})();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    ChartsSubmit.init();
});
