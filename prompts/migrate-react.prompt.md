---
description: Guide React 16 to 18/19 migration for a specific file or component
mode: agent
---

# Migrate React Component

Migrate the selected file from React 16 patterns to React 18/19.

## Input
- Target file: ${selection} or specify path

## Migration Checklist

### React 18 (必須)
- [ ] `ReactDOM.render()` → `createRoot().render()`
- [ ] `componentWillMount` → `useEffect` or remove
- [ ] `componentWillReceiveProps` → `useEffect` with deps
- [ ] `componentWillUpdate` → `useEffect` or `getSnapshotBeforeUpdate`
- [ ] String refs → `useRef()` or `createRef()`
- [ ] Legacy Context → `createContext` + `useContext`
- [ ] `React.createFactory` → JSX

### React 19 (如果目標是 19)
- [ ] `forwardRef` → ref as regular prop
- [ ] `defaultProps` on function components → default parameters
- [ ] `propTypes` → TypeScript types (if migrating to TS)
- [ ] `useContext` → `use(Context)`
- [ ] `React.lazy` + Suspense patterns

### Class → Function Component (如果適用)
- [ ] `this.state` → `useState`
- [ ] `this.setState` → state setter
- [ ] Lifecycle methods → `useEffect`
- [ ] `this.props` → function parameters
- [ ] HOC (`connect`) → hooks (`useSelector`, `useDispatch`)

## Output
1. Show the migrated code
2. List what changed and why
3. Flag any risks or things that need manual testing
4. Suggest test cases for the migration
