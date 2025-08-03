import requests
import json

query = {
    "goal": "weight_loss"
}

try:
    res = requests.post("http://10.104.228.88:8000/nutrition", json=query, timeout=300)
    res.raise_for_status()
    out = res.json()

    if "nutrition_plan" in out:
        print("Nutrition Plan:\n")
        print(out["nutrition_plan"])
    elif "error" in out:
        print("Error from server:")
        print(json.dumps(out, indent=2))
    else:
        print("Unexpected response:")
        print(json.dumps(out, indent=2))

except requests.exceptions.RequestException as e:
    print("Failed to connect to the API.")
    print("Error:", e)
