---
description: Diagnose runtime errors, console errors, or unexpected behavior
mode: agent
---

# Debug This Error

## Input
Paste the error message, stack trace, or describe the unexpected behavior.

## Diagnosis Flow

### Step 1: Parse the Error
- Extract: error type, message, file path, line number
- Identify: is this a build error, runtime error, or type error?

### Step 2: Read Source Context
- Open the file at the error location
- Read 30 lines above and below for context
- Check imports — is a dependency missing or version-mismatched?

### Step 3: Common Patterns (check these first)
| Error Pattern | Likely Cause | Quick Fix |
|--------------|-------------|-----------|
| `Cannot read property 'x' of undefined` | Missing null check or async timing | Optional chaining `?.` or guard |
| `X is not a function` | Wrong import, API changed, or wrong version | Check package version + API docs |
| `Invalid hook call` | Hook outside component, or multiple React copies | Check `npm ls react` for duplicates |
| `Module not found` | Wrong path, missing dep, or CJS/ESM mismatch | Check import path + package.json exports |
| `Objects are not valid as React child` | Rendering object instead of string/JSX | Check what's being passed to JSX |
| `Maximum update depth exceeded` | useEffect missing deps or setState in render | Check useEffect dependency array |
| `CORS error` | API endpoint or proxy misconfigured | Check dev server proxy config |
| `Hydration mismatch` | Server/client render different output | Check conditional rendering |

### Step 4: Fix
- Show before/after code
- Explain the root cause in one sentence
- Flag if this error might appear elsewhere in the codebase

### Step 5: Prevent
- Suggest a pattern to avoid this error class in future
- If recurring: suggest adding a lint rule or test
