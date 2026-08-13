/**
 * 登录/注册页面 - 前端逻辑
 */

// ===== 标签切换 =====
function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabIndicator = document.getElementById('tabIndicator');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        tabIndicator.classList.remove('register');
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        tabIndicator.classList.add('register');
    }

    // 清除错误信息
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

// ===== 登录处理 =====
async function handleLogin(event) {
    event.preventDefault();
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    errorEl.textContent = '';
    setButtonLoading(btn, true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = data.redirect;
        } else {
            errorEl.textContent = '\u274c ' + data.message;
            shakeElement(document.querySelector('.auth-card'));
        }
    } catch (err) {
        errorEl.textContent = '\u274c ' + I18N.t('error.network');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===== 注册处理 =====
async function handleRegister(event) {
    event.preventDefault();
    const errorEl = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    errorEl.textContent = '';

    if (password !== confirmPassword) {
        errorEl.textContent = '\u274c ' + I18N.t('error.passwordMismatch');
        return;
    }

    setButtonLoading(btn, true);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, confirm_password: confirmPassword })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = data.redirect;
        } else {
            errorEl.textContent = '\u274c ' + data.message;
            shakeElement(document.querySelector('.auth-card'));
        }
    } catch (err) {
        errorEl.textContent = '\u274c ' + I18N.t('error.network');
    } finally {
        setButtonLoading(btn, false);
    }
}

// ===== 工具函数 =====

/** 设置按钮加载状态 */
function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-loading');
    if (loading) {
        text.style.display = 'none';
        spinner.style.display = 'inline';
        btn.disabled = true;
    } else {
        text.style.display = 'inline';
        spinner.style.display = 'none';
        btn.disabled = false;
    }
}

/** 抖动动画 - 错误反馈 */
function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake 0.4s ease';
}

// 添加抖动动画关键帧
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

// ===== 背景粒子效果 =====
function initParticles() {
    const container = document.getElementById('bgParticles');
    if (!container) return;

    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 2;
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${Math.random() > 0.5 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(6, 182, 212, 0.2)'};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${8 + Math.random() * 12}s ease-in-out infinite;
            animation-delay: ${Math.random() * -10}s;
        `;
        container.appendChild(particle);
    }
}

const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes particleFloat {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        25% { transform: translate(30px, -40px) scale(1.2); opacity: 0.6; }
        50% { transform: translate(-20px, -80px) scale(0.8); opacity: 0.4; }
        75% { transform: translate(40px, -40px) scale(1.1); opacity: 0.5; }
    }
`;
document.head.appendChild(particleStyle);

document.addEventListener('DOMContentLoaded', initParticles);
