/**
 * 贪吃蛇游戏核心逻辑
 * 使用 HTML5 Canvas 渲染
 * 60fps requestAnimationFrame 渲染循环 + 独立逻辑帧
 */

// ===== 游戏配置 =====
const CONFIG = {
    GRID_SIZE: 20,        // 网格大小（像素）
    GRID_COUNT: 30,       // 网格数量 (600 / 20 = 30)
    INITIAL_SPEED: 120,   // 初始移动间隔（毫秒）
    SPEED_INCREMENT: 2,   // 每吃一个食物加速（毫秒）
    MIN_SPEED: 50,        // 最快速度
    SCORE_PER_FOOD: 10,   // 每个食物得分
    PARTICLE_COUNT: 15,   // 吃到食物时粒子数
};

// ===== 游戏状态 =====
let canvas, ctx;
let snake = [];
let food = { x: 0, y: 0 };
let direction = 'right';
let nextDirection = 'right';
let gameState = 'idle';  // idle | playing | paused | gameover
let score = 0;
let speed = CONFIG.INITIAL_SPEED;
let particles = [];
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;

// ===== 60fps 渲染循环相关 =====
let lastTickTime = 0;
let animFrameId = null;
let tickAccumulator = 0;

// ===== 蛇的平滑插值 =====
let prevSnake = [];
let tickProgress = 0;

// ===== 屏幕特效 =====
let screenShake = { intensity: 0, duration: 0, startTime: 0 };
let flashEffect = { alpha: 0, color: '#ff0000' };
let deathParticles = [];

// ===== 音效系统 =====
let audioCtx = null;  // Web Audio API 上下文（延迟初始化，符合浏览器自动播放策略）

/** 获取或创建音频上下文 */
function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * 播放吃食物音效
 * 短促的上扬音调 + 谐波，听起来像"叮！"
 */
function playEatSound() {
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;

        // 主音振荡器：音调从 520Hz 快速上扬到 880Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);

        // 叠加高频谐波，增加晶莹感
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1040, now);
        osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc2.start(now);
        osc2.stop(now + 0.12);
    } catch (e) {
        console.warn('[音效] 播放失败:', e);
    }
}

/**
 * 播放游戏结束音效
 * 低沉下降音调，听起来像"嗡—"
 */
function playGameOverSound() {
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } catch (e) {
        console.warn('[音效] 播放失败:', e);
    }
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    document.addEventListener('keydown', handleKeyDown);
    loadLeaderboard();
    startRenderLoop();
});

// ===== 60fps 渲染循环 =====

function startRenderLoop() {
    lastTickTime = performance.now();
    tickAccumulator = 0;

    function loop(timestamp) {
        animFrameId = requestAnimationFrame(loop);
        const deltaTime = timestamp - lastTickTime;
        lastTickTime = timestamp;

        if (gameState === 'playing') {
            tickAccumulator += deltaTime;
            while (tickAccumulator >= speed) {
                tickAccumulator -= speed;
                prevSnake = snake.map(s => ({ ...s }));
                gameTick();
                if (gameState !== 'playing') {
                    tickAccumulator = 0;
                    break;
                }
            }
            tickProgress = tickAccumulator / speed;
        }

        updateScreenEffects(timestamp);
        updateParticles();
        updateDeathParticles();
        render(timestamp);
    }

    animFrameId = requestAnimationFrame(loop);
}

// ===== 游戏控制 =====

