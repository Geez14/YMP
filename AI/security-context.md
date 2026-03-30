# Security Context

## Purpose
Project-focused security context for the YMP music platform, documenting security posture, findings, and hardening requirements.

## Mission
Ensure production-ready security through proper authentication, data protection, input validation, and compliance with best practices.

## Security Posture
- **Authentication**: Supabase auth with session validation in all API routes.
- **Authorization**: RLS policies on song_access table; role-based upload limits enforced via database triggers.
- **Data Protection**: Sensitive env vars validated at runtime; no defaults or exposure.
- **File Handling**: Strict mime type validation, content hashing for deduplication, client-side FFmpeg compression.
- **API Security**: Auth checks, error handling without leaking internals, no SQL injection via parameterized queries.
- **Dependencies**: FFmpeg v0.12.15 client-side only; monitor CDN (unpkg.com) for supply chain risks.

## Critical Findings
- No hardcoded secrets or exposed keys.
- Proper profile sync in auth callback without role overwriting.
- Soft deletes and retention cleanup for data management.
- Client-side FFmpeg isolates compression risks.

## Recommendations
- Implement API rate limiting for production.
- Self-host FFmpeg core or pin versions to mitigate CDN risks.
- Add audit logging for uploads/deletions if compliance required.
- Consider server-side content analysis for high-risk file types.

## Build Verification
All security changes must pass: `bash -lc 'source ~/.nvm/nvm.sh && cd /home/mxtylish/github/YMP && npm run build'`.

## Project Paths
- Env validation: `/home/mxtylish/github/YMP/src/lib/env.ts`
- API routes: `/home/mxtylish/github/YMP/src/app/api/`
- Supabase migrations: `/home/mxtylish/github/YMP/supabase/migrations/`
- Upload logic: `/home/mxtylish/github/YMP/src/features/upload/components/upload-form.tsx`

## Compliance
- GDPR/CCPA: User data isolation via RLS; soft deletes for deletion requests.
- Encryption: Handled by Supabase at rest/transit.</content>
<parameter name="filePath">/home/mxtylish/github/YMP/AI/security-context.md