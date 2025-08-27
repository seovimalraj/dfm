# Runbook

## Setup
1) Create Supabase buckets: cad, qap (private).
2) Run SQL: supabase/migrations/0001_dfm.sql.
3) Copy .env.local.example to .env.local and fill keys.

## Web App
```bash
npm i
npm run dev
```
Open http://localhost:3000/upload, login, upload STL, start analysis.

## Worker
```bash
cd workers/python
pip install -r requirements.txt
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...
python worker.py
```
(Advanced) `python advanced_worker.py` for rules.

## Deploy
- Push repo to GitHub, import in Vercel.
- Set env vars in Vercel project settings.
- Ensure Storage buckets exist.

## Acceptance
- Upload → job completes → QAP PDF saved to qap bucket.
