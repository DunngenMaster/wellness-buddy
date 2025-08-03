import os, json
import pandas as pd
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from config import ACCESS_TOKEN

app = FastAPI()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

EMBED_MODEL = "nomic-ai/nomic-embed-text-v1"
INDEX_FILE = "../data/faiss_index/index.faiss"
META_FILE = "../data/faiss_index/metadata.json"
TOP_K = 8

index = faiss.read_index(INDEX_FILE)
with open(META_FILE, encoding="utf-8") as f:
    metadata = json.load(f)
embedder = SentenceTransformer(EMBED_MODEL, trust_remote_code=True)

class NutritionQuery(BaseModel):
    goal: str
    override_profile: Optional[dict] = None

def embed(texts: list[str]) -> np.ndarray:
    vectors = embedder.encode(texts, batch_size=16, normalize_embeddings=True)
    return np.asarray(vectors, dtype="float32")

def retrieve_context(query: str, k: int = TOP_K) -> list[str]:
    vec = embed([query])
    D, I = index.search(vec, k)
    ctx_blocks = []
    for rank, idx in enumerate(I[0]):
        meta = metadata[idx]
        snippet = meta.get("text", "").strip().replace("\n", " ")
        ctx_blocks.append(f"[{rank+1}] {snippet}")
    return ctx_blocks

def get_fitbit_profile():
    url = "https://api.fitbit.com/1/user/-/profile.json"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail=res.text)
    return res.json()["user"]

def get_intraday_summary():
    df = pd.read_csv("../../intraday_activity_metrics.csv")
    latest = df.iloc[-1].to_dict()
    return latest

def build_prompt(profile, intraday, context, goal) -> str:
    profile_text = '\n'.join([f"{k.capitalize()}: {v}" for k, v in profile.items()])
    activity_text = '\n'.join([f"{k}: {v}" for k, v in intraday.items()])
    rag_text = '\n'.join(context)
    return f"""
You are a personal health coach. Below is a user profile, recent activity data, and relevant expert information.

User Goal: {goal}

User Profile:
{profile_text}

Recent Activity:
{activity_text}

Knowledge Base:
{rag_text}

Based on all this information, give a complete personalized nutrition plan (with meals, timing, supplements) that fits the goal and user constraints.
"""

@app.post("/nutrition")
def generate_nutrition_plan(query: NutritionQuery):
    profile = query.override_profile or get_fitbit_profile()
    intraday = get_intraday_summary()
    context = retrieve_context(query.goal)
    prompt = build_prompt(profile, intraday, context, query.goal)

    res = requests.post(
        f"{OLLAMA_HOST}/api/generate",
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=90
    )

    if res.status_code != 200:
        return {"error": res.text}

    data = res.json()
    return {"nutrition_plan": data.get("response", "").strip()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8001)
