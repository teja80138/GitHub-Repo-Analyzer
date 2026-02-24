const form = document.getElementById('search-form');
const usernameInput = document.getElementById('username-input');

const initForm = document.getElementById('init-search-form');
const initInput = document.getElementById('init-username-input');

const initialScreen = document.getElementById('initial-screen');
const containerDiv = document.querySelector('.container');

const profileSection = document.getElementById('profile');
const avatarImg = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const bioEl = document.getElementById('bio');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
const repoCountEl = document.getElementById('repo-count');

const chartsSection = document.getElementById('charts');
const langChartCtx = document.getElementById('lang-chart').getContext('2d');
let langChart;

const reposSection = document.getElementById('repos');
const repoTableBody = document.getElementById('repo-table-body');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) return;
    try {
        await fetchUser(username);
    } catch (err) {
        alert('User not found or API rate limit exceeded');
        console.error(err);
    }
});

initForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = initInput.value.trim();
    if (!username) return;
    try {
        await fetchUser(username);
        // hide initial screen and show dashboard
        initialScreen.style.display = 'none';
        containerDiv.style.display = '';
        // also copy username to topbar input
        usernameInput.value = username;
    } catch (err) {
        alert('User not found or API rate limit exceeded');
        console.error(err);
    }
});

// Sidebar menu interaction
const menuItems = document.querySelectorAll('.sidebar-menu li');
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const text = item.textContent.trim();
        // Hide all feature sections
        const allSections = document.querySelectorAll('.feature-section');
        allSections.forEach(s => s.classList.add('hidden'));
        
        // Hide all dashboard cards
        const dashboardCards = document.querySelectorAll('#profile-card, #lang-card, #repos-card');
        dashboardCards.forEach(card => card.classList.add('hidden'));
        
        // Reset active state
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Show selected section
        const sectionMap = {
            'Dashboard': 'dashboard',
            'Alerts': 'alerts',
            'Badges': 'badges',
            'Buttons': 'buttons',
            'Cards': 'cards',
            'Layout': 'layout',
            'Pagination': 'pagination',
            'Popover': 'popover',
            'Tooltips': 'tooltips'
        };
        
        const sectionId = sectionMap[text];
        if (text === 'Dashboard') {
            // Show all dashboard cards
            dashboardCards.forEach(card => card.classList.remove('hidden'));
        } else if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section) section.classList.remove('hidden');
        }
    });
});

async function fetchUser(username) {
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) throw new Error('User not found');
    const userData = await userResponse.json();

    showProfile(userData);
    const repos = await fetchRepos(username);
    showRepos(repos);
    const langUsage = await calculateLanguageUsage(repos);
    const starUsage = calculateStarsPerLanguage(repos);
    showLanguageChart(langUsage, starUsage);
}

function showProfile(user) {
    avatarImg.src = user.avatar_url;
    nameEl.textContent = user.name || user.login;
    bioEl.textContent = user.bio || '';
    followersEl.textContent = user.followers;
    followingEl.textContent = user.following;
    repoCountEl.textContent = user.public_repos;

    profileSection.classList.remove('hidden');
}


async function fetchRepos(username) {
    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    if (!res.ok) throw new Error('Repos not available');
    return res.json();
}


async function showRepos(repos) {
    repoTableBody.innerHTML = '';
    const recent = repos.slice(0, 10);
    let totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    for (let r of recent) {
        const tr = document.createElement('tr');
        const nameTd = document.createElement('td');
        const langTd = document.createElement('td');
        const starsTd = document.createElement('td');
        const updatedTd = document.createElement('td');

        nameTd.textContent = r.name;
        langTd.textContent = r.language || '-';
        starsTd.textContent = r.stargazers_count;
        updatedTd.textContent = new Date(r.updated_at).toLocaleDateString();
        tr.append(nameTd, langTd, starsTd, updatedTd);
        repoTableBody.appendChild(tr);
    }

    const totalStarsEl = document.getElementById('total-stars');
    if (totalStarsEl) totalStarsEl.textContent = totalStars;

    reposSection.classList.remove('hidden');
}

async function calculateLanguageUsage(repos) {
    const usage = {};
    for (let r of repos) {
        if (!r.language) continue;
        usage[r.language] = (usage[r.language] || 0) + 1;
    }
    return usage;
}

function calculateStarsPerLanguage(repos) {
    const usage = {};
    for (let r of repos) {
        if (!r.language) continue;
        usage[r.language] = (usage[r.language] || 0) + r.stargazers_count;
    }
    return usage;
}

let starChart;
function showLanguageChart(langData, starData) {
    const labels = Object.keys(langData);
    const counts = Object.values(langData);
    const starCounts = labels.map(l => starData[l] || 0);

    // lang bar
    if (langChart) {
        langChart.data.labels = labels;
        langChart.data.datasets[0].data = counts;
        langChart.update();
    } else {
        langChart = new Chart(langChartCtx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    label: '# of repos',
                    data: counts,
                    backgroundColor: labels.map(_=>randomColor()),
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    // stars per language bar
    const starCtx = document.getElementById('star-chart').getContext('2d');
    if (starChart) {
        starChart.data.labels = labels;
        starChart.data.datasets[0].data = starCounts;
        starChart.update();
    } else {
        starChart = new Chart(starCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: '# of stars',
                    data: starCounts,
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    chartsSection.classList.remove('hidden');
}

function randomColor() {
    return `hsl(${Math.random()*360}, 70%, 60%)`;
}

// Initialize popover behavior
document.addEventListener('DOMContentLoaded', () => {
    const popoverBtns = document.querySelectorAll('.popover-btn');
    popoverBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const popoverBox = this.nextElementSibling;
            if (popoverBox && popoverBox.classList.contains('popover-box')) {
                popoverBox.classList.toggle('hidden');
            }
        });
        
        btn.addEventListener('blur', function() {
            const popoverBox = this.nextElementSibling;
            if (popoverBox && popoverBox.classList.contains('popover-box')) {
                setTimeout(() => {
                    popoverBox.classList.add('hidden');
                }, 200);
            }
        });
    });
    
    // Initialize Dashboard as default view
    const dashboardCards = document.querySelectorAll('#profile-card, #lang-card, #repos-card');
    dashboardCards.forEach(card => card.classList.remove('hidden'));
});
