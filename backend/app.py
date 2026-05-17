import os
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from pymongo import MongoClient
import certifi
import jwt
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Centralized MongoDB Atlas URI
MONGO_URI = os.environ.get("MONGO_URI", "enter your key")
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.stock_tracker

portfolio_col = db.portfolio
transactions_col = db.transactions

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        
        token = auth_header.split(" ")[1]
        try:
            # Basic decoding for Clerk tokens (Note: signature not verified here in dev)
            decoded = jwt.decode(token, options={"verify_signature": False})
            g.user_id = decoded.get("sub")
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated

@app.route('/api/portfolio', methods=['GET', 'POST'])
@require_auth
def handle_portfolio():
    if request.method == 'GET':
        items = list(portfolio_col.find({"user_id": g.user_id}, {"_id": 0}))
        return jsonify(items)
    elif request.method == 'POST':
        data = request.json
        data['user_id'] = g.user_id
        portfolio_col.insert_one(data.copy())
        if '_id' in data:
            del data['_id']
        return jsonify(data), 201

@app.route('/api/portfolio/<item_id>', methods=['PUT', 'DELETE'])
@require_auth
def manage_portfolio_item(item_id):
    if request.method == 'PUT':
        portfolio_col.update_one({"user_id": g.user_id, "id": item_id}, {"$set": request.json})
    elif request.method == 'DELETE':
        portfolio_col.delete_one({"user_id": g.user_id, "id": item_id})
    return jsonify({"success": True})

@app.route('/api/transactions', methods=['GET', 'POST'])
@require_auth
def handle_transactions():
    if request.method == 'GET':
        items = list(transactions_col.find({"user_id": g.user_id}, {"_id": 0}))
        return jsonify(items)
    elif request.method == 'POST':
        data = request.json
        data['user_id'] = g.user_id
        transactions_col.insert_one(data.copy())
        if '_id' in data:
            del data['_id']
        return jsonify(data), 201

@app.route('/api/transactions/<txn_id>', methods=['PUT', 'DELETE'])
@require_auth
def manage_transaction(txn_id):
    if request.method == 'PUT':
        transactions_col.update_one({"user_id": g.user_id, "id": txn_id}, {"$set": request.json})
    elif request.method == 'DELETE':
        transactions_col.delete_one({"user_id": g.user_id, "id": txn_id})
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
