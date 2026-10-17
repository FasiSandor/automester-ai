# AutoMester AI
Private-use automotive diagnostic assistant. Next.js + Neon PostgreSQL + Neon Auth.

## Setup
- Neon project already provisioned (project ID: `fragrant-base-20101402`, Frankfurt).
- Neon Auth provisioned as Better Auth.
- Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` and `ALLOWED_OWNER_EMAIL` privately in hosting environment; **never commit secrets**.
- `ALLOWED_OWNER_EMAIL` must match the email used to register; other accounts cannot access garage or AI.
- Install `npm install`, then `npm run typecheck && npm run build`.
- `AI_API_KEY` is optional; no key means explicit rule-based mode.

## Features
- Password sign-in with server-checked owner allowlist.
- Persistent Neon vehicles, repairs, and diagnostic history.
- Diagnostic chat with optional AI fallback and safety warnings.
- Manual DTC input; parts merchant navigation.

## Outstanding before public/production launch
- Limit AI requests per session/user and enforce spend quota.
- Implement private image storage and OCR; currently unavailable.
- Merchant real-time quotes and true vehicle compatibility not integrated.
- Review Neon Auth email verification, account creation policy, deployment env variables, trusted domains.
- Run dependency/security audit and validate real GitHub Actions checks before deploy.
- Add automated backup/export and robust observability.
