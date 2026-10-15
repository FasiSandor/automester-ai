# AutoMester AI

Hungarian-language, private-use automotive diagnostics PWA starter.

## Modules
- Symptom triage with safety-first DTC explanation
- Optional AI chat (OpenAI-compatible API configured server-side)
- Vehicle garage, diagnostic histories and repair logs (local browser draft mode)
- Part identification checklist and direct merchant searches

## Start
```bash
npm install
cp .env.example .env.local
npm run dev
npm run typecheck
npm run build
```

## Status and limitations
This is a **development baseline**, not a production-ready private service.
- Without an AI key, an explicitly labeled offline rules-based response is shown.
- Browser-local draft data is **not encrypted cloud storage** and does not sync.
- Neon schema is included; database connection and Neon Auth integration remain to be done.
- OCR/photo diagnostics, private object storage, automatic live prices, and vehicle fitment validation remain to be integrated.
- Do **not** deploy publicly before authentication and authorization are enforced.

See docs/PLAN.md for acceptance criteria. Never commit API keys.
