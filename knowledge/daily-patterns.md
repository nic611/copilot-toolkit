# Daily Work Patterns — 日常工作速查

> 不是教程，是日常会用到的 pattern 集合。

## Git 日常

```bash
# 開新功能
git checkout -b feature/add-login
git push -u origin feature/add-login

# 提 PR 前 sync
git fetch origin main
git rebase origin/main         # 保持線性歷史
# 如果有衝突：改完 → git add → git rebase --continue

# Commit 格式
git commit -m "feat(auth): add login form validation"
git commit -m "fix(form): prevent double submit on slow network"

# 快速查改了什麼
git diff --stat               # 哪些文件改了
git diff --name-only main     # 同 main 差幾個文件
git log --oneline -10         # 最近 10 個 commit
```

## Debug 模式

```javascript
// 臨時 debug（記得刪）
console.log('🔴', variableName);    // 用 emoji 方便搜索刪除
console.table(arrayOrObject);        // 表格格式
console.trace('where am I');         // 打印 call stack

// React DevTools
// Components tab → 選中組件 → 看 props/state/hooks
// Profiler tab → Record → 找 unnecessary re-renders

// Network debug
// DevTools → Network → 右鍵 request → Copy as fetch
```

## React 常用 Pattern

### Conditional Rendering
```jsx
// 推薦：early return
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;

// 簡單 toggle
{isVisible && <Modal />}
{status === 'success' ? <Success /> : <Pending />}
```

### Custom Hook 提取
```jsx
// Before: logic 散落在 component
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/user/${id}`).then(r => r.json()).then(setUser).finally(() => setLoading(false));
  }, [id]);
  // ... render
}

// After: 提取成 hook
function useUser(id) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/user/${id}`).then(r => r.json()).then(setUser).finally(() => setLoading(false));
  }, [id]);
  return { user, loading };
}

function UserProfile() {
  const { user, loading } = useUser(id);
  // ... render (更乾淨)
}
```

### Error Boundary
```jsx
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, info) { logError(error, info); }
  render() {
    if (this.state.hasError) return <Fallback />;
    return this.props.children;
  }
}
// 用法: <ErrorBoundary><RiskyComponent /></ErrorBoundary>
```

## Performance 速查

```jsx
// 1. 避免 inline object/function (每次 render 新 reference)
// ❌
<Child style={{ color: 'red' }} onClick={() => handleClick(id)} />
// ✅
const style = useMemo(() => ({ color: 'red' }), []);
const handleChildClick = useCallback(() => handleClick(id), [id]);
<Child style={style} onClick={handleChildClick} />

// 2. React.memo — 只在 props 真的常常不變時用
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <ExpensiveItem key={item.id} {...item} />);
});

// 3. 大列表用 virtualization
import { FixedSizeList } from 'react-window';
<FixedSizeList height={400} itemCount={1000} itemSize={35}>
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>

// 4. Code splitting
const HeavyChart = React.lazy(() => import('./HeavyChart'));
<Suspense fallback={<Spinner />}><HeavyChart /></Suspense>
```

## CSS-in-JS / Styling 快速選擇

| 方案 | 優點 | 缺點 | 適合 |
|------|------|------|------|
| CSS Modules | 零 runtime, scoped | 不能動態 style | 大部分情況 |
| styled-components | 動態 style, TS 友好 | Runtime 開銷 | 需要大量動態 style |
| Tailwind | 快, 一致 | 學習曲線, 長 className | 新項目 |
| Inline styles | 簡單 | 不支持 pseudo/media | 臨時/prototype |
