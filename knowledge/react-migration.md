# React 16 → 18 → 19 Migration Cheatsheet

> 日常工作速查。遇到 deprecated API 即查即改。

## React 18 必改 (Breaking)

### ReactDOM.render → createRoot
```jsx
// ❌ React 16
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// ✅ React 18
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

### componentWillMount → useEffect
```jsx
// ❌ React 16
componentWillMount() {
  document.addEventListener('keydown', this.handleKey);
}

// ✅ React 18
useEffect(() => {
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, []);
```

### componentWillReceiveProps → useEffect with deps
```jsx
// ❌ React 16
componentWillReceiveProps(nextProps) {
  if (nextProps.id !== this.props.id) {
    this.fetchData(nextProps.id);
  }
}

// ✅ React 18
useEffect(() => {
  fetchData(id);
}, [id]);
```

### componentWillUpdate → useEffect
```jsx
// ❌ React 16
componentWillUpdate(nextProps, nextState) {
  if (nextState.count !== this.state.count) {
    analytics.track('count_changed', nextState.count);
  }
}

// ✅ React 18
useEffect(() => {
  analytics.track('count_changed', count);
}, [count]);
```

### String refs → useRef
```jsx
// ❌ React 16
<input ref="myInput" />
this.refs.myInput.focus();

// ✅ React 18
const myInput = useRef(null);
<input ref={myInput} />
myInput.current.focus();
```

### findDOMNode → useRef
```jsx
// ❌ React 16
import { findDOMNode } from 'react-dom';
const node = findDOMNode(this);

// ✅ React 18
const ref = useRef(null);
// attach ref to JSX: <div ref={ref}>
const node = ref.current;
```

### Legacy Context → createContext
```jsx
// ❌ React 16
class Provider extends Component {
  getChildContext() { return { theme: this.props.theme }; }
}
Provider.childContextTypes = { theme: PropTypes.object };

// ✅ React 18
const ThemeContext = React.createContext({});
function Provider({ theme, children }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
// Consumer: const theme = useContext(ThemeContext);
```

## React 19 額外改動

| API | React 18 | React 19 |
|-----|----------|----------|
| `forwardRef` | 需要 | 不需要，ref 直接作為 prop |
| `defaultProps` (FC) | works | ❌ 用 default parameters |
| `propTypes` | works | works 但建議用 TS |
| `use()` hook | 無 | 新增，可讀 context/promise |
| `useActionState` | 無 | 新增，替代 form state |
| `<form action={}>` | 無 | 新增，Server Actions |

## Class → Hooks 速查

| Class | Hooks |
|-------|-------|
| `this.state = {}` | `const [x, setX] = useState()` |
| `this.setState({})` | `setX(newValue)` |
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate` | `useEffect(() => {}, [deps])` |
| `componentWillUnmount` | `useEffect(() => { return cleanup }, [])` |
| `this.props.x` | Function parameter `x` |
| `connect(mapState)(Comp)` | `useSelector(state => state.x)` |
| `mapDispatchToProps` | `const dispatch = useDispatch()` |
| `shouldComponentUpdate` | `React.memo(Component)` |
| `this.forceUpdate()` | `const [, forceUpdate] = useReducer(x => x+1, 0)` |
