from intraday_processor import IntradayProcessor
from fetch_intraday import FetchIntraday
from config import ACCESS_TOKEN
import requests


class UserActivity:
    def get_user_activity(self):
        client = FetchIntraday()
        processor = IntradayProcessor(client)
        processor.process_and_save()
    def get_user(self):
        profile_url = "https://api.fitbit.com/1/user/-/profile.json"
        headers = {
            "Authorization": f"Bearer {ACCESS_TOKEN}"
        }

        res = requests.get(profile_url, headers=headers)
        print(res.json())
        if res.status_code != 200:
            raise Exception(f"Failed to fetch Fitbit profile: {res.status_code}, {res.text}")

if __name__ == "__main__":
    activity = UserActivity()
    activity.get_user()