function startGame() {
    snake = [];
    const startX = Math.floor(CONFIG.GRID_COUNT / 2);
    const startY = Math.floor(CONFIG.GRID_COUNT / 2);
    for (let i = 2; i >= 0; i--) {
        snake.push({ x: startX - i, y: startY });
    }
    prevSnake = snake.map(s => ({ ...s }));
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    speed = CONFIG.INITIAL_SPEED;
    particles = [];
    deathParticles = [];
    elapsedTime = 0;
    tickAccumulator = 0;
    screenShake = { intensity: 0, duration: 0, startTime: 0 };
    flashEffect = { alpha: 0, color: '#ff0000' };

    spawnFood();
    updateScoreDisplay();
    document.getElementById('snakeLength').textContent = snake.length;

    const overlay = document.getElementById('gameOverlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('overlay-gameover');
    canvas.parentElement.classList.remove('canvas-shake');
    document.getElementById('startBtn').textContent = I18N.t('btn.start');

    gameState = 'playing';
    startTime = Date.now();
    lastTickTime = performance.now();
    startTimer();
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        clearInterval(timerInterval);
        showOverlay(I18N.t('overlay.paused'), I18N.t('overlay.pauseText'), false);
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('gameOverlay').classList.add('hidden');
        startTime = Date.now() - elapsedTime * 1000;
        lastTickTime = performance.now();
        tickAccumulator = 0;
        startTimer();
    }
}

function gameOver() {
    gameState = 'gameover';
    clearInterval(timerInterval);

    // 播放游戏结束音效
    playGameOverSound();

    triggerScreenShake(16, 500);
    flashEffect = { alpha: 0.6, color: '#ff2222' };
    createDeathParticles();

    setTimeout(() => {
        showOverlay(I18N.t('overlay.gameOver'), I18N.t('overlay.tryAgain'), true);
        document.getElementById('finalScore').textContent = score;
        document.getElementById('startBtn').textContent = I18N.t('btn.playAgain');
        document.getElementById('gameOverlay').classList.add('overlay-gameover');
    }, 400);

    saveGameRecord();
}

// ===== 屏幕特效 =====

function triggerScreenShake(intensity, duration) {
    screenShake = { intensity, duration, startTime: performance.now() };
}

function updateScreenEffects(timestamp) {
    if (flashEffect.alpha > 0) {
        flashEffect.alpha *= 0.92;
        if (flashEffect.alpha < 0.01) flashEffect.alpha = 0;
    }
    if (screenShake.intensity > 0) {
        const elapsed = timestamp - screenShake.startTime;
        if (elapsed > screenShake.duration) screenShake.intensity = 0;
    }
}

function getShakeOffset(timestamp) {
    if (screenShake.intensity <= 0) return { x: 0, y: 0 };
    const elapsed = timestamp - screenShake.startTime;
    const progress = elapsed / screenShake.duration;
    const intensity = screenShake.intensity * (1 - progress);
    return {
        x: (Math.random() - 0.5) * 2 * intensity,
        y: (Math.random() - 0.5) * 2 * intensity
    };
}

// ===== 游戏逻辑帧 =====

function gameTick() {
    direction = nextDirection;
    const head = { ...snake[snake.length - 1] };
    switch (direction) {
        case 'up':    head.y--; break;
        case 'down':  head.y++; break;
        case 'left':  head.x--; break;
        case 'right': head.x++; break;
    }

    if (head.x < 0 || head.x >= CONFIG.GRID_COUNT || head.y < 0 || head.y >= CONFIG.GRID_COUNT) {
        gameOver(); return;
    }

    for (const segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
            gameOver(); return;
        }
    }

    snake.push(head);

    if (head.x === food.x && head.y === food.y) {
        score += CONFIG.SCORE_PER_FOOD;
        speed = Math.max(CONFIG.MIN_SPEED, speed - CONFIG.SPEED_INCREMENT);

        // 播放吃食物音效
        playEatSound();

        createParticles(food.x, food.y);
        spawnFood();
        updateScoreDisplay();
        document.getElementById('snakeLength').textContent = snake.length;
    } else {
        snake.shift();
    }
}

// ===== 渲染 =====

