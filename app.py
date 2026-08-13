"""
Flask 应用主入口 - 网页版贪吃蛇游戏
"""
import os
import secrets
from functools import wraps
from flask import (
    Flask, render_template, request, redirect, url_for,
    session, jsonify, flash
)
import bcrypt
import database as db

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # 生成随机密钥用于 session


# ===== 工具函数 =====

def login_required(f):
    """登录验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def get_current_user():
    """获取当前登录用户"""
    if 'user_id' in session:
        return db.get_user_by_id(session['user_id'])
    return None


# ===== 页面路由 =====

@app.route('/')
def index():
    """首页 - 重定向到游戏页面或登录页面"""
    if 'user_id' in session:
        return redirect(url_for('game'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET'])
def login():
    """登录页面"""
    if 'user_id' in session:
        return redirect(url_for('game'))
    return render_template('login.html')


@app.route('/api/login', methods=['POST'])
def api_login():
    """处理登录请求"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': '请填写用户名和密码'}), 400

    user = db.get_user_by_username(username)
    if user is None:
        return jsonify({'success': False, 'message': '用户名或密码错误'}), 401

    # 验证密码
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'success': False, 'message': '用户名或密码错误'}), 401

    # 登录成功
    session['user_id'] = user['id']
    session['username'] = user['username']

    ip_address = request.remote_addr
    db.log_login(user['id'], ip_address)

    return jsonify({'success': True, 'message': '登录成功', 'redirect': url_for('game')})


@app.route('/api/register', methods=['POST'])
def api_register():
    """处理注册请求"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': '请填写用户名和密码'}), 400

    if len(username) < 2 or len(username) > 20:
        return jsonify({'success': False, 'message': '用户名长度需在 2-20 个字符之间'}), 400

    if len(password) < 4:
        return jsonify({'success': False, 'message': '密码长度至少 4 个字符'}), 400

    if password != confirm_password:
        return jsonify({'success': False, 'message': '两次密码输入不一致'}), 400

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    if not db.create_user(username, password_hash):
        return jsonify({'success': False, 'message': '用户名已被注册'}), 409

    user = db.get_user_by_username(username)
    session['user_id'] = user['id']
    session['username'] = user['username']
    db.log_login(user['id'], request.remote_addr)

    return jsonify({'success': True, 'message': '注册成功', 'redirect': url_for('game')})


@app.route('/logout', methods=['POST'])
def logout():
    """退出登录"""
    session.clear()
    return redirect(url_for('login'))


@app.route('/game')
@login_required
def game():
    """游戏主页面"""
    user = get_current_user()
    stats = db.get_user_stats(session['user_id'])
    return render_template('game.html', user=user, stats=stats)


@app.route('/dashboard')
@login_required
def dashboard():
    """个人数据仪表盘"""
    user = get_current_user()
    return render_template('dashboard.html', user=user)


@app.route('/api/game/save', methods=['POST'])
@login_required
def api_save_game():
    """保存游戏记录"""
    data = request.get_json()
    score = data.get('score', 0)
    duration = data.get('duration_seconds', 0)
    snake_length = data.get('snake_length', 3)
    db.save_game_record(session['user_id'], score, duration, snake_length)
    return jsonify({'success': True, 'message': '游戏记录已保存'})


@app.route('/api/game/history')
@login_required
def api_game_history():
    """获取游戏历史"""
    records = db.get_game_history(session['user_id'])
    return jsonify({'success': True, 'records': [dict(r) for r in records]})


@app.route('/api/game/stats')
@login_required
def api_game_stats():
    """获取游戏统计"""
    stats = db.get_user_stats(session['user_id'])
    return jsonify({'success': True, 'stats': dict(stats)})


@app.route('/api/leaderboard')
@login_required
def api_leaderboard():
    """获取排行榜"""
    leaderboard = db.get_leaderboard()
    return jsonify({'success': True, 'leaderboard': [dict(r) for r in leaderboard]})


@app.route('/api/login-history')
@login_required
def api_login_history():
    """获取登录历史"""
    logs = db.get_login_history(session['user_id'])
    return jsonify({'success': True, 'logs': [dict(l) for l in logs]})


if __name__ == '__main__':
    db.init_db()
    print("[Snake Game] Server starting...")
    print("[Snake Game] Visit http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
