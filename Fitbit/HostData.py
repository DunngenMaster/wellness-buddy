from flask import Flask, jsonify
import pandas as pd
import requests
import os
from user_activity import UserActivity
from config import ACCESS_TOKEN, API_BASE


app = Flask(__name__)

@app.route("/update-and-send", methods=["POST"])
def update_and_send():
    try:
        # Step 1: Update CSV
        activity = UserActivity()
        activity.get_user_activity()
        print("CSV updated successfully.")

        # Step 2: Load updated CSV
        df = pd.read_csv("intraday_activity_metrics.csv")

        if df.empty:
            return jsonify({"status": "no data"}), 204

        # Step 3: Return the latest day's data
        latest_date = df["date"].max()
        latest_data = df[df["date"] == latest_date]

        return jsonify({
            "status": "success",
            "date": latest_date,
            "rows": len(latest_data),
            "data": latest_data.to_dict(orient="records")
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)

import requests

@app.route("/profile", methods=["POST"])
def get_user(self):
    profile_url = "https://api.fitbit.com/1/user/-/profile.json"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }
    res = requests.get(profile_url, headers=headers)
    print(res.json())
    if res.status_code != 200:
        raise Exception(f"Failed to fetch Fitbit profile: {res.status_code}, {res.text}")