function render(timestamp) {
    ctx.save();
    const shake = getShakeOffset(timestamp || performance.now());
    ctx.translate(shake.x, shake.y);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);
    drawGrid();
    drawFood(timestamp || performance.now());
    drawSnake();
    drawParticles();
    drawDeathParticles();
    if (flashEffect.alpha > 0) {
        ctx.fillStyle = flashEffect.color;
        ctx.globalAlpha = flashEffect.alpha;
        ctx.fillRect(-20, -20, canvas.width + 40, canvas.height + 40);
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CONFIG.GRID_COUNT; i++) {
        const pos = i * CONFIG.GRID_SIZE;
        ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos); ctx.stroke();
    }
}

function drawSnake() {
    const len = snake.length;
    for (let i = 0; i < len; i++) {
        const segment = snake[i];
        const ratio = i / (len - 1 || 1);
        const r = Math.floor(20 + ratio * 54);
        const g = Math.floor(150 + ratio * 72);
        const b = Math.floor(60 + ratio * 68);
        let x = segment.x * CONFIG.GRID_SIZE;
        let y = segment.y * CONFIG.GRID_SIZE;

        if (i === len - 1 && gameState === 'playing' && prevSnake.length > 0) {
            const prevHead = prevSnake[prevSnake.length - 1];
            if (prevHead) {
                const px = prevHead.x * CONFIG.GRID_SIZE;
                const py = prevHead.y * CONFIG.GRID_SIZE;
                x = px + (x - px) * tickProgress;
                y = py + (y - py) * tickProgress;
            }
        }

        const size = CONFIG.GRID_SIZE;
        const padding = 1;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        ctx.shadowBlur = i === len - 1 ? 14 : 5;
        const radius = i === len - 1 ? 6 : 3;
        roundRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, radius);
        ctx.fill();
        if (i === len - 1) drawSnakeEyes(x, y, direction);
        ctx.shadowBlur = 0;
    }
}

function drawSnakeEyes(x, y, dir) {
    const s = CONFIG.GRID_SIZE;
    const eyeSize = 3;
    ctx.fillStyle = '#0d1117';
    let eye1x, eye1y, eye2x, eye2y;
    switch (dir) {
        case 'right': eye1x = x + s - 6; eye1y = y + 5; eye2x = x + s - 6; eye2y = y + s - 5 - eyeSize; break;
        case 'left':  eye1x = x + 3; eye1y = y + 5; eye2x = x + 3; eye2y = y + s - 5 - eyeSize; break;
        case 'up':    eye1x = x + 5; eye1y = y + 3; eye2x = x + s - 5 - eyeSize; eye2y = y + 3; break;
        case 'down':  eye1x = x + 5; eye1y = y + s - 6; eye2x = x + s - 5 - eyeSize; eye2y = y + s - 6; break;
    }
    ctx.beginPath(); ctx.arc(eye1x, eye1y, eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eye2x, eye2y, eyeSize, 0, Math.PI * 2); ctx.fill();
}

function drawFood(timestamp) {
    const x = food.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
    const y = food.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
    const radius = CONFIG.GRID_SIZE / 2 - 2;
    const pulse = Math.sin((timestamp || 0) / 300) * 2;
    ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
    ctx.shadowBlur = 14 + pulse * 3;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius + pulse);
    gradient.addColorStop(0, '#fde68a');
    gradient.addColorStop(0.5, '#fbbf24');
    gradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ===== 粒子系统 =====

function createParticles(gridX, gridY) {
    const cx = gridX * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
    const cy = gridY * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / CONFIG.PARTICLE_COUNT + Math.random() * 0.5;
        const spd = 2 + Math.random() * 4;
        particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
            life: 1, decay: 0.015 + Math.random() * 0.02,
            size: 2 + Math.random() * 4,
            color: Math.random() > 0.5 ? '#fbbf24' : '#4ade80',
        });
    }
}

function createDeathParticles() {
    for (const segment of snake) {
        const cx = segment.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        const cy = segment.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 5;
            deathParticles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
                life: 1, decay: 0.008 + Math.random() * 0.015,
                size: 2 + Math.random() * 5,
                color: Math.random() > 0.3 ? '#f87171' : '#4ade80',
            });
        }
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.97; p.vy *= 0.97;
        p.life -= p.decay;
        return p.life > 0;
    });
}

