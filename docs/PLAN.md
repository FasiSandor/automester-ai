# AutoMester AI – V1 implementation plan
## Confirmed requirements
- Private, single-person usage; supports multiple vehicle makes
- Manual OBD trouble codes and photo input (photo OCR not yet implemented)
- Hybrid rules + AI diagnostic conversation
- Vehicle garage, maintenance log, part catalog comparison
- Neon PostgreSQL and Neon Auth; Next.js + Vercel Hobby
- Deploy minimization: development checks before a single preview, then controlled production

## What this first commit implements
- Responsive dark-tech web UI with mobile navigation
- Local browser draft mode for vehicles, messages and repairs
- Basic generically interpreted fault code dictionary, with graceful handling of unknown codes
- Symptom and code input, rule-based safety warnings
- Server-side AI call with safe fallback if AI configuration is absent
- Retailer navigation links (not claimed as real-time price integration)
- Neon SQL schema draft and configuration example

## Mandatory production blockers (not yet done)
1. Implement Neon Auth (server-verified session on **all** endpoints) and owner-based authorization.
2. Connect CRUD to Neon; remove localStorage as authoritative persistent store.
3. Implement private image object storage, upload validation, OCR/camera workflow, and retention rules.
4. Verify actual retailer access conditions, compatibility and real pricing provenance.
5. Rate-limit AI and enforce budget quotas; add audit logs and deletion/export.
6. Provide versioned, cited DTC database with manufacturer-specific handling.
7. Test mobile, accessibility, data isolation, API abuse protection and CI build.
8. Confirm Vercel project integration and prevention of needless preview builds before connecting.
9. Configure real icon assets and offline PWA features before calling it install-ready.

## Rules
- No fictitious parts, prices, technical causes or guaranteed fitment.
- Do not continue driving for serious safety symptoms.
- No secrets in source, logs or client bundles.
- No publicly accessible AI endpoint in production without auth and rate limiting.
