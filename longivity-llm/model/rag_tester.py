import requests
import json

query = {
    "question": "What supplements improve sleep quality?",
    "k": 5
}

try:
    res = requests.post("http://localhost:8000/ask", json=query, timeout=1500)
    res.raise_for_status()
    out = res.json()

    if "answer" in out:
        print("💬 Answer:\n", out["answer"])
        print("\n🔗 Sources:")
        for src in out["citations"]:
            print(f"[{src['rank']}] {src['source']} - {src['url']}")
    elif "error" in out:
        print("❌ Error from server:")
        print(json.dumps(out, indent=2))
    else:
        print("❌ Unexpected server response:")
        print(json.dumps(out, indent=2))

except requests.exceptions.RequestException as e:
    print("❌ Failed to connect to the API. Is it running?")
    print("Error:", e)
