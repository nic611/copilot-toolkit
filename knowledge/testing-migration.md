# Testing Migration Cheatsheet
# Enzyme → RTL → (Vitest 探索)

## Enzyme → React Testing Library (RTL)

### 核心思維轉變
| | Enzyme | RTL |
|---|---|---|
| 測什麼 | **實現細節**（state, instance） | **用戶行為**（看到什麼、點什麼） |
| 查找元素 | CSS selector, component name | **Accessible queries**（role, text, label） |
| 渲染方式 | `shallow()`, `mount()` | `render()`（永遠 full render） |
| Assert | `.state()`, `.instance()` | `screen.getByText()`, `.toBeInTheDocument()` |

### Query 優先級（RTL 官方推薦）
```
1. getByRole        ← 最推薦（accessible）
2. getByLabelText   ← form elements
3. getByPlaceholderText
4. getByText        ← 非 interactive elements
5. getByDisplayValue
6. getByAltText     ← images
7. getByTitle
8. getByTestId      ← 最後手段
```

### Enzyme → RTL 對照

#### 渲染
```jsx
// ❌ Enzyme
import { shallow, mount } from 'enzyme';
const wrapper = shallow(<Button label="Submit" />);

// ✅ RTL
import { render, screen } from '@testing-library/react';
render(<Button label="Submit" />);
```

#### 查找元素
```jsx
// ❌ Enzyme
wrapper.find('.btn-primary');           // CSS selector
wrapper.find('Button');                  // Component name
wrapper.find('[data-test="submit"]');    // Test attribute

// ✅ RTL
screen.getByRole('button', { name: 'Submit' });  // By role + text
screen.getByText('Submit');                        // By visible text
screen.getByTestId('submit');                      // 最後手段
```

#### 事件觸發
```jsx
// ❌ Enzyme
wrapper.find('button').simulate('click');
wrapper.find('input').simulate('change', { target: { value: 'test' } });

// ✅ RTL (用 userEvent，更真實)
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();

await user.click(screen.getByRole('button'));
await user.type(screen.getByRole('textbox'), 'test');
await user.selectOptions(screen.getByRole('combobox'), 'option1');
await user.clear(screen.getByRole('textbox'));
```

#### State / Props 檢查
```jsx
// ❌ Enzyme（測實現細節）
expect(wrapper.state('count')).toBe(1);
expect(wrapper.instance().props.name).toBe('Nic');

// ✅ RTL（測用戶看到的結果）
expect(screen.getByText('Count: 1')).toBeInTheDocument();
expect(screen.getByText('Hello, Nic')).toBeInTheDocument();
```

#### Async / 等待
```jsx
// ❌ Enzyme
wrapper.update();  // 手動更新
await new Promise(r => setTimeout(r, 100));  // 硬等

// ✅ RTL
import { waitFor } from '@testing-library/react';
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
// 或
const element = await screen.findByText('Loaded');  // findBy = getBy + waitFor
```

#### Mock API
```jsx
// ❌ 直接 mock module
jest.mock('./api', () => ({ fetchUser: jest.fn() }));

// ✅ 推薦用 MSW (Mock Service Worker)
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/user', (req, res, ctx) => {
    return res(ctx.json({ name: 'Nic' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 常見遷移 Pattern

#### Class Component with state
```jsx
// Enzyme test
it('increments counter', () => {
  const wrapper = mount(<Counter />);
  expect(wrapper.state('count')).toBe(0);
  wrapper.find('button').simulate('click');
  expect(wrapper.state('count')).toBe(1);
});

// RTL test (同一個 component，唔需要改 component code)
it('increments counter', async () => {
  const user = userEvent.setup();
  render(<Counter />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '+' }));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

#### Form submission
```jsx
// Enzyme
it('submits form', () => {
  const onSubmit = jest.fn();
  const wrapper = mount(<LoginForm onSubmit={onSubmit} />);
  wrapper.find('input[name="email"]').simulate('change', { target: { value: 'a@b.com' } });
  wrapper.find('form').simulate('submit');
  expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' });
});

// RTL
it('submits form', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(<LoginForm onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText('Email'), 'a@b.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.com' });
});
```

## BDD with Cucumber (Jest + Cucumber)

### 結構
```
features/
├── login.feature          ← Gherkin 語法描述行為
└── step_definitions/
    └── login.steps.js     ← 用 RTL 實現 step
```

### Feature File
```gherkin
Feature: User Login

  Scenario: Successful login
    Given I am on the login page
    When I enter "user@test.com" as email
    And I enter "password123" as password
    And I click the login button
    Then I should see the dashboard
```

