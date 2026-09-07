// ===== 全局状态 =====
let currentView = 'home';
let currentCategory = '全部';
let postsData = [];

// ===== DOM 引用 =====
const app = document.getElementById('app');
const navLinks = document.querySelectorAll('.main-nav a');

// ===== 导航切换 =====
function navigateTo(view, data) {
    currentView = view;
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.view === view);
    });
    renderView(view, data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        navigateTo(view);
    });
});

// ===== 渲染引擎 =====
function renderView(view, data) {
    switch (view) {
        case 'home': renderHome(); break;
        case 'blog': renderBlog(data); break;
        case 'links': renderLinks(); break;
        case 'post': renderPost(data); break;
        default: renderHome();
    }
}

// ===== 辅助函数：转义HTML（防止XSS） =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
//  1. 主页
// ============================================================
function renderHome() {
    app.innerHTML = `
        <div class="profile">
            <div class="avatar">周</div>
            <h1>leozhouyuan · 周圆</h1>
            <p class="bio">开发者 · 内容创作者 · 保持好奇</p>
            <div class="social-links">
                <a href="https://github.com/leozhouyuan/" target="_blank" class="github"><i class="fab fa-github"></i></a>
                <a href="https://space.bilibili.com/3493088873941568" target="_blank" class="bilibili"><i class="fab fa-bilibili"></i></a>
                <a href="#" target="_blank"><i class="fab fa-twitter"></i></a>
                <a href="#" target="_blank"><i class="fab fa-zhihu"></i></a>
                <a href="#" target="_blank"><i class="fab fa-youtube"></i></a>
            </div>
        </div>
        <h3 style="margin: 24px 0 12px; font-weight:600;">🚀 常用跳转</h3>
        <div class="quick-links">
            <a href="https://github.com" target="_blank" class="quick-link-item"><i class="fab fa-github"></i> GitHub</a>
            <a href="https://space.bilibili.com/3493088873941568" target="_blank" class="quick-link-item"><i class="fab fa-bilibili"></i> B站</a>
            <a href="https://www.google.com" target="_blank" class="quick-link-item"><i class="fab fa-google"></i> Google</a>
            <a href="https://www.youtube.com" target="_blank" class="quick-link-item"><i class="fab fa-youtube"></i> YouTube</a>
            <a href="https://twitter.com" target="_blank" class="quick-link-item"><i class="fab fa-twitter"></i> Twitter</a>
            <a href="https://www.zhihu.com" target="_blank" class="quick-link-item"><i class="fab fa-zhihu"></i> 知乎</a>
            <a href="https://www.xiaohongshu.com" target="_blank" class="quick-link-item"><i class="fas fa-leaf"></i> 小红书</a>
            <a href="https://www.douyin.com" target="_blank" class="quick-link-item"><i class="fab fa-tiktok"></i> 抖音</a>
            <a href="https://stackoverflow.com" target="_blank" class="quick-link-item"><i class="fab fa-stack-overflow"></i> StackOverflow</a>
            <a href="https://www.baidu.com" target="_blank" class="quick-link-item"><i class="fas fa-search"></i> 百度</a>
        </div>
    `;
}

