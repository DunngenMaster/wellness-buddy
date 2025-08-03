import json, faiss, numpy as np, uvicorn, os
from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel
import requests
from sentence_transformers import SentenceTransformer

EMBED_MODEL  = "nomic-ai/nomic-embed-text-v1"
INDEX_FILE   = "../data/faiss_index/index.faiss"
META_FILE    = "../data/faiss_index/metadata.json"
TOP_K        = 8                        
OLLAMA_HOST  = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")  

index = faiss.read_index(INDEX_FILE)
with open(META_FILE, encoding="utf-8") as f:
    metadata = json.load(f)

embedder = SentenceTransformer(EMBED_MODEL, trust_remote_code=True)

# ---------- FastAPI ----------
app = FastAPI()

class Query(BaseModel):
    question: str
    k: int | None = None   # allow override

def embed(texts: list[str]) -> np.ndarray:
    vectors = embedder.encode(texts, batch_size=16, normalize_embeddings=True)
    return np.asarray(vectors, dtype="float32")

@app.post("/ask")
def ask(q: Query):
    print("🔍 Received query:", q.question)

    vec = embed([q.question])
    print("✅ Embedded query")

    k = q.k or TOP_K
    D, I = index.search(vec, k)
    print("🔎 FAISS search done. Indices:", I[0])

    ctx_blocks = []
    for rank, idx in enumerate(I[0]):
        print(f"📄 Getting metadata[{idx}]")
        meta = metadata[idx]
        snippet = meta.get("text", "").strip().replace("\n", " ")
        ctx_blocks.append(f"[{rank+1}] {snippet}")
    print("🧱 Prepared RAG context")

    system_prompt = (
        "You are a longevity assistant. Use only the following context:\n\n"
        f"{'\n'.join(ctx_blocks)}\n\n"
        f"User question: {q.question}\n\nAnswer:"
    )
    print("🧠 Prompt ready, calling Ollama...")

    res = requests.post(
        f"{OLLAMA_HOST}/api/generate",
        json={ "model": OLLAMA_MODEL, "prompt": system_prompt, "stream": False },
        timeout=90
    )
    print("📨 Ollama replied!")

    ollama_json = res.json()
    print("📦 Ollama raw JSON:", ollama_json)

    if "response" not in ollama_json:
        return {
            "error": "Ollama did not return expected 'response' field.",
            "ollama_raw": ollama_json
        }

    reply = ollama_json["response"]

    return {
        "answer": reply.strip(),
        "citations": [
            {"rank": i+1, "source": metadata[idx]["source"], "url": metadata[idx].get("url", "")}
            for i, idx in enumerate(I[0])
        ]
    }