### Step Definitions (RTL)
```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { defineFeature, loadFeature } from 'jest-cucumber';

const feature = loadFeature('./features/login.feature');
const user = userEvent.setup();

defineFeature(feature, (test) => {
  test('Successful login', ({ given, when, and, then }) => {
    given('I am on the login page', () => {
      render(<LoginPage />);
    });
    when(/I enter "(.*)" as email/, async (email) => {
      await user.type(screen.getByLabelText('Email'), email);
    });
    and(/I enter "(.*)" as password/, async (pw) => {
      await user.type(screen.getByLabelText('Password'), pw);
    });
    and('I click the login button', async () => {
      await user.click(screen.getByRole('button', { name: 'Login' }));
    });
    then('I should see the dashboard', async () => {
      expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    });
  });
});
```

---

## Vitest — 未來探索

> Jest 替代。同 Vite 共享 config，速度更快。暫時唔急，但留意。

### Jest vs Vitest
| | Jest | Vitest |
|---|---|---|
| 設置 | 需要配置 transform | **共享 vite.config** |
| 速度 | 中等 | **快 2-5x (ESM native)** |
| API | `jest.fn()`, `jest.mock()` | `vi.fn()`, `vi.mock()` (幾乎一樣) |
| Watch mode | 全部重跑 | **智能：只跑改動相關** |
| 生態 | 最成熟 | 快速追上 |
| 瀏覽器測試 | jsdom (模擬) | 支持真實瀏覽器 |

### Jest → Vitest 改動極小
```js
// Jest
import { jest } from '@jest/globals';
const fn = jest.fn();
jest.mock('./api');

// Vitest (改 import + jest → vi)
import { vi } from 'vitest';
const fn = vi.fn();
vi.mock('./api');
```

### 什麼時候換 Vitest
- ✅ 新項目用 Vite → 直接用 Vitest
- ✅ Jest 設置太複雜 / 太慢
- ❌ 舊項目 Webpack + Jest 跑得好 → 暫時唔急換
- ❌ 大量 Jest snapshot tests → 遷移成本高

### 推薦路線
```
現在:  Enzyme → RTL (用 Jest)     ← 你而家做呢步
之後:  如果換 Vite → 順便換 Vitest
否則:  Jest 繼續用，冇問題
```

---

## 完整對比：同一個 Test，Enzyme vs RTL vs Vitest

> 場景：測試 LoginForm component — 渲染、填表、提交、error handling、async。

### 被測 Component（三者共用）

