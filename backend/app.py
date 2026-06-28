from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "iou.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                paid_by TEXT NOT NULL,
                settled INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


@app.route("/transactions", methods=["GET"])
def get_transactions():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions ORDER BY created_at DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json()
    description = data.get("description", "").strip()
    amount = data.get("amount")
    paid_by = data.get("paid_by")

    if not description or amount is None or paid_by not in ("me", "brother"):
        return jsonify({"error": "Invalid input"}), 400
    if amount <= 0:
        return jsonify({"error": "Amount must be positive"}), 400

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO transactions (description, amount, paid_by) VALUES (?, ?, ?)",
            (description, float(amount), paid_by),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM transactions WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return jsonify(dict(row)), 201


@app.route("/balance", methods=["GET"])
def get_balance():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT paid_by, amount FROM transactions WHERE settled = 0"
        ).fetchall()

    balance = 0.0
    for row in rows:
        if row["paid_by"] == "me":
            balance += row["amount"]
        else:
            balance -= row["amount"]

    if balance > 0:
        summary = f"Brother owes you ${balance:.2f}"
        direction = "owed_to_me"
    elif balance < 0:
        summary = f"You owe brother ${abs(balance):.2f}"
        direction = "i_owe"
    else:
        summary = "You're all square!"
        direction = "even"

    return jsonify({
        "balance": round(balance, 2),
        "summary": summary,
        "direction": direction
    })


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)