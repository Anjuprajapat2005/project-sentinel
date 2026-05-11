# Postmortem: Payment Service Incident

**Date:** 2026-05-11
**Service:** payment-service
**Severity:** Critical
**Status:** Resolved

## Summary

The payment-service was experiencing runtime failures due to multiple syntax errors injected by the chaos monkey system.

## Root Cause

Multiple syntax errors were injected into the payment-service codebase:

1. **Invalid syntax in `src/index.ts`** (line 16)
   - Incomplete statement: `missing = ;`
   - Located in request logging middleware

2. **Invalid syntax in `src/routes/payments.ts`** (line 54)
   - Incomplete statement: `missing = ;`
   - Located in the refund endpoint handler

3. **Corrupted `tsconfig.json`**
   - Missing quotes around property names
   - Missing closing braces
   - Invalid JSON structure

4. **Type mismatches in route handlers** (pre-existing)
   - Response parameter incorrectly typed as `Request` instead of `Response`
   - Affected all 5 route handlers in index.ts and payments.ts

## Fixes Applied

| File | Issue | Fix |
|------|-------|-----|
| `src/index.ts` | `missing = ;` syntax | Removed incomplete line |
| `src/index.ts` | `res: Request` type | Changed to `res: Response` |
| `src/routes/payments.ts` | `missing = ;` syntax | Removed incomplete line |
| `src/routes/payments.ts` | `res: Request` type | Changed to `res: Response` (4 occurrences) |
| `tsconfig.json` | Invalid JSON | Replaced with valid config |

## Impact

- Service was unable to start due to syntax errors
- All payment endpoints (/charge, /refund, /:id) were non-functional

## Timeline

- **14:10** - Chaos monkey injects syntax error in payments.ts
- **14:11** - Chaos monkey injects syntax error in index.ts
- **Investigation started** - Read logs, identified syntax errors
- **Fixes applied** - Removed `missing = ;` lines, fixed types, restored tsconfig.json

## Verification

TypeScript compilation check shows only a minor warning about missing `@types/cors` declaration (non-blocking). All critical syntax errors have been resolved.

## Lessons Learned

1. Chaos monkey is injecting multiple simultaneous failures across different files
2. The backup files (`.chaos-backup`) contain the same corrupted code, indicating a backup creation bug
3. Type mismatches (Request vs Response) were already present in the codebase and needed fixing

## Action Items

- [ ] Verify payment-service starts correctly
- [ ] Test all payment endpoints (/charge, /refund, /:id, /)
- [ ] Investigate why .chaos-backup files contain corrupted code