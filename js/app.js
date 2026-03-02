/* =====================================================
   GitHub Repo Analyzer — Main Application Script
   ===================================================== */

'use strict';

// ─── DOM References ───────────────────────────────────
const initForm = document.getElementById('init-search-form');
const initInput = document.getElementById('init-username-input');
const initialScreen = document.getElementById('initial-screen');
const containerDiv = document.querySelector('.container');
const landingError = document.getElementById('landing-error');

const form = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');

const profileCard = document.getElementById('profile-card');
const langCard = document.getElementById('lang-card');
const reposCard = document.getElementById('repos-card');
const loadingCard = document.getElementById('loading-profile');
const profileError = document.getElementById('profile-error');
const profileErrorText = document.getElementById('profile-error-text');
const emptyState = document.getElementById('empty-state');

const avatarImg = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const bioEl = document.getElementById('bio');
const userMetaEl = document.getElementById('user-meta');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
const repoCountEl = document.getElementById('repo-count');
const totalStarsEl = document.getElementById('total-stars');
const topbarAvatar = document.getElementById('topbar-avatar');
const topbarUsername = document.getElementById('topbar-username');

const repoTableBody = document.getElementById('repo-table-body');

let langChart = null;
let starChart = null;

// ── Language color map ────────────────────────────────
const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#239120',
    Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95',
    Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', HTML: '#e34c26',
    CSS: '#563d7c', Shell: '#89e051', Vue: '#41b883', React: '#61dafb',
    Scala: '#c22d40', Haskell: '#5e5086', R: '#198CE7', Lua: '#000080',
};

function getLangColor(lang) {
    return LANG_COLORS[lang] || `hsl(${Math.abs(hashCode(lang)) % 360}, 65%, 55%)`;
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash;
}

// ── Sidebar navigation ────────────────────────────────
const menuItems = document.querySelectorAll('.sidebar-menu li[data-section]');
const allFeatures = document.querySelectorAll('.feature-section');
const dashboardSection = document.getElementById('dashboard-section');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.section;

        // Active state
        document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Show/hide
        allFeatures.forEach(f => f.classList.add('hidden'));

        if (section === 'dashboard') {
            dashboardSection.style.display = '';
        } else {
            dashboardSection.style.display = 'none';
            const el = document.getElementById(section);
            if (el) el.classList.remove('hidden');
        }
    });
});

// ── Landing form submit ───────────────────────────────
initForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = initInput.value.trim();
    if (!username) return;
    const btn = initForm.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing…';
    landingError.textContent = '';
    try {
        await fetchUser(username);
        initialScreen.style.display = 'none';
        containerDiv.style.display = '';
        usernameInput.value = username;
        emptyState.style.display = 'none';
    } catch (err) {
        landingError.textContent = '⚠ ' + err.message;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Analyze';
    }
});

// ── Topbar search form ────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) return;

    // Switch to dashboard view
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.querySelector('.sidebar-menu li[data-section="dashboard"]').classList.add('active');
    allFeatures.forEach(f => f.classList.add('hidden'));
    dashboardSection.style.display = '';

    try {
        await fetchUser(username);
    } catch (err) {
        showProfileError(err.message);
    }
});

// ── Main fetch ───────────────────────────────────────
async function fetchUser(username) {
    showLoading(true);
    hideProfileError();
    hideProfileCards();

    const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
    ]);

    if (!userRes.ok) {
        showLoading(false);
        throw new Error(userRes.status === 404 ? `User "${username}" not found` : 'GitHub API error — you may be rate-limited');
    }

    const user = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];

    showLoading(false);
    showProfile(user);
    showRepos(repos);
    showLanguageChart(repos);
}

// ── Show / hide helpers ───────────────────────────────
function showLoading(on) {
    loadingCard.classList.toggle('hidden', !on);
}

function hideProfileCards() {
    profileCard.classList.add('hidden');
    langCard.classList.add('hidden');
    reposCard.classList.add('hidden');
}

function showProfileError(msg) {
    profileError.classList.remove('hidden');
    profileErrorText.textContent = msg;
}

function hideProfileError() {
    profileError.classList.add('hidden');
}

