from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

#Start Application
app = Flask(__name__)
CORS(app, origins=["https://iou-tracker-brown.vercel.app"])

#Storing Database
DB_PATH = os.path.join(os.path.dirname(__file__), "iou.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
                CREATE TABLE IF NOT EXISTS transactions(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    description TEXT NOT NULL,
                    amount REAL NOT NULL,
                    paid_by TEXT NOT NULL, 
                    settled INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
                     """)
        conn.commit()


@app.route('/transactions', methods = ["GET"]) 
def get_transactions():
    with get_db() as conn:
        result = conn.execute("""
                SELECT * FROM transactions 
                ORDER BY created_at DESC
            """).fetchall()
        
    return jsonify([dict(r) for r in result])

@app.route('/transactions', methods = ["POST"])
def add_transactions():
    data = request.get_json()
    description = data.get('description')
    amount = data.get('amount')
    paid_by = data.get('paid_by')

    if not description or amount is None or paid_by not in ("me", "brother"):
        return jsonify({"Error": "Invalid Data"}), 400
    with get_db() as conn:
        cursor = conn.execute("INSERT INTO transactions (description, amount, paid_by) VALUES (?, ?, ?)", (description, float(amount), paid_by))
        conn.commit()
        row = conn.execute("SELECT * FROM transactions WHERE id = ?", (cursor.lastrowid,))

        result = row.fetchone()
        

    return jsonify(dict(result)), 201

@app.route('/balance', methods = ["GET"])    
def get_balance():
    with get_db() as conn:
        unsettled = conn.execute("SELECT * FROM transactions WHERE settled = 0").fetchall()

    balance = 0.0

    for row in unsettled:
        if row["paid_by"] == "me":
            balance = balance + float(row["amount"])
        elif row["paid_by"] == "brother":
            balance = balance - float(row["amount"])
            

    if balance > 0:
        summary = "Adrian owes Alex"
        direction = "owes_me"
    elif balance < 0:
        summary = "Alex owes Adrian"
        direction = "i_owe"
    else:
        summary = "You're even"
        direction = "even"


    return jsonify({"balance": balance, "summary": summary, "direction": direction})

@app.route('/transactions/<int:tx_id>/settle', methods =["PATCH"])
def settle_transaction(tx_id):
    with get_db() as conn:
        settled = conn.execute("UPDATE transactions SET settled = 1 WHERE id = ?", (tx_id,))

        conn.commit()
        row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
        return jsonify(dict(row))


@app.route('/transactions/<int:tx_id>', methods = ["DELETE"])
def delete_transactions(tx_id):
    with get_db() as conn:
        delete = conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
        conn.commit()

        return "Transaction Removed."
    
@app.route('/transaction', methods = ["DELETE"])
def clear_transactions():
    with get_db() as conn:
        clear = conn.execute("DELETE FROM transactions")
        conn.commit()

        return "Transactions Cleared"

if __name__ == "__main__":    
    init_db()
    app.run(debug=True, port=5000)