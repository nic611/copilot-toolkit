---
description: Review code for migration readiness, performance, and security
mode: agent
---

# Code Review

Review the selected code focusing on migration readiness and quality.

## Input
- File: ${selection} or specify path

## Review Dimensions

### 1. Migration Readiness
- Any React 16 deprecated APIs?
- Any Webpack 4 specific patterns?
- Any Node 22 specific APIs that changed in 25?
- peerDependency compatible?

### 2. Performance
- Unnecessary re-renders? (missing memo/useMemo/useCallback)
- Large bundle impact? (tree-shakeable?)
- N+1 API calls?

### 3. Security
- XSS risk? (dangerouslySetInnerHTML, unescaped user input)
- Secrets in code?
- Unsafe eval/innerHTML?

### 4. Maintainability
- Component > 200 lines? → Suggest split
- Function > 50 lines? → Suggest extract
- Magic numbers?
- Missing error handling at system boundaries?

## Output Format

```
## Summary
[1-2 sentence overview]

## Issues Found
| # | Severity | Issue | Line | Fix |
|---|----------|-------|------|-----|

## Positive
- [What's good about this code]
```
