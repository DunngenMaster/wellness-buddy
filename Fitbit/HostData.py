from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd, requests, os
from user_activity import UserActivity
from config import ACCESS_TOKEN

app = FastAPI()

class Status(BaseModel):
    status: str
    date: str | None = None
    rows: int | None = None
    data: list | None = None
    message: str | None = None

@app.post("/update-and-send", response_model=Status)
def update_and_send():
    try:
        UserActivity().get_user_activity()
        df = pd.read_csv("intraday_activity_metrics.csv")
        if df.empty:
            raise HTTPException(status_code=204, detail="no data")
        latest_date = df["date"].max()
        latest_data = df[df["date"] == latest_date]
        return {
            "status": "success",
            "date": latest_date,
            "rows": len(latest_data),
            "data": latest_data.to_dict(orient="records")
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profile")
def get_user():
    url = "https://api.fitbit.com/1/user/-/profile.json"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.text)
    return res.json()["user"]
