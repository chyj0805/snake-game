"""
数据库模块 - SQLite 数据库初始化与操作
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snake_game.db')


def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            duration_seconds REAL NOT NULL DEFAULT 0,
            snake_length INTEGER NOT NULL DEFAULT 3,
            played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()


def create_user(username, password_hash):
    """创建新用户"""
    conn = get_db()
    try:
        conn.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, password_hash))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_user_by_username(username):
    """根据用户名查找用户"""
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    return user


def get_user_by_id(user_id):
    """根据 ID 查找用户"""
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user


def log_login(user_id, ip_address):
    """记录登录日志"""
    conn = get_db()
    conn.execute('INSERT INTO login_logs (user_id, ip_address) VALUES (?, ?)', (user_id, ip_address))
    conn.commit()
    conn.close()


def get_login_history(user_id, limit=20):
    """获取用户登录历史"""
    conn = get_db()
    logs = conn.execute('SELECT * FROM login_logs WHERE user_id = ? ORDER BY login_time DESC LIMIT ?', (user_id, limit)).fetchall()
    conn.close()
    return logs


def save_game_record(user_id, score, duration_seconds, snake_length):
    """保存游戏记录"""
    conn = get_db()
    conn.execute('INSERT INTO game_records (user_id, score, duration_seconds, snake_length) VALUES (?, ?, ?, ?)', (user_id, score, duration_seconds, snake_length))
    conn.commit()
    conn.close()


def get_game_history(user_id, limit=50):
    """获取用户游戏历史"""
    conn = get_db()
    records = conn.execute('SELECT * FROM game_records WHERE user_id = ? ORDER BY played_at DESC LIMIT ?', (user_id, limit)).fetchall()
    conn.close()
    return records


def get_user_stats(user_id):
    """获取用户游戏统计数据"""
    conn = get_db()
    stats = conn.execute('''
        SELECT
            COUNT(*) as total_games,
            COALESCE(MAX(score), 0) as highest_score,
            COALESCE(ROUND(AVG(score), 1), 0) as avg_score,
            COALESCE(ROUND(SUM(duration_seconds), 1), 0) as total_play_time,
            COALESCE(MAX(snake_length), 3) as max_snake_length
        FROM game_records WHERE user_id = ?
    ''', (user_id,)).fetchone()
    conn.close()
    return stats


def get_leaderboard(limit=20):
    """获取排行榜（每个用户的最高分）"""
    conn = get_db()
    leaderboard = conn.execute('''
        SELECT u.username, MAX(g.score) as highest_score, COUNT(g.id) as total_games
        FROM game_records g
        JOIN users u ON g.user_id = u.id
        GROUP BY g.user_id
        ORDER BY highest_score DESC
        LIMIT ?
    ''', (limit,)).fetchall()
    conn.close()
    return leaderboard
