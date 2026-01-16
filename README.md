# Joomidang
FlavorOS prototype: flavor vector analysis, recipe generation, and store rollout dashboards.

## Quick Start

### Backend (FastAPI)
```
cd /Users/david/Desktop/python/github/Joomidang
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8002
```

### Seed Data
```
cd /Users/david/Desktop/python/github/Joomidang
source .venv/bin/activate
python -m backend.seed
```

### Frontend (Next.js)
```
cd /Users/david/Desktop/python/github/Joomidang/frontend
npm install
npm run dev
```

By default, the frontend calls `http://localhost:8002`.
To change it, set `NEXT_PUBLIC_API_URL` in your environment.

## Notes
- The backend uses SQLite at `flavoros.db` by default.
- Transform modes supported by the API: `COPY`, `DISTANCE`, `REDIRECT`.
- The Strategy Lab UI maps `DIRECTION` and `SIGNATURE` to `REDIRECT` with a `direction_key`.
- Local LLM (llama.cpp + Gemma) can be enabled by setting:
  - `JOOMIDANG_LLM_MODEL=/path/to/gemma.gguf`
  - Optional: `JOOMIDANG_LLM_CHAT_FORMAT=gemma`, `JOOMIDANG_LLM_N_CTX=4096`,
    `JOOMIDANG_LLM_GPU_LAYERS=-1`, `JOOMIDANG_LLM_MAX_NEW_TOKENS=512`
