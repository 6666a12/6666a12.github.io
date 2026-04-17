// GitHub Charts 展示模块 - 展示 submit.html 上传到 GitHub 的内容
const GitHubCharts = (function() {
    const owner = '6666a12';
    const repo = 'Charts';
    const ITEMS_PER_PAGE = 1;

    let currentPage = 1;
    let totalPages = 1;
    let submissions = []; // 缓存所有提交数据

    // 获取仓库根目录下所有文件夹
    async function fetchFolders() {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents`,
            {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );
        if (!response.ok) throw new Error(`获取仓库内容失败: HTTP ${response.status}`);
        const data = await response.json();
        // 筛选文件夹并按数字名称排序
        return data
            .filter(item => item.type === 'dir')
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }

    // 获取单个文件夹的详情
    async function fetchFolderDetails(folderName) {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${folderName}`,
            {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );
        if (!response.ok) throw new Error(`获取文件夹 ${folderName} 失败`);
        const files = await response.json();

        const coverFile = files.find(f => f.name.startsWith('cover.'));
        const chartFile = files.find(f => f.name.startsWith('chart.'));
        const infoFile = files.find(f => f.name === 'info.txt');

        let info = { title: folderName, uploadTime: '', chartHash: '' };
        if (infoFile && infoFile.download_url) {
            try {
                const infoRes = await fetch(infoFile.download_url);
                if (infoRes.ok) {
                    const text = await infoRes.text();
                    info = JSON.parse(text);
                }
            } catch (e) {
                console.warn(`解析 ${folderName}/info.txt 失败`, e);
            }
        }

        return {
            id: folderName,
            title: info.title || folderName,
            uploadTime: info.uploadTime || '',
            chartHash: info.chartHash || '',
            coverUrl: coverFile ? coverFile.download_url : '',
            chartUrl: chartFile ? chartFile.download_url : '',
            chartName: chartFile ? chartFile.name : ''
        };
    }

    // 加载所有数据到缓存
    async function loadAll() {
        if (submissions.length > 0) return;
        const folders = await fetchFolders();
        if (folders.length === 0) {
            submissions = [];
            totalPages = 1;
            return;
        }
        const details = await Promise.all(folders.map(f => fetchFolderDetails(f.name)));
        submissions = details;
        totalPages = Math.ceil(submissions.length / ITEMS_PER_PAGE) || 1;
    }

    // 获取分页数据
    async function getPage(pageNum) {
        await loadAll();
        currentPage = Math.max(1, Math.min(pageNum, totalPages));
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE;
        return {
            success: true,
            data: submissions.slice(from, to),
            total: submissions.length,
            totalPages: totalPages,
            currentPage: currentPage
        };
    }

    // HTML 转义
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 渲染单个卡片
    function renderCard(item) {
        return `
            <div class="submission-card" data-id="${item.id}">
                <h2 class="card-title">${escapeHtml(item.title)}</h2>
                ${item.uploadTime ? `<p class="card-meta">上传时间：${escapeHtml(item.uploadTime)}</p>` : ''}
                <div class="card-image">
                    <img src="${item.coverUrl || '../pic/placeholder.png'}" alt="${escapeHtml(item.title)}">
                </div>
                <div class="card-actions">
                    <button class="download-btn" onclick="GitHubCharts.downloadChart('${item.chartUrl}', '${item.chartName}')" ${!item.chartUrl ? 'disabled' : ''}>
                        下载 ${item.chartName || '谱面文件'}
                    </button>
                </div>
            </div>
        `;
    }

    // 下载谱面文件
    function downloadChart(url, fileName) {
        if (!url || !fileName) {
            alert('文件链接不存在');
            return;
        }
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 渲染画廊
    async function renderGallery(containerId, pageNum = 1) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '<p>加载中...</p>';

        try {
            const result = await getPage(pageNum);

            if (!result.success || result.data.length === 0) {
                container.innerHTML = '<p>暂无内容</p>';
                updatePagination(1, 1);
                return;
            }

            container.innerHTML = result.data.map(item => renderCard(item)).join('');
            updatePagination(result.currentPage, result.totalPages);
        } catch (err) {
            console.error(err);
            container.innerHTML = '<p>加载失败，请稍后重试</p>';
        }
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
        }
    }

    // 下一页
    function nextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            renderGallery('gallery-grid', currentPage);
        }
    }

    function init() {}

    return {
        init: init,
        getPage: getPage,
        renderGallery: renderGallery,
        prevPage: prevPage,
        nextPage: nextPage,
        downloadChart: downloadChart,
        get currentPage() { return currentPage; },
        get totalPages() { return totalPages; }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    GitHubCharts.init();
});
