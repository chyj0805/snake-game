/**
 * 国际化模块 - 中英文切换
 * 使用 data-i18n 属性标记需要翻译的元素
 * 使用 localStorage 记住用户语言偏好
 */

const I18N = {
    // 当前语言
    currentLang: localStorage.getItem('snake_lang') || 'zh',

    // 翻译字典
    translations: {
        'title.snake': { zh: 'SNAKE', en: 'SNAKE' },
        'title.sub': { zh: '\u8d2a\u5403\u86c7', en: 'SNAKE GAME' },
        'tab.login': { zh: '\u767b\u5f55', en: 'Login' },
        'tab.register': { zh: '\u6ce8\u518c', en: 'Register' },
        'label.username': { zh: '\u7528\u6237\u540d', en: 'Username' },
        'label.password': { zh: '\u5bc6\u7801', en: 'Password' },
        'label.confirmPassword': { zh: '\u786e\u8ba4\u5bc6\u7801', en: 'Confirm Password' },
        'placeholder.username': { zh: '\u8f93\u5165\u7528\u6237\u540d', en: 'Enter username' },
        'placeholder.password': { zh: '\u8f93\u5165\u5bc6\u7801', en: 'Enter password' },
        'placeholder.usernameHint': { zh: '2-20 \u4e2a\u5b57\u7b26', en: '2-20 characters' },
        'placeholder.passwordHint': { zh: '\u81f3\u5c11 4 \u4e2a\u5b57\u7b26', en: 'At least 4 characters' },
        'placeholder.confirmHint': { zh: '\u518d\u6b21\u8f93\u5165\u5bc6\u7801', en: 'Re-enter password' },
        'btn.startGame': { zh: '\u5f00\u59cb\u6e38\u620f', en: 'Start Game' },
        'btn.createAccount': { zh: '\u521b\u5efa\u8d26\u53f7', en: 'Create Account' },
        'footer.controls': { zh: '\u4f7f\u7528 \u2190 \u2192 \u2191 \u2193 \u6216 WASD \u64cd\u63a7\u8d2a\u5403\u86c7', en: 'Use \u2190 \u2192 \u2191 \u2193 or WASD to control the snake' },
        'nav.game': { zh: '\u6e38\u620f', en: 'Game' },
        'nav.dashboard': { zh: '\u4eea\u8868\u76d8', en: 'Dashboard' },
        'nav.logout': { zh: '\u9000\u51fa', en: 'Logout' },
        'stat.currentScore': { zh: '\u5f53\u524d\u5206\u6570', en: 'SCORE' },
        'stat.highestScore': { zh: '\u6700\u9ad8\u5206', en: 'BEST' },
        'stat.snakeLength': { zh: '\u86c7\u8eab\u957f\u5ea6', en: 'LENGTH' },
        'stat.gameTime': { zh: '\u6e38\u620f\u65f6\u957f', en: 'TIME' },
        'overlay.ready': { zh: '\ud83d\udc0d \u51c6\u5907\u5f00\u59cb', en: '\ud83d\udc0d READY' },
        'overlay.readyText': { zh: '\u6309 \u7a7a\u683c\u952e \u6216\u70b9\u51fb\u4e0b\u65b9\u6309\u94ae\u5f00\u59cb', en: 'Press SPACE or click button to start' },
        'overlay.gameOver': { zh: '\ud83d\udc80 \u6e38\u620f\u7ed3\u675f', en: '\ud83d\udc80 GAME OVER' },
        'overlay.tryAgain': { zh: '\u518d\u6765\u4e00\u5c40\uff1f', en: 'Try again?' },
        'overlay.paused': { zh: '\u23f8\ufe0f \u6682\u505c', en: '\u23f8\ufe0f PAUSED' },
        'overlay.pauseText': { zh: '\u6309 \u7a7a\u683c\u952e \u7ee7\u7eed', en: 'Press SPACE to continue' },
        'overlay.finalScore': { zh: '\u6700\u7ec8\u5f97\u5206', en: 'FINAL SCORE' },
        'btn.start': { zh: '\u5f00\u59cb\u6e38\u620f', en: 'START' },
        'btn.playAgain': { zh: '\u518d\u6765\u4e00\u5c40', en: 'PLAY AGAIN' },
        'controls.title': { zh: '\u64cd\u4f5c\u8bf4\u660e', en: 'Controls' },
        'controls.arrows': { zh: '\u65b9\u5411\u952e\u79fb\u52a8', en: 'Arrow keys' },
        'controls.wasd': { zh: 'WASD \u79fb\u52a8', en: 'WASD keys' },
        'controls.space': { zh: '\u5f00\u59cb / \u6682\u505c', en: 'Start / Pause' },
        'leaderboard.title': { zh: '\ud83c\udfc6 \u6392\u884c\u699c', en: '\ud83c\udfc6 Leaderboard' },
        'leaderboard.empty': { zh: '\u6682\u65e0\u6570\u636e', en: 'No data yet' },
        'leaderboard.loadFail': { zh: '\u52a0\u8f7d\u5931\u8d25', en: 'Load failed' },
        'dashboard.title': { zh: '\ud83d\udcca \u4e2a\u4eba\u6570\u636e\u4eea\u8868\u76d8', en: '\ud83d\udcca Personal Dashboard' },
        'dashboard.welcome': { zh: '\u6b22\u8fce\u56de\u6765\uff0c', en: 'Welcome back, ' },
        'stat.totalGames': { zh: '\u603b\u6e38\u620f\u6b21\u6570', en: 'Total Games' },
        'stat.highScore': { zh: '\u6700\u9ad8\u5206', en: 'High Score' },
        'stat.avgScore': { zh: '\u5e73\u5747\u5206', en: 'Avg Score' },
        'stat.playTime': { zh: '\u603b\u6e38\u620f\u65f6\u957f', en: 'Play Time' },
        'stat.maxLength': { zh: '\u6700\u957f\u86c7\u8eab', en: 'Max Length' },
        'panel.scoreTrend': { zh: '\ud83d\udcc8 \u5206\u6570\u8d8b\u52bf', en: '\ud83d\udcc8 Score Trend' },
        'panel.leaderboard': { zh: '\ud83c\udfc6 \u6392\u884c\u699c Top 10', en: '\ud83c\udfc6 Leaderboard Top 10' },
        'panel.gameHistory': { zh: '\ud83d\udd79\ufe0f \u6e38\u620f\u5386\u53f2', en: '\ud83d\udd79\ufe0f Game History' },
        'panel.loginHistory': { zh: '\ud83d\udd10 \u767b\u5f55\u8bb0\u5f55', en: '\ud83d\udd10 Login History' },
        'table.rank': { zh: '\u6392\u540d', en: 'Rank' },
        'table.player': { zh: '\u73a9\u5bb6', en: 'Player' },
        'table.score': { zh: '\u5206\u6570', en: 'Score' },
        'table.totalGames': { zh: '\u603b\u573a\u6b21', en: 'Games' },
        'table.num': { zh: '#', en: '#' },
        'table.snakeLength': { zh: '\u86c7\u8eab\u957f\u5ea6', en: 'Length' },
        'table.duration': { zh: '\u6e38\u620f\u65f6\u957f', en: 'Duration' },
        'table.playedAt': { zh: '\u6e38\u620f\u65f6\u95f4', en: 'Played At' },
        'table.loginTime': { zh: '\u767b\u5f55\u65f6\u95f4', en: 'Login Time' },
        'table.ipAddress': { zh: 'IP \u5730\u5740', en: 'IP Address' },
        'table.highestScore': { zh: '\u6700\u9ad8\u5206', en: 'Best' },
        'empty.noGames': { zh: '\u8fd8\u6ca1\u6709\u6e38\u620f\u8bb0\u5f55\uff0c\u5feb\u53bb\u73a9\u4e00\u5c40\u5427\uff01\ud83d\udc0d', en: 'No games yet. Go play! \ud83d\udc0d' },
        'empty.noLeaderboard': { zh: '\u6682\u65e0\u6392\u884c\u6570\u636e', en: 'No ranking data' },
        'empty.noLogins': { zh: '\u6682\u65e0\u767b\u5f55\u8bb0\u5f55', en: 'No login records' },
        'loading': { zh: '\u52a0\u8f7d\u4e2d...', en: 'Loading...' },
        'loadFail': { zh: '\u52a0\u8f7d\u5931\u8d25', en: 'Load failed' },
        'unknown': { zh: '\u672a\u77e5', en: 'Unknown' },
        'today': { zh: '\u4eca\u5929', en: 'Today' },
        'justNow': { zh: '\u521a\u521a', en: 'Just now' },
        'minutesAgo': { zh: ' \u5206\u949f\u524d', en: ' min ago' },
        'game.round': { zh: '\u7b2c {n} \u5c40', en: 'Game {n}' },
        'error.network': { zh: '\u7f51\u7edc\u9519\u8bef\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5', en: 'Network error, please try again' },
        'error.passwordMismatch': { zh: '\u4e24\u6b21\u5bc6\u7801\u8f93\u5165\u4e0d\u4e00\u81f4', en: 'Passwords do not match' },
        'error.saveFail': { zh: '\u4fdd\u5b58\u6e38\u620f\u8bb0\u5f55\u5931\u8d25', en: 'Failed to save game record' },
    },

    t(key, params) {
        const entry = this.translations[key];
        if (!entry) return key;
        let text = entry[this.currentLang] || entry['zh'] || key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(`{${k}}`, v);
            }
        }
        return text;
    },

    setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem('snake_lang', lang);
        this.applyTranslations();
        this.updateToggleButton();
    },

    toggleLang() {
        this.setLang(this.currentLang === 'zh' ? 'en' : 'zh');
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
        document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: this.currentLang } }));
    },

    updateToggleButton() {
        const btn = document.getElementById('langToggleBtn');
        if (btn) {
            btn.textContent = this.currentLang === 'zh' ? 'EN' : '\u4e2d';
            btn.title = this.currentLang === 'zh' ? 'Switch to English' : '\u5207\u6362\u5230\u4e2d\u6587';
        }
    },

    init() {
        this.applyTranslations();
        this.updateToggleButton();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    I18N.init();
});
