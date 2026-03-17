# TypeScript for JS Developers — 速查

> 你已有 5 年 JS 經驗。呢份唔係教程，係對照表。

## 基礎：JS → TS 對照

```typescript
// JS                          // TS
let name = 'Nic';             let name: string = 'Nic';      // 其實可以省略，TS 會推斷
let age = 30;                 let age: number = 30;
let active = true;            let active: boolean = true;
let items = ['a', 'b'];      let items: string[] = ['a', 'b'];
let user = { name: 'Nic' };  let user: { name: string } = { name: 'Nic' };
```

**重點：大部分情況 TS 會自動推斷，唔使寫類型。**

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

## 你會常見嘅 TS 語法

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
// 你見到 <T> 就係 generic — 像函數嘅「類型參數」
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

## 遇到 TS Error 嘅生存指南

| Error | 你嘅翻譯 | Fix |
|-------|----------|-----|
| `Type 'X' is not assignable to type 'Y'` | 類型唔 match | 檢查值嘅類型，加 assertion 或改 interface |
| `Property 'x' does not exist on type 'Y'` | Object 冇呢個 field | 加到 interface 或用 optional chaining |
| `Argument of type 'X' is not assignable` | 傳錯類型參數 | 檢查函數 signature |
| `Object is possibly 'null'` | 可能係 null 你直接用 | 加 `if (x)` check 或 `x!`（確定唔係 null） |
| `Cannot find module 'X'` | 冇 type 定義 | `npm install @types/X` |