function updateDeathParticles() {
    deathParticles = deathParticles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.96; p.vy *= 0.96;
        p.vy += 0.05;
        p.life -= p.decay;
        return p.life > 0;
    });
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawDeathParticles() {
    for (const p of deathParticles) {
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

// ===== 食物生成 =====

function spawnFood() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let attempts = 0;
    do {
        food.x = Math.floor(Math.random() * CONFIG.GRID_COUNT);
        food.y = Math.floor(Math.random() * CONFIG.GRID_COUNT);
        attempts++;
    } while (occupied.has(`${food.x},${food.y}`) && attempts < 1000);
}

// ===== 输入处理 =====

function handleKeyDown(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') startGame();
        else togglePause();
        return;
    }
    const key = e.key.toLowerCase();
    switch (key) {
        case 'arrowup': case 'w': e.preventDefault(); if (direction !== 'down') nextDirection = 'up'; break;
        case 'arrowdown': case 's': e.preventDefault(); if (direction !== 'up') nextDirection = 'down'; break;
        case 'arrowleft': case 'a': e.preventDefault(); if (direction !== 'right') nextDirection = 'left'; break;
        case 'arrowright': case 'd': e.preventDefault(); if (direction !== 'left') nextDirection = 'right'; break;
    }
}

function setDirection(dir) {
    if (gameState === 'idle' || gameState === 'gameover') { startGame(); return; }
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (direction !== opposites[dir]) nextDirection = dir;
}

// ===== UI 更新 =====

function updateScoreDisplay() {
    const scoreEl = document.getElementById('currentScore');
    scoreEl.textContent = score;
    scoreEl.style.transform = 'scale(1.3)';
    scoreEl.style.transition = 'transform 0.2s ease';
    setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 200);
    const highEl = document.getElementById('highestScore');
    const currentHigh = parseInt(highEl.textContent) || 0;
    if (score > currentHigh) {
        highEl.textContent = score;
        highEl.classList.add('neon-text');
    }
}

function showOverlay(title, text, showScore) {
    const overlay = document.getElementById('gameOverlay');
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayText').textContent = text;
    document.getElementById('overlayScore').style.display = showScore ? 'block' : 'none';
    overlay.classList.remove('hidden');
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsedTime = (Date.now() - startTime) / 1000;
        const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const secs = Math.floor(elapsedTime % 60).toString().padStart(2, '0');
        document.getElementById('gameTime').textContent = `${mins}:${secs}`;
    }, 1000);
}

// ===== 数据保存 =====

async function saveGameRecord() {
    try {
        await fetch('/api/game/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                score: score,
                duration_seconds: Math.round(elapsedTime * 10) / 10,
                snake_length: snake.length,
            })
        });
        loadLeaderboard();
    } catch (err) {
        console.error(I18N.t('error.saveFail'), err);
    }
}

async function loadLeaderboard() {
    const container = document.getElementById('leaderboardList');
    if (!container) return;
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        if (data.success && data.leaderboard.length > 0) {
            container.innerHTML = data.leaderboard.slice(0, 5).map((item, i) => {
                const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                const rankIcon = i === 0 ? '\ud83e\udd47' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : `${i + 1}`;
                return `<div class="leaderboard-item"><span class="lb-rank ${rankClass}">${rankIcon}</span><span class="lb-name">${escapeHtml(item.username)}</span><span class="lb-score">${item.highest_score}</span></div>`;
            }).join('');
        } else {
            container.innerHTML = `<div class="empty-text">${I18N.t('leaderboard.empty')}</div>`;
        }
    } catch (err) {
        container.innerHTML = `<div class="empty-text">${I18N.t('leaderboard.loadFail')}</div>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
