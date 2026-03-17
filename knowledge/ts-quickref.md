# TypeScript for JS Developers — 速查

> 你已有 5 年 JS 經驗。这不是教程，是对照表。

## 基礎：JS → TS 對照

```typescript
// JS                          // TS
let name = 'Nic';             let name: string = 'Nic';      // 其實可以省略，TS 會推斷
let age = 30;                 let age: number = 30;
let active = true;            let active: boolean = true;
let items = ['a', 'b'];      let items: string[] = ['a', 'b'];
let user = { name: 'Nic' };  let user: { name: string } = { name: 'Nic' };
```

**重点：大部分情况 TS 会自动推断，不需要写类型。**

## 函數
```typescript
// JS
function add(a, b) { return a + b; }

// TS — 參數必須標類型，return 會自動推斷
function add(a: number, b: number): number { return a + b; }

// 可選參數
function greet(name: string, greeting?: string) { ... }

// 默認值
function greet(name: string, greeting: string = 'Hello') { ... }
```

## React Component
```tsx
// JS
function Button({ label, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

// TS
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;        // ? = optional
  variant?: 'primary' | 'secondary';  // union type = 限定值
  children?: React.ReactNode;
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

## 常用 React Types
```typescript
// Event handlers
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
onSubmit: (e: React.FormEvent<HTMLFormElement>) => void

// Children
children: React.ReactNode      // 最通用：string, number, JSX, null
children: React.ReactElement    // 只允許 JSX

// Ref
const ref = useRef<HTMLDivElement>(null);

// State
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);  // 初始可能是 null
```

## 常见的 TS 语法

### interface vs type
```typescript
// interface — 用於 object shape，可以 extend
interface User {
  name: string;
  age: number;
}
interface Admin extends User {
  role: string;
}

// type — 更靈活，可以 union
type Status = 'loading' | 'success' | 'error';
type Response = User | Error;
```

### Generics（遇到就知）
```typescript
// 你见到 <T> 就是 generic — 像函数的「类型参数」
function first<T>(arr: T[]): T {
  return arr[0];
}
first<string>(['a', 'b']); // return type = string
first([1, 2, 3]);          // TS 自動推斷 T = number
```

### Utility Types（最常用 5 個）
```typescript
Partial<User>       // 所有 field 變 optional
Required<User>      // 所有 field 變 required
Pick<User, 'name'>  // 只要 name field
Omit<User, 'age'>   // 除了 age 之外全要
Record<string, number>  // { [key: string]: number }
```

### Type Assertion（慎用）
```typescript
// 當你比 TS 更清楚類型時
const input = document.getElementById('email') as HTMLInputElement;
input.value = 'test@test.com';
```

## 遷移策略：JS → TS

```
Phase 1: 新文件用 .ts/.tsx，加基礎類型
Phase 2: 關鍵 shared modules 轉 TS
Phase 3: 逐步遷移其他文件

