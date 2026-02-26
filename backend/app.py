from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import sqlite3
import os
import json
import math
import random

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), 'volunteer_hub.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT DEFAULT '',
            avatar_initials TEXT DEFAULT '',
            is_verified INTEGER DEFAULT 0,
            is_organization INTEGER DEFAULT 0,
            member_since TEXT DEFAULT '',
            rating REAL DEFAULT 0.0,
            total_hours REAL DEFAULT 0.0,
            tasks_completed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_skills (
            user_id INTEGER,
            skill_id INTEGER,
            PRIMARY KEY (user_id, skill_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (skill_id) REFERENCES skills(id)
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            posted_by INTEGER,
            assigned_to INTEGER DEFAULT NULL,
            status TEXT DEFAULT 'open',
            duration_minutes INTEGER DEFAULT 60,
            location_address TEXT DEFAULT '',
            city TEXT DEFAULT '',
            latitude REAL DEFAULT 0.0,
            longitude REAL DEFAULT 0.0,
            is_verified INTEGER DEFAULT 0,
            scheduled_date TEXT DEFAULT '',
            scheduled_time TEXT DEFAULT '',
            completion_photo TEXT DEFAULT '',
            completion_notes TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            completed_at TEXT DEFAULT NULL,
            FOREIGN KEY (posted_by) REFERENCES users(id),
            FOREIGN KEY (assigned_to) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS task_skills (
            task_id INTEGER,
            skill_id INTEGER,
            PRIMARY KEY (task_id, skill_id),
            FOREIGN KEY (task_id) REFERENCES tasks(id),
            FOREIGN KEY (skill_id) REFERENCES skills(id)
        );

        CREATE TABLE IF NOT EXISTS availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            task_id INTEGER DEFAULT NULL,
            content TEXT NOT NULL,
            image_url TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            likes INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            badge_name TEXT NOT NULL,
            badge_icon TEXT DEFAULT '',
            earned_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS impact_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            task_id INTEGER,
            hours_logged REAL DEFAULT 0,
            items_fixed INTEGER DEFAULT 0,
            bags_collected INTEGER DEFAULT 0,
            people_helped INTEGER DEFAULT 0,
            carbon_saved_kg REAL DEFAULT 0.0,
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        );
    ''')

    # Seed skills
    skills = ['Heavy Lifting', 'Tech Help', 'Gardening', 'Transportation',
              'Cleaning', 'Cooking', 'Tutoring', 'Pet Care', 'Repairs', 'Arts & Crafts']
    for skill in skills:
        c.execute("INSERT OR IGNORE INTO skills (name) VALUES (?)", (skill,))

    # Seed users if empty
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        users = [
            ('John Doe', 'john@example.com', 'JD', 1, 0, 'January 2026', 4.9, 12.0, 5),
            ('Sarah Johnson', 'sarah@example.com', 'SJ', 1, 0, 'December 2025', 4.9, 45.0, 23),
            ('Mike Chen', 'mike@example.com', 'MC', 1, 0, 'November 2025', 4.7, 30.0, 15),
            ('Margaret Wilson', 'margaret@example.com', 'MW', 1, 0, 'October 2025', 4.8, 8.0, 3),
            ('Emily Davis', 'emily@example.com', 'ED', 1, 0, 'January 2026', 4.6, 20.0, 10),
            ('Community Garden Org', 'garden@example.com', 'CG', 1, 1, 'September 2025', 5.0, 100.0, 50),
            ('Local Library', 'library@example.com', 'LL', 1, 1, 'August 2025', 4.9, 200.0, 80),
        ]
        for u in users:
            c.execute("""INSERT INTO users (name, email, avatar_initials, is_verified, is_organization,
                        member_since, rating, total_hours, tasks_completed)
                        VALUES (?,?,?,?,?,?,?,?,?)""", u)

        # Assign skills to users
        user_skill_map = {
            1: [1, 4], 2: [3, 5], 3: [2, 9], 4: [4, 5], 5: [6, 7]
        }
        for uid, sids in user_skill_map.items():
            for sid in sids:
                c.execute("INSERT OR IGNORE INTO user_skills VALUES (?,?)", (uid, sid))

        # Seed tasks
        cities = ['Bath', 'Birmingham', 'Bristol', 'Cardiff', 'Edinburgh',
                'Exeter', 'Glasgow', 'Leeds', 'Liverpool', 'London',
                'Manchester', 'Newcastle', 'Plymouth', 'Sheffield', 'Southampton']
        tasks_data = [
            ('Help elderly neighbor with grocery shopping', 'Need someone to help carry groceries from NTUC to my home. Heavy items involved.', 4, None, 'open', 60, '123 Oak Street', cities[0], 1.3521, 103.8198, 1, '2026-02-14', '14:00'),
            ('Community garden weeding session', 'Weekly weeding at the community garden. Tools provided.', 6, None, 'open', 120, '45 Garden Ave', cities[1], 1.3496, 103.9568, 1, '2026-02-15', '09:00'),
            ('Teach basic computer skills to seniors', 'Help seniors learn to use smartphones and email at the community center.', 7, None, 'open', 90, '78 Library Road', cities[2], 1.3329, 103.7436, 1, '2026-02-16', '10:00'),
            ('Dog walking for recovering patient', 'I recently had surgery and need help walking my golden retriever for 2 weeks.', 5, None, 'open', 30, '56 Maple Drive', cities[3], 1.4382, 103.7890, 1, '2026-02-17', '08:00'),
            ('Sort donations at food bank', 'Help organize and sort incoming food donations.', 6, 2, 'completed', 120, '200 Charity Lane', cities[4], 1.3236, 103.9273, 1, '2026-02-10', '09:00'),
            ('Paint community mural', 'Help paint a neighborhood mural on the community center wall.', 6, None, 'open', 180, '15 Art Street', cities[5], 1.3691, 103.8454, 1, '2026-02-20', '10:00'),
            ('Litter picking at East Coast Park', 'Monthly cleanup drive at the beach. Bags and gloves provided.', 6, None, 'open', 90, 'East Coast Park', cities[0], 1.3008, 103.9122, 1, '2026-02-22', '07:00'),
            ('Help with house moving', 'Moving to a new apartment. Need help carrying boxes.', 4, None, 'open', 180, '88 Block Street', cities[1], 1.3530, 103.9440, 1, '2026-02-25', '09:00'),
            ('Cooking meals for shelter', 'Prepare meals for 20 people at the homeless shelter.', 7, None, 'open', 120, '30 Shelter Road', cities[2], 1.3350, 103.7500, 1, '2026-02-28', '11:00'),
            ('Fix leaky faucet for elderly resident', 'Simple plumbing repair needed at elderly resident home.', 4, None, 'open', 60, '12 Resident Lane', cities[3], 1.4400, 103.7850, 1, '2026-03-01', '14:00'),
        ]
        for t in tasks_data:
            c.execute("""INSERT INTO tasks (title, description, posted_by, assigned_to, status,
                        duration_minutes, location_address, city, latitude, longitude, is_verified,
                        scheduled_date, scheduled_time)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""", t)

        # Task skills
        task_skill_map = {
            1: [1, 4], 2: [3], 3: [2, 7], 4: [8], 5: [1, 5],
            6: [10], 7: [5], 8: [1], 9: [6], 10: [9]
        }
        for tid, sids in task_skill_map.items():
            for sid in sids:
                c.execute("INSERT OR IGNORE INTO task_skills VALUES (?,?)", (tid, sid))

        # Seed community posts
        posts = [
            (2, 5, 'It was wonderful helping Margaret today! She had so many stories to share while we sorted groceries together. Small acts of kindness really do make a difference.', '', 12),
            (3, None, 'Just finished a great tutoring session at the library. The seniors are getting so good with their phones!', '', 8),
            (1, None, 'Looking forward to the community garden session this weekend. Who else is joining?', '', 5),
        ]
        for p in posts:
            c.execute("INSERT INTO community_posts (user_id, task_id, content, image_url, likes) VALUES (?,?,?,?,?)", p)

        # Seed achievements
        achievement_data = [
            (1, 'First Step', '⭐'), (1, 'Helping Hand', '🏆'),
            (1, 'Community Hero', '❤️'), (1, 'Bullseye', '🎯'),
            (2, 'First Step', '⭐'), (2, 'Helping Hand', '🏆'),
            (2, 'Community Hero', '❤️'), (2, 'Bullseye', '🎯'),
            (2, 'Super Volunteer', '🌟'),
        ]
        for a in achievement_data:
            c.execute("INSERT INTO achievements (user_id, badge_name, badge_icon) VALUES (?,?,?)", a)

        # Seed impact reports
        impact_data = [
            (2, 5, 2.0, 0, 5, 3, 1.2, 'Sorted 5 bags of donations'),
            (1, 1, 1.0, 0, 0, 1, 0.5, 'Helped Margaret with groceries'),
            (3, 3, 1.5, 2, 0, 5, 0.0, 'Taught 5 seniors email basics'),
        ]
        for i in impact_data:
            c.execute("""INSERT INTO impact_reports (user_id, task_id, hours_logged, items_fixed,
                        bags_collected, people_helped, carbon_saved_kg, notes) VALUES (?,?,?,?,?,?,?,?)""", i)

        # Seed availability
        avail = [
            (2, '2026-02-18', '14:00', '16:00'),
            (2, '2026-02-20', '09:00', '12:00'),
            (3, '2026-02-19', '10:00', '14:00'),
            (5, '2026-02-18', '13:00', '17:00'),
        ]
        for a in avail:
            c.execute("INSERT INTO availability (user_id, date, start_time, end_time) VALUES (?,?,?,?)", a)

    conn.commit()
    conn.close()


# ============ AUTH ROUTES ============
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.get('email', ''),)).fetchone()
    conn.close()
    if user:
        return jsonify(dict(user))
    return jsonify({"error": "User not found"}), 404

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name', '')
    email = data.get('email', '')
    initials = ''.join([w[0].upper() for w in name.split()[:2]]) if name else '??'
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute("""INSERT INTO users (name, email, avatar_initials, member_since)
                    VALUES (?, ?, ?, ?)""", (name, email, initials, datetime.now().strftime('%B %Y')))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (c.lastrowid,)).fetchone()
        conn.close()
        return jsonify(dict(user)), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Email already exists"}), 400


# ============ TASKS ROUTES ============
TASK_LIMIT_PER_DAY = 5  # Max tasks a user can post in 24 hours

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    city = request.args.get('city', '')
    status = request.args.get('status', '')
    skill = request.args.get('skill', '')
    user_id = request.args.get('user_id', '')

    conn = get_db()
    query = """
        SELECT t.*, u.name as poster_name, u.avatar_initials as poster_initials,
               u.is_verified as poster_verified, u.is_organization as poster_is_org
        FROM tasks t
        JOIN users u ON t.posted_by = u.id
        WHERE 1=1
    """
    params = []

    if city:
        query += " AND t.city = ?"
        params.append(city)
    if status:
        query += " AND t.status = ?"
        params.append(status)
    if user_id:
        query += " AND (t.posted_by = ? OR t.assigned_to = ?)"
        params.extend([user_id, user_id])

    query += " ORDER BY t.created_at DESC"
    tasks = conn.execute(query, params).fetchall()
    result = []
    for task in tasks:
        t = dict(task)
        skills = conn.execute("""
            SELECT s.name FROM skills s
            JOIN task_skills ts ON s.id = ts.skill_id
            WHERE ts.task_id = ?
        """, (t['id'],)).fetchall()
        t['skills'] = [s['name'] for s in skills]

        if skill and skill not in t['skills']:
            continue
        result.append(t)

    conn.close()
    return jsonify(result)

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Get a single task by ID with full details."""
    conn = get_db()
    task = conn.execute("""
        SELECT t.*, u.name as poster_name, u.avatar_initials as poster_initials,
               u.is_verified as poster_verified
        FROM tasks t JOIN users u ON t.posted_by = u.id
        WHERE t.id = ?
    """, (task_id,)).fetchone()
    if not task:
        conn.close()
        return jsonify({"error": "Task not found"}), 404
    t = dict(task)
    skills = conn.execute("""
        SELECT s.name FROM skills s JOIN task_skills ts ON s.id = ts.skill_id
        WHERE ts.task_id = ?
    """, (t['id'],)).fetchall()
    t['skills'] = [s['name'] for s in skills]
    conn.close()
    return jsonify(t)

@app.route('/api/tasks/posted/<int:user_id>', methods=['GET'])
def get_posted_tasks(user_id):
    """Get all tasks posted by a specific user, with a count summary."""
    conn = get_db()
    tasks = conn.execute("""
        SELECT t.*, u.name as poster_name, u.avatar_initials as poster_initials
        FROM tasks t JOIN users u ON t.posted_by = u.id
        WHERE t.posted_by = ?
        ORDER BY t.created_at DESC
    """, (user_id,)).fetchall()

    result = []
    status_counts = {'open': 0, 'accepted': 0, 'completed': 0}
    for task in tasks:
        t = dict(task)
        skills = conn.execute("""
            SELECT s.name FROM skills s JOIN task_skills ts ON s.id = ts.skill_id
            WHERE ts.task_id = ?
        """, (t['id'],)).fetchall()
        t['skills'] = [s['name'] for s in skills]
        result.append(t)
        s = t.get('status', 'open')
        if s in status_counts:
            status_counts[s] += 1

    # Check how many tasks posted in the last 24 hours for rate limit info
    recent_count = conn.execute("""
        SELECT COUNT(*) as cnt FROM tasks
        WHERE posted_by = ? AND created_at >= datetime('now', '-1 day')
    """, (user_id,)).fetchone()['cnt']

    conn.close()
    return jsonify({
        "tasks": result,
        "total": len(result),
        "status_counts": status_counts,
        "posts_today": recent_count,
        "daily_limit": TASK_LIMIT_PER_DAY,
        "can_post": recent_count < TASK_LIMIT_PER_DAY
    })

@app.route('/api/tasks/limit/<int:user_id>', methods=['GET'])
def check_task_limit(user_id):
    """Check if a user can still post tasks today."""
    conn = get_db()
    recent_count = conn.execute("""
        SELECT COUNT(*) as cnt FROM tasks
        WHERE posted_by = ? AND created_at >= datetime('now', '-1 day')
    """, (user_id,)).fetchone()['cnt']
    conn.close()
    return jsonify({
        "posts_today": recent_count,
        "daily_limit": TASK_LIMIT_PER_DAY,
        "remaining": max(0, TASK_LIMIT_PER_DAY - recent_count),
        "can_post": recent_count < TASK_LIMIT_PER_DAY
    })

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    conn = get_db()
    c = conn.cursor()

    # ---- Rate limit check ----
    poster_id = data.get('posted_by', 1)
    recent_count = conn.execute("""
        SELECT COUNT(*) as cnt FROM tasks
        WHERE posted_by = ? AND created_at >= datetime('now', '-1 day')
    """, (poster_id,)).fetchone()['cnt']

    if recent_count >= TASK_LIMIT_PER_DAY:
        conn.close()
        return jsonify({
            "error": "Daily task limit reached",
            "message": f"You can only post {TASK_LIMIT_PER_DAY} tasks per day. Please try again tomorrow.",
            "posts_today": recent_count,
            "daily_limit": TASK_LIMIT_PER_DAY
        }), 429

    # Simple AI: auto-suggest skills from description
    description = (data.get('description', '') + ' ' + data.get('title', '')).lower()
    skill_keywords = {
        'Heavy Lifting': ['heavy', 'carry', 'move', 'lift', 'boxes'],
        'Tech Help': ['computer', 'tech', 'phone', 'email', 'software', 'internet'],
        'Gardening': ['garden', 'plant', 'weed', 'mow', 'lawn', 'flower'],
        'Transportation': ['drive', 'transport', 'pickup', 'delivery', 'grocery'],
        'Cleaning': ['clean', 'sweep', 'mop', 'tidy', 'organize', 'sort', 'litter'],
        'Cooking': ['cook', 'meal', 'food', 'bake', 'kitchen'],
        'Tutoring': ['teach', 'tutor', 'lesson', 'homework', 'learn'],
        'Pet Care': ['dog', 'cat', 'pet', 'walk', 'feed', 'animal'],
        'Repairs': ['fix', 'repair', 'plumb', 'electric', 'paint', 'faucet'],
        'Arts & Crafts': ['art', 'craft', 'paint', 'draw', 'mural', 'creative']
    }

    auto_skills = data.get('skills', [])
    if not auto_skills:
        for skill_name, keywords in skill_keywords.items():
            if any(kw in description for kw in keywords):
                auto_skills.append(skill_name)

    city = data.get('city', 'UK')

    c.execute("""INSERT INTO tasks (title, description, posted_by, duration_minutes,
                location_address, city, latitude, longitude, is_verified, scheduled_date, scheduled_time)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
              (data.get('title'), data.get('description', ''), data.get('posted_by', 1),
               data.get('duration_minutes', 60), data.get('location_address', ''),
               city, data.get('latitude', 1.3521), data.get('longitude', 103.8198),
               0, data.get('scheduled_date', ''), data.get('scheduled_time', '')))
    task_id = c.lastrowid

    for skill_name in auto_skills:
        skill = conn.execute("SELECT id FROM skills WHERE name = ?", (skill_name,)).fetchone()
        if skill:
            c.execute("INSERT OR IGNORE INTO task_skills VALUES (?,?)", (task_id, skill['id']))

    conn.commit()
    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    return jsonify({**dict(task), 'skills': auto_skills, 'ai_suggested_skills': auto_skills}), 201

@app.route('/api/tasks/active/<int:user_id>', methods=['GET'])
def get_active_tasks(user_id):
    """Check if a user has any incomplete accepted tasks."""
    conn = get_db()
    active = conn.execute("""
        SELECT t.*, u.name as poster_name
        FROM tasks t JOIN users u ON t.posted_by = u.id
        WHERE t.assigned_to = ? AND t.status = 'accepted'
        ORDER BY t.scheduled_date, t.scheduled_time
    """, (user_id,)).fetchall()
    result = [dict(a) for a in active]
    conn.close()
    return jsonify({
        "active_tasks": result,
        "count": len(result),
        "has_active": len(result) > 0
    })

@app.route('/api/tasks/<int:task_id>/accept', methods=['POST'])
def accept_task(task_id):
    data = request.json
    user_id = data.get('user_id')
    conn = get_db()

    # Block acceptance if user already has an incomplete task
    active_count = conn.execute(
        "SELECT COUNT(*) as cnt FROM tasks WHERE assigned_to = ? AND status = 'accepted'",
        (user_id,)
    ).fetchone()['cnt']

    if active_count > 0:
        conn.close()
        return jsonify({
            "error": "active_task_exists",
            "message": "You must complete your current task before accepting a new one."
        }), 409

    conn.execute("UPDATE tasks SET assigned_to = ?, status = 'accepted' WHERE id = ?",
                 (user_id, task_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Task accepted"})

@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    data = request.json
    conn = get_db()

    # Save completion photo and notes
    completion_photo = data.get('completion_photo', '')
    completion_notes = data.get('notes', 'Task completed')

    conn.execute("""UPDATE tasks SET status = 'completed', completed_at = datetime('now'),
                    completion_photo = ?, completion_notes = ? WHERE id = ?""",
                 (completion_photo, completion_notes, task_id))

    # Auto-create impact report
    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if task:
        hours = task['duration_minutes'] / 60.0
        user_id = data.get('user_id', task['assigned_to'] or task['posted_by'])
        conn.execute("""INSERT INTO impact_reports (user_id, task_id, hours_logged, people_helped, carbon_saved_kg, notes)
                       VALUES (?, ?, ?, 1, ?, ?)""",
                     (user_id, task_id, hours, round(hours * 0.4, 2), completion_notes))

        # Update user stats for the volunteer who completed it
        if user_id:
            conn.execute("UPDATE users SET total_hours = total_hours + ?, tasks_completed = tasks_completed + 1 WHERE id = ?",
                         (hours, user_id))

    conn.commit()
    conn.close()
    return jsonify({"message": "Task completed", "status": "completed"})

@app.route('/api/tasks/cities', methods=['GET'])
def get_cities():
    conn = get_db()
    cities = conn.execute("SELECT DISTINCT city FROM tasks WHERE city != '' ORDER BY city").fetchall()
    conn.close()
    return jsonify([c['city'] for c in cities])

@app.route('/api/tasks/ai-match/<int:user_id>', methods=['GET'])
def ai_match_tasks(user_id):
    conn = get_db()
    user_skills = conn.execute("""
        SELECT s.name FROM skills s
        JOIN user_skills us ON s.id = us.skill_id
        WHERE us.user_id = ?
    """, (user_id,)).fetchall()
    user_skill_names = {s['name'] for s in user_skills}

    tasks = conn.execute("""
        SELECT t.*, u.name as poster_name, u.avatar_initials as poster_initials,
               u.is_verified as poster_verified
        FROM tasks t JOIN users u ON t.posted_by = u.id
        WHERE t.status = 'open' AND t.assigned_to IS NULL
        ORDER BY t.created_at DESC
    """).fetchall()

    scored_tasks = []
    for task in tasks:
        t = dict(task)
        task_skills = conn.execute("""
            SELECT s.name FROM skills s JOIN task_skills ts ON s.id = ts.skill_id
            WHERE ts.task_id = ?
        """, (t['id'],)).fetchall()
        t['skills'] = [s['name'] for s in task_skills]

        # Score: skill match + proximity + recency
        skill_match = len(set(t['skills']) & user_skill_names)
        total_skills = max(len(t['skills']), 1)
        match_pct = int((skill_match / total_skills) * 80 + random.randint(10, 20))
        match_pct = min(match_pct, 99)
        t['match_score'] = match_pct
        scored_tasks.append(t)

    scored_tasks.sort(key=lambda x: x['match_score'], reverse=True)
    conn.close()
    return jsonify(scored_tasks)


# ============ VOLUNTEERS ROUTES ============
@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    skill = request.args.get('skill', '')
    conn = get_db()

    query = """
        SELECT u.*, GROUP_CONCAT(DISTINCT s.name) as skill_names
        FROM users u
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.id
        WHERE u.is_organization = 0
        GROUP BY u.id
    """
    volunteers = conn.execute(query).fetchall()
    result = []
    for v in volunteers:
        vd = dict(v)
        vd['skills'] = vd['skill_names'].split(',') if vd['skill_names'] else []
        del vd['skill_names']

        # Get availability
        avails = conn.execute("SELECT * FROM availability WHERE user_id = ? AND date >= date('now') ORDER BY date LIMIT 3",
                              (vd['id'],)).fetchall()
        vd['availability'] = [dict(a) for a in avails]
        vd['distance_km'] = round(random.uniform(0.2, 5.0), 1)

        if skill and skill not in vd['skills']:
            continue
        result.append(vd)

    conn.close()
    return jsonify(result)


# ============ AVAILABILITY ROUTES ============
@app.route('/api/availability', methods=['POST'])
def post_availability():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO availability (user_id, date, start_time, end_time) VALUES (?,?,?,?)",
              (data['user_id'], data['date'], data['start_time'], data['end_time']))

    # Update user skills if provided
    if 'skills' in data:
        c.execute("DELETE FROM user_skills WHERE user_id = ?", (data['user_id'],))
        for skill_name in data['skills']:
            skill = conn.execute("SELECT id FROM skills WHERE name = ?", (skill_name,)).fetchone()
            if skill:
                c.execute("INSERT OR IGNORE INTO user_skills VALUES (?,?)", (data['user_id'], skill['id']))

    conn.commit()
    conn.close()
    return jsonify({"message": "Availability posted"}), 201

@app.route('/api/availability/<int:user_id>', methods=['GET'])
def get_availability(user_id):
    conn = get_db()
    avails = conn.execute("SELECT * FROM availability WHERE user_id = ? ORDER BY date", (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(a) for a in avails])


# ============ SCHEDULE ROUTES ============
@app.route('/api/schedule/<int:user_id>', methods=['GET'])
def get_schedule(user_id):
    include_completed = request.args.get('include_completed', 'false') == 'true'
    conn = get_db()

    status_filter = "('accepted', 'open', 'completed')" if include_completed else "('accepted', 'open')"

    tasks = conn.execute(f"""
        SELECT t.*, u.name as poster_name
        FROM tasks t JOIN users u ON t.posted_by = u.id
        WHERE (t.assigned_to = ? OR t.posted_by = ?) AND t.status IN {status_filter}
        ORDER BY t.scheduled_date, t.scheduled_time
    """, (user_id, user_id)).fetchall()
    result = []
    for t in tasks:
        td = dict(t)
        skills = conn.execute("SELECT s.name FROM skills s JOIN task_skills ts ON s.id = ts.skill_id WHERE ts.task_id = ?",
                              (td['id'],)).fetchall()
        td['skills'] = [s['name'] for s in skills]
        result.append(td)
    conn.close()
    return jsonify(result)


# ============ COMMUNITY ROUTES ============
@app.route('/api/community', methods=['GET'])
def get_community_posts():
    conn = get_db()
    posts = conn.execute("""
        SELECT cp.*, u.name as author_name, u.avatar_initials, u.is_verified,
               t.title as task_title, t.duration_minutes as task_duration, t.location_address as task_location
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN tasks t ON cp.task_id = t.id
        ORDER BY cp.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(p) for p in posts])

@app.route('/api/community', methods=['POST'])
def create_community_post():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO community_posts (user_id, task_id, content, image_url) VALUES (?,?,?,?)",
              (data['user_id'], data.get('task_id'), data['content'], data.get('image_url', '')))
    conn.commit()
    conn.close()
    return jsonify({"message": "Post created"}), 201

@app.route('/api/community/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    conn = get_db()
    conn.execute("UPDATE community_posts SET likes = likes + 1 WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Liked"})


# ============ PROFILE & IMPACT ROUTES ============
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Not found"}), 404

    ud = dict(user)
    skills = conn.execute("""
        SELECT s.name FROM skills s JOIN user_skills us ON s.id = us.skill_id WHERE us.user_id = ?
    """, (user_id,)).fetchall()
    ud['skills'] = [s['name'] for s in skills]

    achievements = conn.execute("SELECT * FROM achievements WHERE user_id = ?", (user_id,)).fetchall()
    ud['achievements'] = [dict(a) for a in achievements]

    # Count tasks posted by this user
    posted_counts = conn.execute("""
        SELECT
            COUNT(*) as total_posted,
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_posted,
            SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_posted,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_posted
        FROM tasks WHERE posted_by = ?
    """, (user_id,)).fetchone()
    ud['posted_tasks'] = dict(posted_counts)

    conn.close()
    return jsonify(ud)

@app.route('/api/users/<int:user_id>/impact', methods=['GET'])
def get_impact(user_id):
    conn = get_db()
    reports = conn.execute("""
        SELECT ir.*, t.title as task_title
        FROM impact_reports ir
        LEFT JOIN tasks t ON ir.task_id = t.id
        WHERE ir.user_id = ?
        ORDER BY ir.created_at DESC
    """, (user_id,)).fetchall()

    # Aggregate
    totals = conn.execute("""
        SELECT
            COALESCE(SUM(hours_logged), 0) as total_hours,
            COALESCE(SUM(items_fixed), 0) as total_items_fixed,
            COALESCE(SUM(bags_collected), 0) as total_bags,
            COALESCE(SUM(people_helped), 0) as total_people,
            COALESCE(SUM(carbon_saved_kg), 0) as total_carbon,
            COUNT(*) as total_reports
        FROM impact_reports WHERE user_id = ?
    """, (user_id,)).fetchone()

    conn.close()
    return jsonify({
        "reports": [dict(r) for r in reports],
        "totals": dict(totals)
    })

@app.route('/api/impact/community', methods=['GET'])
def community_impact():
    conn = get_db()
    totals = conn.execute("""
        SELECT
            COALESCE(SUM(hours_logged), 0) as total_hours,
            COALESCE(SUM(items_fixed), 0) as total_items_fixed,
            COALESCE(SUM(bags_collected), 0) as total_bags,
            COALESCE(SUM(people_helped), 0) as total_people,
            COALESCE(SUM(carbon_saved_kg), 0) as total_carbon,
            COUNT(DISTINCT user_id) as total_volunteers
        FROM impact_reports
    """).fetchone()

    # Top volunteers
    top = conn.execute("""
        SELECT u.name, u.avatar_initials, SUM(ir.hours_logged) as hours
        FROM impact_reports ir JOIN users u ON ir.user_id = u.id
        GROUP BY ir.user_id ORDER BY hours DESC LIMIT 5
    """).fetchall()

    conn.close()
    return jsonify({
        "totals": dict(totals),
        "top_volunteers": [dict(t) for t in top]
    })


# ============ SKILLS ROUTE ============
@app.route('/api/skills', methods=['GET'])
def get_skills():
    conn = get_db()
    skills = conn.execute("SELECT * FROM skills ORDER BY name").fetchall()
    conn.close()
    return jsonify([dict(s) for s in skills])


# ============ SERVE REACT ============
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000, host='0.0.0.0')
