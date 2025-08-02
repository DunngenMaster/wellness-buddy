from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/profile', methods=['POST'])
def get_fitbit_profile():
    # Simulate Fitbit API response
    return jsonify({
        "user": {
            "name": "Sarah Johnson",
            "age": 28,
            "gender": "female",
            "weight": 65.2,
            "height": 165,
            "bmi": 23.9
        },
        "activity": {
            "steps": 12450,
            "calories": 1850,
            "activeMinutes": 52,
            "sleepHours": 8.2,
            "heartRate": {
                "resting": 58,
                "average": 72
            }
        },
        "goals": ["Improve Sleep Quality", "Increase Daily Steps"],
        "connectedApps": {
            "Fitbit": True,
            "Oura": False,
            "Apple Health": False
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Test server is running"})

if __name__ == '__main__':
    print("🚀 Starting test server on http://localhost:5001")
    print("📝 Test with: Click 'Import from Fitbit' in your app")
    app.run(host='0.0.0.0', port=5001, debug=True) 