// tsconfig.json 寬鬆起步
{
  "compilerOptions": {
    "strict": false,              // 先關，之後逐步開
    "allowJs": true,              // 允許 JS TS 混用
    "noImplicitAny": false,       // 先允許 implicit any
    "jsx": "react-jsx",
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

## 遇到 TS Error 的生存指南

| Error | 含义 | Fix |
|-------|------|-----|
| `Type 'X' is not assignable to type 'Y'` | 类型不 match | 检查值的类型，加 assertion 或改 interface |
| `Property 'x' does not exist on type 'Y'` | Object 没有这个 field | 加到 interface 或用 optional chaining |
| `Argument of type 'X' is not assignable` | 传错类型参数 | 检查函数 signature |
| `Object is possibly 'null'` | 可能是 null 你直接用 | 加 `if (x)` check 或 `x!`（确定不是 null） |
| `Cannot find module 'X'` | 没有 type 定义 | `npm install @types/X` |

---

## 完整對比：同一個 Component，JS vs TS

> 場景：一個 UserCard component + custom hook + API service。

### JavaScript 版本

```jsx
// hooks/useUser.js
import { useState, useEffect } from 'react';

export function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  return { user, loading, error };
}
```

```jsx
// components/UserCard.jsx
import React from 'react';
import { useUser } from '../hooks/useUser';

function UserCard({ userId, onEdit, showEmail }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <div className="skeleton" />;
  if (error) return <div className="error">{error}</div>;
  if (!user) return null;

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      {showEmail && <p>{user.email}</p>}
      <span className="role-badge">{user.role}</span>
      {onEdit && (
        <button onClick={() => onEdit(user)}>Edit</button>
      )}
    </div>
  );
}

UserCard.defaultProps = {
  showEmail: true,
};

export default UserCard;
```

### TypeScript 版本（同一個 component）

```tsx
// types/user.ts — 集中定義 types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'editor' | 'viewer';      // union type 限定值
  createdAt: string;
}

// API response 可能同 User 不完全一样
export interface UserResponse {
  data: User;
  meta: {
    lastLogin: string;
  };
}
```

```tsx
// hooks/useUser.ts
import { useState, useEffect } from 'react';
import type { User } from '../types/user';    // type-only import

interface UseUserReturn {                       // hook return type
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useUser(userId: string): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);      // 明確泛型
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<User>;                   // 告訴 TS return type
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setError(null);
        }
      })
      .catch((err: Error) => {                                // catch 的 error type
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  return { user, loading, error };
}
```

```tsx
// components/UserCard.tsx
import React from 'react';
import { useUser } from '../hooks/useUser';
import type { User } from '../types/user';

// Props interface — 最重要的一步
interface UserCardProps {
  userId: string;
  onEdit?: (user: User) => void;              // optional callback，明確參數
  showEmail?: boolean;                         // optional boolean
}

// default parameters 替代 defaultProps（React 19 compatible）
function UserCard({ userId, onEdit, showEmail = true }: UserCardProps) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <div className="skeleton" />;
  if (error) return <div className="error">{error}</div>;
  if (!user) return null;                      // TS 知道下面 user 不是 null

  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      {showEmail && <p>{user.email}</p>}
      <span className="role-badge">{user.role}</span>
      {onEdit && (
        <button onClick={() => onEdit(user)}>Edit</button>
      )}
    </div>
  );
}

export default UserCard;
```

### 並排差異高亮

| 位置 | JS | TS | 為什麼要加 |
|------|----|----|-----------|
| **Function params** | `userId` | `userId: string` | 防止傳錯類型 |
| **useState** | `useState(null)` | `useState<User \| null>(null)` | 明確 state 可能的類型 |
| **Props** | 散落在 PropTypes | `interface UserCardProps {}` | 編譯時檢查，IDE 補全 |
| **Optional props** | `defaultProps` | `showEmail?: boolean` + default param | React 19 compatible |
| **Callback type** | `onEdit` (any) | `(user: User) => void` | 確保 callback 收到正確數據 |
| **API response** | `res.json()` | `res.json() as Promise<User>` | 告訴 TS response shape |
| **Error** | `catch(err)` | `catch(err: Error)` | 明確 error 有 .message |
| **Export types** | N/A | `export interface User {}` | 跨文件共享類型 |

### TS 加了什麼好處？（具體例子）

```tsx
// 1. IDE 自動補全
user.    // JS: 什麼都不提示
user.    // TS: 自動列出 id, name, email, avatar, role, createdAt

// 2. 編譯時捕捉 bug
<UserCard userId={123} />        // TS Error: number 不是 string
<UserCard onEdit={(u) => u.age} />  // TS Error: User 沒有 age 屬性

// 3. Refactoring 安全
// 如果改了 User interface（刪了 email），所有用到 user.email 的地方即時報錯

// 4. 自動文檔
// Hover 在 UserCard 上就看到所有 props 和類型，不用翻 PropTypes
```

### tsconfig.json 對比：寬鬆 vs 嚴格

```jsonc
// Phase 1: 寬鬆（剛開始遷移）
{
  "compilerOptions": {
    "strict": false,
    "allowJs": true,               // JS TS 混用
    "noImplicitAny": false,        // 允許 implicit any
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "target": "es2020",
    "outDir": "./dist",
    "baseUrl": "./src",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["src"]
}

// Phase 3: 嚴格（遷移完成後）
{
  "compilerOptions": {
    "strict": true,                 // 開啟所有嚴格檢查
    "allowJs": false,               // 不再允許 JS
    "noImplicitAny": true,          // 不允許 implicit any
    "strictNullChecks": true,       // null/undefined 必須處理
    "noUnusedLocals": true,         // 不允許未使用變量
    "noUnusedParameters": true,     // 不允許未使用參數
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "moduleResolution": "bundler",  // Vite/Rspack 用 bundler
    "target": "es2022",
    "outDir": "./dist",
    "baseUrl": "./src",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["src"]
}
```
