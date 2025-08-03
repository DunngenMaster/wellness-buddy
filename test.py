from flask import Flask, jsonify
import requests

app = Flask(__name__)

@app.route('/hit-server', methods=['GET'])
def hit_external_server():
    try:
        res = requests.post("http://10.104.228.88:5001/profile")
        return jsonify(res.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
