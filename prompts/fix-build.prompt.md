---
description: Diagnose and fix build errors, especially migration-related
mode: agent
---

# Fix Build Error

Diagnose and fix the current build error.

## Input
Paste the error output or describe the issue.

## Diagnosis Steps

1. **Read the error message** — identify:
   - Which file/line
   - Which package
   - Error type (syntax, module resolution, type error, peerDep conflict)

2. **Common migration errors** (check these first):
   - `Module not found` → Check if package was renamed or removed in new version
   - `peerDependencies` warning → Check React version compatibility
   - `Cannot find module` → CJS/ESM interop issue (Node upgrade)
   - `TypeError: X is not a function` → API changed in new version
   - `contentBase` error → webpack-dev-server v4 uses `static`

3. **Fix approach**:
   - Show the fix with before/after code
   - Explain WHY it broke (what changed between versions)
   - Flag if this fix might break other things

4. **Verify**:
   - Suggest command to verify the fix
   - List related files that might have the same issue
