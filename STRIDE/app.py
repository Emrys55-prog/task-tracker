import os
import sqlite3
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, g
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------------------------------------------------
# App setup
# ---------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "tasks.db")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-this")  # replace in production


# ---------------------------------------------------------
# Database helpers
# ---------------------------------------------------------
def get_db():
    """Open a new DB connection if one doesn't exist for this request."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row          # rows behave like dicts
        g.db.execute("PRAGMA foreign_keys = ON")  # enforce FK constraints per connection
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ---------------------------------------------------------
# Auth helper — protects routes that require a logged-in user
# ---------------------------------------------------------
def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if session.get("user_id") is None:
            flash("Please log in to continue.")
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped_view


# ---------------------------------------------------------
# Routes — Auth
# ---------------------------------------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if not username or not email or not password:
            flash("All fields are required.")
            return redirect(url_for("register"))

        db = get_db()
        existing = db.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?", (username, email)
        ).fetchone()
        if existing:
            flash("Username or email already taken.")
            return redirect(url_for("register"))

        password_hash = generate_password_hash(password)
        db.execute(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            (username, password_hash, email),
        )
        db.commit()

        flash("Account created. Please log in.")
        return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        db = get_db()
        user = db.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()

        if user is None or not check_password_hash(user["password_hash"], password):
            flash("Invalid username or password.")
            return redirect(url_for("login"))

        # session stores only the user id — this is what "remembers" the user
        # across requests, tied to a secure cookie signed with app.secret_key
        session.clear()
        session["user_id"] = user["id"]
        session["username"] = user["username"]

        return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("You've been logged out.")
    return redirect(url_for("login"))

# ---------------------------------------------------------
# Routes — Main app
# ---------------------------------------------------------
@app.route("/")
def index():
    if session.get("user_id"):
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))

@app.route("/dashboard", methods=["GET", "POST"])
@login_required # Protects route so session["user_id"] is guaranteed to exist
def dashboard():
    db = get_db()
    user_id = session["user_id"]

    # 1. Handle form submission to add a new task
    if request.method == "POST":
        title = request.form.get("title")
        description = request.form.get("description") or None
        due_date = request.form.get("due_date") or None
        priority = request.form.get("priority", "medium")
        
        if title:
            # Added user_id so the new task connects directly to the logged-in user account
            db.execute(
                """
                INSERT INTO tasks (user_id, title, description, due_date, priority, status) 
                VALUES (?, ?, ?, ?, ?, ?)
                """, 
                (user_id, title, description, due_date, priority, "pending")
            )
            db.commit()
            
        return redirect(url_for("dashboard"))

    # 2. Fetch active records belonging exclusively to the logged-in user
    tasks = db.execute(
        "SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC", 
        (user_id,)
    ).fetchall()
    
    return render_template("dashboard.html", tasks=tasks)

@app.route("/tasks/<int:task_id>/toggle", methods=["POST"])
@login_required
def toggle_task(task_id):
    db = get_db()
    user_id = session["user_id"]
    
    # Secure row verification ensuring users can only flip their own tasks
    task = db.execute(
        "SELECT status FROM tasks WHERE id = ? AND user_id = ?", 
        (task_id, user_id)
    ).fetchone()
    
    if task:
        current_status = task["status"]
        new_status = "pending" if current_status == "completed" else "completed"
        
        db.execute(
            "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?", 
            (new_status, task_id, user_id)
        )
        db.commit()
        return {"success": True}, 200
        
    return {"error": "Task not found"}, 404


@app.route("/tasks/<int:task_id>/delete", methods=["POST"])
@login_required
def delete_task(task_id):
    db = get_db()
    db.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, session["user_id"]))
    db.commit()
    return {"success": True}, 200




@app.route("/due-dates")
@login_required
def due_dates():
    db = get_db()
    # Pulls tasks that have an assigned due date, sorted chronologically
    tasks = db.execute(
        "SELECT * FROM tasks WHERE user_id = ? AND due_date IS NOT NULL ORDER BY due_date ASC", 
        (session["user_id"],)
    ).fetchall()
    return render_template("dashboard.html", tasks=tasks)

@app.route("/completed")
@login_required
def completed_tasks():
    db = get_db()
    # Pulls only completed items
    tasks = db.execute(
        "SELECT * FROM tasks WHERE user_id = ? AND status = 'completed' ORDER BY id DESC", 
        (session["user_id"],)
    ).fetchall()
    return render_template("dashboard.html", tasks=tasks)


@app.route("/tasks/<int:task_id>/edit", methods=["POST"])
@login_required
def edit_task(task_id):
    db = get_db()
    title = request.form.get("title")
    description = request.form.get("description") or None
    due_date = request.form.get("due_date") or None
    priority = request.form.get("priority", "medium")
    
    if title:
        db.execute(
            """
            UPDATE tasks 
            SET title = ?, description = ?, due_date = ?, priority = ? 
            WHERE id = ? AND user_id = ?
            """,
            (title, description, due_date, priority, task_id, session["user_id"])
        )
        db.commit()
        return {"success": True}, 200
        
    return {"error": "Missing title"}, 400




# ---------------------------------------------------------
# Run
# ---------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
