---
description: Performance and bundle optimization for React components and pages
mode: agent
---

# Optimize This Code

Analyze for performance issues and suggest concrete improvements.

## Input
- ${selection} or file path or "whole page"

## Analysis Checklist

### React Rendering
- [ ] Unnecessary re-renders? Components re-rendering when props haven't changed
- [ ] Missing `React.memo` on expensive pure components
- [ ] `useMemo`/`useCallback` — only where dependency array is stable and computation is heavy
- [ ] State lifted too high? (causes sibling re-renders)
- [ ] Inline object/array/function in JSX props? (new reference every render)

### Data Fetching
- [ ] Waterfall requests? (sequential when could be parallel)
- [ ] Missing cache/dedup? (same data fetched multiple times)
- [ ] Large payload? (fetching more fields than needed)
- [ ] Missing loading/error states?

### Bundle Size
- [ ] Large imports? (`import moment` → `import dayjs`)
- [ ] Dynamic import candidates? (heavy components not needed on initial load)
- [ ] Tree-shakeable? (named exports vs default)
- [ ] Unused imports?

### DOM & CSS
- [ ] Large lists without virtualization? (>100 items → use `react-window`)
- [ ] Layout thrashing? (read+write DOM in loop)
- [ ] Heavy CSS selectors?

## Output Format

```markdown
## Quick Wins (5 分鐘搞掂)
1. [fix] — expected impact

## Medium Effort (1-2 小時)
1. [fix] — expected impact

## Needs Refactoring (1+ 天)
1. [fix] — expected impact
```

Show before/after code for top 3 fixes.
