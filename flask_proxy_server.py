from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

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

if __name__ == '__main__':
    print("🚀 Starting Flask proxy server on http://localhost:5001")
    print("📡 Will proxy requests to:", REMOTE_API_URL)
    print("🌐 CORS enabled for React app")
    app.run(host='0.0.0.0', port=5001, debug=True) 