// ============================================================
//  2. 文章列表
// ============================================================
async function renderBlog(filterCategory) {
    if (postsData.length === 0) {
        try {
            const res = await fetch('posts.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            postsData = await res.json();
        } catch (e) {
            app.innerHTML = `<p style="color: var(--text-secondary);">⚠️ 文章数据加载失败，请检查 posts.json 是否存在。</p>`;
            console.error('加载 posts.json 失败:', e);
            return;
        }
    }

    const categories = ['全部', ...new Set(postsData.map(p => p.category))];
    const activeCat = filterCategory || currentCategory || '全部';
    currentCategory = activeCat;

    const filtered = activeCat === '全部' ? postsData : postsData.filter(p => p.category === activeCat);

    const filterBtns = categories.map(cat => 
        `<button class="${cat === activeCat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
    ).join('');

    let postsHtml = filtered.map(post => `
        <div class="post-card" onclick="navigateTo('post', '${post.id}')">
            <h3>${escapeHtml(post.title)}</h3>
            <div class="post-meta">
                <span>${post.date || ''}</span>
                <span class="category">${escapeHtml(post.category)}</span>
            </div>
            <p>${escapeHtml(post.excerpt)}</p>
        </div>
    `).join('');

    if (!postsHtml) postsHtml = '<p style="color: var(--text-secondary);">该分类下暂无文章。</p>';

    app.innerHTML = `
        <div class="blog-header">
            <h2>📝 全部文章</h2>
            <div class="category-filters">${filterBtns}</div>
        </div>
        <div class="post-list">${postsHtml}</div>
    `;

    document.querySelectorAll('.category-filters button').forEach(btn => {
        btn.addEventListener('click', () => {
            renderBlog(btn.dataset.cat);
        });
    });
}

// ============================================================
//  3. 文章详情（增强版）
// ============================================================
async function renderPost(postId) {
    // 显示加载提示
    app.innerHTML = `<p style="color: var(--text-secondary);">⏳ 文章加载中...</p>`;

    try {
        // 1. 检查 marked 是否加载
        if (typeof marked === 'undefined') {
            throw new Error('marked 库未加载，请检查网络或 CDN 链接。');
        }

        // 2. 加载文章元数据（若未加载）
        if (postsData.length === 0) {
            const res = await fetch('posts.json');
            if (!res.ok) throw new Error(`HTTP ${res.status} - 无法获取 posts.json`);
            postsData = await res.json();
        }

        // 3. 根据 id 查找文章
        const postMeta = postsData.find(p => p.id === postId);
        if (!postMeta) {
            app.innerHTML = `<p style="color: #dc2626;">❌ 未找到 ID 为 "${escapeHtml(postId)}" 的文章</p>`;
            return;
        }

        // 4. 加载 Markdown 文件
        const mdPath = postMeta.filename;
        console.log(`正在加载文章: ${mdPath}`);  // 方便调试

        const mdRes = await fetch(mdPath);
        if (!mdRes.ok) {
            throw new Error(`HTTP ${mdRes.status} - 无法获取文件 ${mdPath}`);
        }
        const mdText = await mdRes.text();

        // 5. 解析 Markdown
        const htmlContent = marked.parse(mdText);

        // 6. 渲染到页面
        app.innerHTML = `
            <div class="post-detail">
                <div class="back-btn" onclick="navigateTo('blog')"><i class="fas fa-arrow-left"></i> 返回列表</div>
                <h1>${escapeHtml(postMeta.title)}</h1>
                <div class="detail-meta">
                    <span>${postMeta.date || '无日期'}</span>
                    <span>📂 ${escapeHtml(postMeta.category)}</span>
                </div>
                <div class="content">${htmlContent}</div>
            </div>
        `;
    } catch (error) {
        console.error('文章加载失败:', error);
        app.innerHTML = `
            <div style="background: #fee2e2; padding: 20px; border-radius: 16px; border: 1px solid #fecaca;">
                <p style="color: #dc2626; font-weight: 600;">⚠️ 文章加载失败</p>
                <p style="color: #6b6b70; margin-top: 8px;">${escapeHtml(error.message)}</p>
                <p style="color: #6b6b70; font-size: 0.9rem; margin-top: 8px;">
                    请检查：<br>
                    1. 文件 <code>${escapeHtml(postMeta?.filename || '?')}</code> 是否存在于仓库根目录<br>
                    2. 文件名大小写是否与 posts.json 中完全一致<br>
                    3. 打开浏览器开发者工具（F12）查看 Console 和 Network 标签
                </p>
                <button class="btn" onclick="navigateTo('blog')" style="margin-top: 12px;">返回文章列表</button>
            </div>
        `;
    }
}

// ============================================================
//  4. 常用导航
// ============================================================
function renderLinks() {
    const sites = [
        { name: 'GitHub', icon: 'fab fa-github', url: 'https://github.com' },
        { name: 'B站', icon: 'fab fa-bilibili', url: 'https://space.bilibili.com/3493088873941568' },
        { name: 'Google', icon: 'fab fa-google', url: 'https://www.google.com' },
        { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://www.youtube.com' },
        { name: 'Twitter', icon: 'fab fa-twitter', url: 'https://twitter.com' },
        { name: '知乎', icon: 'fab fa-zhihu', url: 'https://www.zhihu.com' },
        { name: '抖音', icon: 'fab fa-tiktok', url: 'https://www.douyin.com' },
        { name: 'StackOverflow', icon: 'fab fa-stack-overflow', url: 'https://stackoverflow.com' },
        { name: '百度', icon: 'fas fa-search', url: 'https://www.baidu.com' },
        { name: 'CSDN', icon: 'fas fa-code', url: 'https://www.csdn.net' },
        { name: 'V2EX', icon: 'fas fa-comment', url: 'https://www.v2ex.com' },
    ];

    const cards = sites.map(s => `
        <a href="${s.url}" target="_blank" class="link-card">
            <i class="${s.icon}"></i>
            <span>${s.name}</span>
        </a>
    `).join('');

    app.innerHTML = `
        <h2 style="font-weight: 650; margin-bottom: 8px;">🌐 常用导航</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">国内外常用站点，点击直达</p>
        <div class="links-grid">${cards}</div>
    `;
}

// ===== 初始化 =====
navigateTo('home');
window.navigateTo = navigateTo;
