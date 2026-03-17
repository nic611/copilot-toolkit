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

---

## 完整對比：同一個 Component，三個版本

> 一個 UserProfile component：fetch user data, show loading/error, 有 theme context, 有 form edit。

### React 16 (Class + connect + Legacy Context)

```jsx
// UserProfile.jsx — React 16
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchUser, updateUser } from '../actions/userActions';

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      name: '',
      error: null,
    };
    this.formRef = React.createRef();
  }

  // ❌ React 19 移除
  componentWillMount() {
    this.props.fetchUser(this.props.userId);
  }

  // ❌ React 19 移除
  componentWillReceiveProps(nextProps) {
    if (nextProps.userId !== this.props.userId) {
      this.props.fetchUser(nextProps.userId);
    }
    if (nextProps.user && nextProps.user !== this.props.user) {
      this.setState({ name: nextProps.user.name });
    }
  }

  // ❌ React 19 移除
  componentWillUpdate(nextProps, nextState) {
    if (nextState.editing !== this.state.editing) {
      console.log('Edit mode:', nextState.editing);
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.updateUser(this.props.userId, { name: this.state.name });
    this.setState({ editing: false });
  };

  render() {
    // ❌ Legacy Context
    const theme = this.context.legacyTheme || {};
    const { user, loading } = this.props;
    const { editing, name } = this.state;

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>User not found</div>;

    return (
      <div style={{ fontFamily: theme.fontFamily }}>
        <h2>{user.name}</h2>
        <p>{user.email}</p>

        {editing ? (
          <form ref={this.formRef} onSubmit={this.handleSubmit}>
            {/* ❌ String ref */}
            <input
              ref="nameInput"
              value={name}
              onChange={(e) => this.setState({ name: e.target.value })}
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => this.setState({ editing: false })}>
              Cancel
            </button>
          </form>
        ) : (
          <button onClick={() => this.setState({ editing: true, name: user.name })}>
            Edit
          </button>
        )}
      </div>
    );
  }
}

// ❌ Legacy Context
UserProfile.contextTypes = {
  legacyTheme: PropTypes.object,
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
  user: PropTypes.object,
  loading: PropTypes.bool,
  fetchUser: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
};

// ❌ connect HOC
const mapStateToProps = (state) => ({
  user: state.user.data,
  loading: state.user.loading,
});

export default connect(mapStateToProps, { fetchUser, updateUser })(UserProfile);
```

### React 18 (Hooks + Modern Context)

```jsx
// UserProfile.jsx — React 18
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUser, updateUser } from '../actions/userActions';
import { ThemeContext } from '../context/ThemeContext';

function UserProfile({ userId }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const nameInputRef = useRef(null);                      // ✅ useRef 替代 string ref
  const formRef = useRef(null);

  const dispatch = useDispatch();                          // ✅ useDispatch 替代 connect
  const user = useSelector((state) => state.user.data);    // ✅ useSelector 替代 mapStateToProps
  const loading = useSelector((state) => state.user.loading);
  const theme = useContext(ThemeContext);                   // ✅ useContext 替代 legacy context

  // ✅ useEffect 替代 componentWillMount + componentWillReceiveProps
  useEffect(() => {
    dispatch(fetchUser(userId));
  }, [userId, dispatch]);

  // ✅ useEffect 替代 componentWillReceiveProps (sync name)
  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  // ✅ useEffect 替代 componentWillUpdate
  useEffect(() => {
    if (editing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editing]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    dispatch(updateUser(userId, { name }));
    setEditing(false);
  }, [userId, name, dispatch]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div style={{ fontFamily: theme.fontFamily }}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>

      {editing ? (
        <form ref={formRef} onSubmit={handleSubmit}>
          <input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => { setEditing(true); setName(user.name); }}>
          Edit
        </button>
      )}
    </div>
  );
}

export default UserProfile;
```

### React 19 (use() + Actions + ref as prop)

```jsx
// UserProfile.jsx — React 19
import { useState, useEffect, useRef, use, useActionState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUser, updateUser } from '../actions/userActions';
import { ThemeContext } from '../context/ThemeContext';

function UserProfile({ userId, ref }) {                    // ✅ ref as regular prop
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const nameInputRef = useRef(null);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.data);
  const loading = useSelector((state) => state.user.loading);
  const theme = use(ThemeContext);                          // ✅ use() 替代 useContext

  useEffect(() => {
    dispatch(fetchUser(userId));
  }, [userId, dispatch]);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  // ✅ useActionState 替代手動 form state 管理
  const [formState, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const newName = formData.get('name');
      await dispatch(updateUser(userId, { name: newName }));
      setEditing(false);
      return { success: true };
    },
    { success: false }
  );

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div ref={ref} style={{ fontFamily: theme.fontFamily }}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>

      {editing ? (
        <form action={submitAction}>                        {/* ✅ form action */}
          <input
            ref={nameInputRef}
            name="name"
            defaultValue={name}
          />
          <button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => { setEditing(true); setName(user.name); }}>Edit</button>
      )}
    </div>
  );
}

// ✅ React 19: 不需要 forwardRef
// ✅ React 19: 不需要 defaultProps（用 default parameters）
// ✅ React 19: 不需要 propTypes（用 TypeScript）
export default UserProfile;
```

### 三版對比總表

| 特性 | React 16 | React 18 | React 19 |
|------|----------|----------|----------|
| **State** | `this.state` + `setState` | `useState` | `useState` |
| **Fetch on mount** | `componentWillMount` | `useEffect(,[])` | `useEffect(,[])` |
| **Props change** | `componentWillReceiveProps` | `useEffect(,[deps])` | `useEffect(,[deps])` |
| **Context** | `this.context` + `contextTypes` | `useContext()` | `use()` |
| **Refs** | `this.refs.x` (string) | `useRef()` | `useRef()` |
| **Forward ref** | N/A | `forwardRef()` | ref as prop |
| **Redux** | `connect()` HOC | `useSelector` + `useDispatch` | same |
| **Form submit** | `onSubmit` handler | `onSubmit` handler | `<form action={}>` |
| **Form state** | `this.setState` | `useState` | `useActionState` |
| **Type checking** | `PropTypes` | `PropTypes` or TS | TypeScript |
| **Default props** | `defaultProps` | `defaultProps` or defaults | default parameters |
