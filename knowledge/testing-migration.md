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
