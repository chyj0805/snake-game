/**
 * 仪表盘页面 - 数据加载与图表渲染
 * 支持 I18N 国际化
 */

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadGameHistory();
    loadLoginHistory();
    loadDashboardLeaderboard();
});

document.addEventListener('langChanged', () => {
    loadGameHistory();
    loadLoginHistory();
    loadDashboardLeaderboard();
});

async function loadStats() {
    try {
        const response = await fetch('/api/game/stats');
        const data = await response.json();
        if (data.success) {
            const stats = data.stats;
            animateValue('totalGames', stats.total_games);
            animateValue('highScore', stats.highest_score);
            animateValue('avgScore', stats.avg_score);
            animateValue('maxLength', stats.max_snake_length);
            const totalTime = stats.total_play_time;
            const hours = Math.floor(totalTime / 3600);
            const mins = Math.floor((totalTime % 3600) / 60);
            document.getElementById('totalPlayTime').textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }
    } catch (err) {
        console.error('\u52a0\u8f7d\u7edf\u8ba1\u6570\u636e\u5931\u8d25:', err);
    }
}

async function loadGameHistory() {
    const container = document.getElementById('gameHistoryTable');
    try {
        const response = await fetch('/api/game/history');
        const data = await response.json();
        if (data.success && data.records.length > 0) {
            let html = `<table class="data-table"><thead><tr><th>${I18N.t('table.num')}</th><th>${I18N.t('table.score')}</th><th>${I18N.t('table.snakeLength')}</th><th>${I18N.t('table.duration')}</th><th>${I18N.t('table.playedAt')}</th></tr></thead><tbody>`;
            data.records.forEach((record, i) => {
                html += `<tr><td>${i + 1}</td><td class="score-cell">${record.score}</td><td>${record.snake_length}</td><td>${formatDuration(record.duration_seconds)}</td><td>${formatDateTime(record.played_at)}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
            renderScoreTrendChart(data.records.slice().reverse());
        } else {
            container.innerHTML = `<div class="empty-text">${I18N.t('empty.noGames')}</div>`;
            renderEmptyChart();
        }
    } catch (err) {
        container.innerHTML = `<div class="empty-text">${I18N.t('loadFail')}</div>`;
    }
}

async function loadLoginHistory() {
    const container = document.getElementById('loginHistoryTable');
    try {
        const response = await fetch('/api/login-history');
        const data = await response.json();
        if (data.success && data.logs.length > 0) {
            let html = `<table class="data-table"><thead><tr><th>${I18N.t('table.num')}</th><th>${I18N.t('table.loginTime')}</th><th>${I18N.t('table.ipAddress')}</th></tr></thead><tbody>`;
            data.logs.forEach((log, i) => {
                html += `<tr><td>${i + 1}</td><td>${formatDateTime(log.login_time)}</td><td>${log.ip_address || I18N.t('unknown')}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `<div class="empty-text">${I18N.t('empty.noLogins')}</div>`;
        }
    } catch (err) {
        container.innerHTML = `<div class="empty-text">${I18N.t('loadFail')}</div>`;
    }
}

async function loadDashboardLeaderboard() {
    const container = document.getElementById('dashboardLeaderboard');
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        if (data.success && data.leaderboard.length > 0) {
            let html = `<table class="data-table"><thead><tr><th>${I18N.t('table.rank')}</th><th>${I18N.t('table.player')}</th><th>${I18N.t('table.highestScore')}</th><th>${I18N.t('table.totalGames')}</th></tr></thead><tbody>`;
            data.leaderboard.slice(0, 10).forEach((item, i) => {
                const rankIcon = i === 0 ? '\ud83e\udd47' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : `${i + 1}`;
                html += `<tr><td>${rankIcon}</td><td>${escapeHtml(item.username)}</td><td class="score-cell">${item.highest_score}</td><td>${item.total_games}</td></tr>`;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `<div class="empty-text">${I18N.t('empty.noLeaderboard')}</div>`;
        }
    } catch (err) {
        container.innerHTML = `<div class="empty-text">${I18N.t('loadFail')}</div>`;
    }
}

function renderScoreTrendChart(records) {
    const canvas = document.getElementById('scoreTrendChart');
    if (!canvas) return;
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    const displayRecords = records.slice(-30);
    const labels = displayRecords.map((_, i) => I18N.t('game.round', { n: i + 1 }));
    const scores = displayRecords.map(r => r.score);
    const scoreLabel = I18N.t('table.score');
    new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: scoreLabel, data: scores,
                borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)',
                borderWidth: 2, pointBackgroundColor: '#4ade80',
                pointBorderColor: '#0d1117', pointBorderWidth: 2,
                pointRadius: 4, pointHoverRadius: 6, fill: true, tension: 0.3,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)', titleColor: '#94a3b8',
                    bodyColor: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.2)',
                    borderWidth: 1, cornerRadius: 8, padding: 12,
                    callbacks: { label: (ctx) => `${scoreLabel}: ${ctx.parsed.y}` },
                },
            },
            scales: {
                x: { grid: { color: 'rgba(74, 222, 128, 0.05)' }, ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 10 } },
                y: { beginAtZero: true, grid: { color: 'rgba(74, 222, 128, 0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
            },
            interaction: { intersect: false, mode: 'index' },
        },
    });
}

function renderEmptyChart() {
    const canvas = document.getElementById('scoreTrendChart');
    if (!canvas) return;
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    new Chart(canvas, {
        type: 'line',
        data: { labels: ['', '', '', '', ''], datasets: [{ data: [0, 0, 0, 0, 0], borderColor: 'rgba(74, 222, 128, 0.2)', borderWidth: 1, pointRadius: 0, fill: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: true, beginAtZero: true, max: 100, grid: { color: 'rgba(74, 222, 128, 0.03)' }, ticks: { color: '#64748b', font: { size: 10 } } } } },
    });
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return I18N.t('unknown');
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diff = now - date;
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return mins <= 0 ? I18N.t('justNow') : `${mins}${I18N.t('minutesAgo')}`;
    }
    if (date.toDateString() === now.toDateString()) {
        return `${I18N.t('today')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function animateValue(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const target = parseFloat(targetValue) || 0;
    const duration = 800;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = target * eased;
        element.textContent = Number.isInteger(target) ? Math.round(currentValue) : currentValue.toFixed(1);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