```jsx
// LoginForm.jsx
import React, { useState } from 'react';

export default function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      {error && <div role="alert">{error}</div>}
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Enzyme + Jest

```jsx
// LoginForm.enzyme.test.jsx
import React from 'react';
import { mount } from 'enzyme';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  // ===== 渲染 =====
  it('renders form elements', () => {
    const wrapper = mount(<LoginForm onSubmit={jest.fn()} />);
    expect(wrapper.find('input[type="email"]')).toHaveLength(1);
    expect(wrapper.find('input[type="password"]')).toHaveLength(1);
    expect(wrapper.find('button[type="submit"]')).toHaveLength(1);
    expect(wrapper.find('button').text()).toBe('Login');
  });

  // ===== 填表 =====
  it('updates input values', () => {
    const wrapper = mount(<LoginForm onSubmit={jest.fn()} />);
    wrapper.find('input[type="email"]').simulate('change', {
      target: { value: 'nic@test.com' },
    });
    wrapper.find('input[type="password"]').simulate('change', {
      target: { value: 'password123' },
    });
    // ⚠️ 測實現細節：直接檢查 input value
    expect(wrapper.find('input[type="email"]').prop('value')).toBe('nic@test.com');
    expect(wrapper.find('input[type="password"]').prop('value')).toBe('password123');
  });

  // ===== Validation =====
  it('shows error when email is empty', () => {
    const wrapper = mount(<LoginForm onSubmit={jest.fn()} />);
    wrapper.find('form').simulate('submit');
    wrapper.update();
    expect(wrapper.text()).toContain('Email is required');
  });

  // ===== 提交 =====
  it('calls onSubmit with form data', async () => {
    const onSubmit = jest.fn().mockResolvedValue({});
    const wrapper = mount(<LoginForm onSubmit={onSubmit} />);

    wrapper.find('input[type="email"]').simulate('change', {
      target: { value: 'nic@test.com' },
    });
    wrapper.find('input[type="password"]').simulate('change', {
      target: { value: 'pass123' },
    });
    wrapper.find('form').simulate('submit');

    // ⚠️ Enzyme 需要手動等 async
    await new Promise((r) => setTimeout(r, 0));
    wrapper.update();

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'nic@test.com',
      password: 'pass123',
    });
  });

  // ===== Loading state =====
  it('shows loading state during submit', async () => {
    let resolveSubmit;
    const onSubmit = jest.fn(() => new Promise((r) => { resolveSubmit = r; }));
    const wrapper = mount(<LoginForm onSubmit={onSubmit} />);

    wrapper.find('input[type="email"]').simulate('change', { target: { value: 'a@b.com' } });
    wrapper.find('input[type="password"]').simulate('change', { target: { value: '123' } });
    wrapper.find('form').simulate('submit');
    wrapper.update();

    expect(wrapper.find('button').text()).toBe('Logging in...');
    expect(wrapper.find('button').prop('disabled')).toBe(true);

    resolveSubmit();
    await new Promise((r) => setTimeout(r, 0));
    wrapper.update();

    expect(wrapper.find('button').text()).toBe('Login');
  });

  // ===== Error handling =====
  it('shows server error', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    const wrapper = mount(<LoginForm onSubmit={onSubmit} />);

    wrapper.find('input[type="email"]').simulate('change', { target: { value: 'a@b.com' } });
    wrapper.find('input[type="password"]').simulate('change', { target: { value: '123' } });
    wrapper.find('form').simulate('submit');

    await new Promise((r) => setTimeout(r, 0));
    wrapper.update();

    expect(wrapper.text()).toContain('Invalid credentials');
  });
});
```

### React Testing Library + Jest

```jsx
// LoginForm.rtl.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  // ===== 渲染 =====
  it('renders form elements', () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  // ===== 填表 =====
  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'nic@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    // ✅ 測用戶看到的結果，不測 input value
    expect(screen.getByLabelText('Email')).toHaveValue('nic@test.com');
    expect(screen.getByLabelText('Password')).toHaveValue('password123');
  });

  // ===== Validation =====
  it('shows error when email is empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  // ===== 提交 =====
  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue({});
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'nic@test.com');
    await user.type(screen.getByLabelText('Password'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    // ✅ 不需要手動 update 或 setTimeout
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'nic@test.com',
        password: 'pass123',
      });
    });
  });

  // ===== Loading state =====
  it('shows loading state during submit', async () => {
    const user = userEvent.setup();
    let resolveSubmit;
    const onSubmit = jest.fn(() => new Promise((r) => { resolveSubmit = r; }));
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    // ✅ 用 accessible name 查找
    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();

    resolveSubmit();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled();
    });
  });

  // ===== Error handling =====
  it('shows server error', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });
});
```

### Vitest + RTL（同一個 test，換 runner）

```jsx
// LoginForm.vitest.test.jsx
import { describe, it, expect, vi } from 'vitest';          // ← 唯一大差異
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  // ===== 渲染 =====
  it('renders form elements', () => {
    render(<LoginForm onSubmit={vi.fn()} />);                // jest.fn() → vi.fn()
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  // ===== 填表 =====
  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'nic@test.com');
    await user.type(screen.getByLabelText('Password'), 'password123');

    expect(screen.getByLabelText('Email')).toHaveValue('nic@test.com');
    expect(screen.getByLabelText('Password')).toHaveValue('password123');
  });

  // ===== Validation =====
  it('shows error when email is empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  // ===== 提交 =====
  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});           // jest → vi
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'nic@test.com');
    await user.type(screen.getByLabelText('Password'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'nic@test.com',
        password: 'pass123',
      });
    });
  });

  // ===== Loading state =====
  it('shows loading state during submit', async () => {
    const user = userEvent.setup();
    let resolveSubmit;
    const onSubmit = vi.fn(() => new Promise((r) => { resolveSubmit = r; }));
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeDisabled();

    resolveSubmit();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled();
    });
  });

  // ===== Error handling =====
  it('shows server error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });
});
```

### 三者對比總表

| 維度 | Enzyme + Jest | RTL + Jest | RTL + Vitest |
|------|---------------|------------|--------------|
| **查找元素** | `find('input[type="email"]')` | `getByLabelText('Email')` | 同 RTL |
| **觸發事件** | `.simulate('change', {target})` | `await user.type()` | 同 RTL |
| **等待 async** | `setTimeout` + `wrapper.update()` | `waitFor()` / `findBy` | 同 RTL |
| **Mock** | `jest.fn()` | `jest.fn()` | `vi.fn()` |
| **Mock module** | `jest.mock('./api')` | `jest.mock('./api')` | `vi.mock('./api')` |
| **Assert** | `.prop('value')`, `.text()` | `.toHaveValue()`, `getByRole` | 同 RTL |
| **測試理念** | 測實現細節 | 測用戶行為 | 測用戶行為 |
| **Config** | jest.config.js + babel | jest.config.js + babel | **零 config (共享 vite.config)** |
| **速度** | 慢 | 中 | **快 2-5x** |
| **RTL → Vitest 改動量** | — | — | **只改 import + jest→vi** |

### Config 對比

```js
// ===== jest.config.js (Enzyme 或 RTL) =====
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterSetup: ['./jest.setup.js'],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 },
  },
};
```

```js
// ===== vitest.config.js =====
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,                 // 不需要 import describe/it
    setupFiles: './vitest.setup.js',
    coverage: {
      thresholds: { branches: 85, functions: 85, lines: 85, statements: 85 },
    },
    alias: {
      '@': '/src',
    },
    // CSS 自動 mock，不需要 identity-obj-proxy
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
// 就這麼多！不需要 babel, transform, moduleNameMapper
```