// ── Profile ───────────────────────────────────────────
function showProfile(user) {
    avatarImg.src = user.avatar_url;
    nameEl.textContent = user.name || user.login;
    bioEl.textContent = user.bio || '';

    // Meta line
    const metaItems = [];
    if (user.location) metaItems.push(`<span class="user-meta-item"><i class="fa-solid fa-location-dot"></i> ${escHtml(user.location)}</span>`);
    if (user.company) metaItems.push(`<span class="user-meta-item"><i class="fa-solid fa-building"></i> ${escHtml(user.company)}</span>`);
    if (user.blog) metaItems.push(`<span class="user-meta-item"><i class="fa-solid fa-link"></i> <a href="${user.blog}" target="_blank" rel="noopener">${escHtml(user.blog)}</a></span>`);
    if (user.twitter_username) metaItems.push(`<span class="user-meta-item"><i class="fa-brands fa-x-twitter"></i> @${escHtml(user.twitter_username)}</span>`);
    userMetaEl.innerHTML = metaItems.join('');

    // Stats — animated counter
    animateCounter(followersEl, user.followers);
    animateCounter(followingEl, user.following);
    animateCounter(repoCountEl, user.public_repos);

    // Topbar
    topbarAvatar.src = user.avatar_url;
    topbarUsername.textContent = user.login;

    profileCard.classList.remove('hidden');
}

function escHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function animateCounter(el, target) {
    const duration = 800;
    const start = parseInt(el.textContent) || 0;
    const startTime = performance.now();
    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ── Repos ─────────────────────────────────────────────
function showRepos(repos) {
    repoTableBody.innerHTML = '';
    const recent = repos.slice(0, 12);
    let totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    recent.forEach(r => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => window.open(r.html_url, '_blank', 'noopener'));

        const langColor = r.language ? getLangColor(r.language) : '#484f58';
        const langDot = r.language ? `<span class="lang-dot" style="background:${langColor}"></span>` : '';

        tr.innerHTML = `
      <td><a class="repo-name-link" href="${r.html_url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escHtml(r.name)}</a></td>
      <td>${langDot}${escHtml(r.language || '—')}</td>
      <td><span class="stars-cell"><i class="fa-solid fa-star" style="font-size:.75rem;"></i> ${r.stargazers_count.toLocaleString()}</span></td>
      <td style="color:var(--text-secondary);font-size:.8rem;">${timeAgo(r.updated_at)}</td>
    `;
        repoTableBody.appendChild(tr);
    });

    animateCounter(totalStarsEl, totalStars);
    reposCard.classList.remove('hidden');
}

function timeAgo(iso) {
    const diff = Date.now() - new Date(iso);
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 30) return `${d} days ago`;
    if (d < 365) return `${Math.floor(d / 30)} months ago`;
    return `${Math.floor(d / 365)} years ago`;
}

// ── Charts ─────────────────────────────────────────────
function showLanguageChart(repos) {
    const langUsage = {};
    const starUsage = {};
    repos.forEach(r => {
        if (!r.language) return;
        langUsage[r.language] = (langUsage[r.language] || 0) + 1;
        starUsage[r.language] = (starUsage[r.language] || 0) + r.stargazers_count;
    });

    const labels = Object.keys(langUsage);
    const counts = Object.values(langUsage);
    const starCounts = labels.map(l => starUsage[l] || 0);
    const colors = labels.map(l => getLangColor(l));

    Chart.defaults.color = '#8b949e';

    // Lang pie chart
    const langCtx = document.getElementById('lang-chart').getContext('2d');
    if (langChart) { langChart.destroy(); }
    langChart = new Chart(langCtx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: counts, backgroundColor: colors, borderColor: '#161b22', borderWidth: 2 }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 14, font: { size: 11 }, color: '#8b949e', padding: 10 } }
            }
        }
    });

    // Stars bar chart
    const starCtx = document.getElementById('star-chart').getContext('2d');
    if (starChart) { starChart.destroy(); }
    starChart = new Chart(starCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Stars',
                data: starCounts,
                backgroundColor: colors.map(c => c + 'cc'),
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(48,54,61,0.5)' }, ticks: { color: '#8b949e' } },
                x: { grid: { display: false }, ticks: { color: '#8b949e' } }
            }
        }
    });

    langCard.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════
//  MODULE INITIALIZERS
// ═══════════════════════════════════════════════════

