---
description: Audit dependencies for React version locks and unmaintained packages
mode: agent
---

# Audit Dependencies

Scan the current project for dependency issues that block React upgrades.

## Steps

1. Read `package.json` — list all deps and devDeps
2. For each dependency with `react` in peerDependencies:
   - Check if peerDep allows React 18: `^16` = ❌, `^16 || ^17 || ^18` = ✅
   - Flag unmaintained packages (check last publish date if possible)
3. Check for deprecated React API usage in source files:
   - `findDOMNode` → use `useRef`
   - `componentWillMount` → use `useEffect`
   - `componentWillReceiveProps` → use `useEffect` or `getDerivedStateFromProps`
   - `componentWillUpdate` → use `useEffect` or `getSnapshotBeforeUpdate`
   - `this.refs.` (string refs) → use `useRef` or `createRef`
   - `getChildContext` / `childContextTypes` → use `createContext`
   - `React.createFactory` → use JSX
   - `ReactDOM.render` → use `createRoot`
4. Output a markdown table:

```
| Package | peerDep React | Status | Risk |
|---------|--------------|--------|------|
```

5. Summarize: total blockers, estimated effort, recommended approach
