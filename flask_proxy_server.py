from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime
from user_data_manager import user_manager

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Remote API endpoint
REMOTE_API_URL = "http://10.104.228.88:5001/profile"

@app.route('/profile', methods=['POST'])
def proxy_fitbit_profile():
    try:
        print("🔄 Received request from React app")
        print("📡 Calling remote API:", REMOTE_API_URL)
        
        # Make the same request as test.py
        response = requests.post(REMOTE_API_URL)
        
        print("✅ Remote API response status:", response.status_code)
        print("📄 Remote API response:", response.text)
        
        if response.status_code == 200:
            data = response.json()
            print("🎯 Parsed JSON data:", data)
            return jsonify(data)
        else:
            print("❌ Remote API error:", response.status_code)
            return jsonify({"error": "Remote API failed", "status": response.status_code}), 500
            
    except requests.exceptions.ConnectionError as e:
        print("❌ Connection error:", str(e))
        return jsonify({"error": "Connection failed", "details": str(e)}), 503
    except requests.exceptions.Timeout as e:
        print("❌ Timeout error:", str(e))
        return jsonify({"error": "Request timeout", "details": str(e)}), 504
    except Exception as e:
        print("❌ Unexpected error:", str(e))
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "message": "Flask proxy server is running",
        "remote_api": REMOTE_API_URL
    })

@app.route('/test-remote', methods=['GET'])
def test_remote_api():
    """Test the remote API directly from Flask server"""
    try:
        print("🧪 Testing remote API connection...")
        response = requests.post(REMOTE_API_URL, timeout=5)
        return jsonify({
            "remote_api_status": response.status_code,
            "remote_api_response": response.json() if response.status_code == 200 else response.text,
            "success": response.status_code == 200
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        })

# User Data Management Endpoints
@app.route('/users', methods=['GET'])
def get_all_users():
    """Get all stored user profiles"""
    try:
        users = user_manager.get_all_users()
        return jsonify({
            "users": users,
            "success": True
        })
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get a specific user profile"""
    try:
        user = user_manager.get_user_profile(user_id)
        if user:
            return jsonify({"user": user, "success": True})
        else:
            return jsonify({"error": "User not found", "success": False}), 404
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/users', methods=['POST'])
def save_user():
    """Save or update a user profile"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', f"user_{int(datetime.now().timestamp())}")
        profile_data = data.get('profile', data)
        
        success = user_manager.save_user_profile(user_id, profile_data)
        if success:
            return jsonify({
                "user_id": user_id,
                "message": "User profile saved successfully",
                "success": True
            })
        else:
            return jsonify({"error": "Failed to save user profile", "success": False}), 500
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user profile"""
    try:
        success = user_manager.delete_user_profile(user_id)
        if success:
            return jsonify({
                "message": "User profile deleted successfully",
                "success": True
            })
        else:
            return jsonify({"error": "User not found", "success": False}), 404
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500



if __name__ == '__main__':
    print("🚀 Starting Flask proxy server on http://localhost:5001")
    print("📡 Will proxy requests to:", REMOTE_API_URL)
    print("🌐 CORS enabled for React app")
    print("💾 User data management enabled")
    app.run(host='0.0.0.0', port=5001, debug=True) 