// ── Alerts ────────────────────────────────────────────
function initAlerts() {
    document.querySelectorAll('.alert-dismiss').forEach(btn => {
        btn.addEventListener('click', function () {
            const alert = this.closest('.alert');
            alert.classList.add('dismissing');
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    });

    document.getElementById('restore-alerts').addEventListener('click', () => {
        document.querySelectorAll('.alert').forEach(a => {
            a.style.display = '';
            a.classList.remove('dismissing');
        });
    });

    document.getElementById('show-toast-demo').addEventListener('click', () => {
        showToast('Notification sent successfully!', 'fa-solid fa-check-circle');
        setTimeout(() => showToast('New follower: torvalds', 'fa-solid fa-user-plus'), 600);
    });
}

// ── Badges ────────────────────────────────────────────
function initBadges() {
    document.querySelectorAll('#badges .badge').forEach(badge => {
        badge.addEventListener('click', async () => {
            const text = badge.textContent.trim();
            try {
                await navigator.clipboard.writeText(text);
                showToast(`Copied: "${text}"`, 'fa-solid fa-copy');
            } catch {
                showToast(`Selected: "${text}"`, 'fa-solid fa-check');
            }
        });
    });
}

// ── Buttons ───────────────────────────────────────────
function initButtons() {
    // Ripple effect on all .btn elements (except loading ones)
    document.querySelectorAll('#buttons .btn:not(.loading)').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const r = document.createElement('span');
            r.className = 'ripple';
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            r.style.width = r.style.height = size + 'px';
            r.style.left = (e.clientX - rect.left - size / 2) + 'px';
            r.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(r);
            r.addEventListener('animationend', () => r.remove());
        });
    });

    // Loading demo button
    const loadingBtn = document.getElementById('loading-demo-btn');
    if (loadingBtn) {
        loadingBtn.addEventListener('click', function () {
            this.classList.add('loading');
            setTimeout(() => {
                this.classList.remove('loading');
                showToast('Done! Action completed.', 'fa-solid fa-check-circle');
            }, 2000);
        });
    }
}

// ── Pagination ───────────────────────────────────────
function initPagination() {
    const totalItems = 87;
    let currentPage = 1;

    function renderPagination() {
        const perPage = parseInt(document.getElementById('per-page').value);
        const totalPages = Math.ceil(totalItems / perPage);
        const container = document.getElementById('pagination-demo');
        const start = (currentPage - 1) * perPage + 1;
        const end = Math.min(currentPage * perPage, totalItems);
        document.getElementById('pagination-info').textContent = `Showing ${start}–${end} of ${totalItems} items`;
        document.getElementById('active-page-display').textContent = currentPage;

        container.innerHTML = '';

        const prev = makePageItem('‹', currentPage === 1, () => { currentPage--; renderPagination(); });
        container.appendChild(prev);

        const pageNumbers = getPageRange(currentPage, totalPages);
        pageNumbers.forEach(p => {
            if (p === '…') {
                const dots = makePageItem('…', false, null, true);
                container.appendChild(dots);
            } else {
                const btn = makePageItem(p, false, () => { currentPage = p; renderPagination(); }, false, p === currentPage);
                container.appendChild(btn);
            }
        });

        const next = makePageItem('›', currentPage === totalPages, () => { currentPage++; renderPagination(); });
        container.appendChild(next);
    }

    function makePageItem(label, disabled, onClick, isDots = false, isActive = false) {
        const span = document.createElement('span');
        span.className = 'page-item' + (isActive ? ' active' : '') + (disabled ? ' disabled' : '') + (isDots ? ' dots' : '');
        span.textContent = label;
        if (onClick && !disabled && !isDots) span.addEventListener('click', onClick);
        return span;
    }

    function getPageRange(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
        if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
        return [1, '…', current - 1, current, current + 1, '…', total];
    }

    document.getElementById('per-page').addEventListener('change', () => {
        currentPage = 1;
        renderPagination();
    });

    renderPagination();
}

// ── Popovers ──────────────────────────────────────────
function initPopovers() {
    document.querySelectorAll('.popover-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const box = this.nextElementSibling;
            if (!box) return;

            // Close all others first
            document.querySelectorAll('.popover-box').forEach(b => {
                if (b !== box) b.classList.add('hidden');
            });

            box.classList.toggle('hidden');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.popover-box').forEach(b => b.classList.add('hidden'));
    });
}

// ── Toast system ─────────────────────────────────────
function showToast(message, icon = 'fa-solid fa-check-circle') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// ─── Init all modules on DOMContentLoaded ────────────
document.addEventListener('DOMContentLoaded', () => {
    initAlerts();
    initBadges();
    initButtons();
    initPagination();
    initPopovers();
});
