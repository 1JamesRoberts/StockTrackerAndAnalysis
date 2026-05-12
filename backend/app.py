import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import certifi

app = Flask(__name__)
CORS(app)

# MongoDB Atlas URI
MONGO_URI = "enter your key"
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.stock_tracker

portfolio_col = db.portfolio
transactions_col = db.transactions

@app.route('/api/portfolio/<user_id>', methods=['GET'])
def get_portfolio(user_id):
    items = list(portfolio_col.find({"user_id": user_id}, {"_id": 0}))
    return jsonify(items)

@app.route('/api/portfolio/<user_id>', methods=['POST'])
def add_portfolio_item(user_id):
    data = request.json
    data['user_id'] = user_id
    portfolio_col.insert_one(data.copy())
    
    # Remove _id from response
    if '_id' in data:
        del data['_id']
    return jsonify(data), 201

@app.route('/api/portfolio/<user_id>/<item_id>', methods=['PUT'])
def update_portfolio_item(user_id, item_id):
    updates = request.json
    portfolio_col.update_one(
        {"user_id": user_id, "id": item_id},
        {"$set": updates}
    )
    return jsonify({"success": True})

@app.route('/api/portfolio/<user_id>/<item_id>', methods=['DELETE'])
def delete_portfolio_item(user_id, item_id):
    portfolio_col.delete_one({"user_id": user_id, "id": item_id})
    return jsonify({"success": True})

@app.route('/api/transactions/<user_id>', methods=['GET'])
def get_transactions(user_id):
    items = list(transactions_col.find({"user_id": user_id}, {"_id": 0}))
    return jsonify(items)

@app.route('/api/transactions/<user_id>', methods=['POST'])
def add_transaction(user_id):
    data = request.json
    data['user_id'] = user_id
    transactions_col.insert_one(data.copy())
    
    if '_id' in data:
        del data['_id']
    return jsonify(data), 201

@app.route('/api/transactions/<user_id>/<txn_id>', methods=['PUT'])
def update_transaction(user_id, txn_id):
    updates = request.json
    transactions_col.update_one(
        {"user_id": user_id, "id": txn_id},
        {"$set": updates}
    )
    return jsonify({"success": True})

@app.route('/api/transactions/<user_id>/<txn_id>', methods=['DELETE'])
def delete_transaction(user_id, txn_id):
    transactions_col.delete_one({"user_id": user_id, "id": txn_id})
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
