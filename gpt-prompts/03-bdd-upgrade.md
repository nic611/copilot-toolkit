# GPT Prompt — BDD 框架升级 + 覆盖率提升

# 从 Enzyme + 旧 Jest 升级到 RTL + Jest 30 + Cucumber，覆盖率 10% → 85%

# 使用方法：先发 Part 1，等 GPT 确认后再发 Part 2

---

## Part 1：发给 GPT 的第一条消息

```
我需要你帮我规划并生成 BDD 测试框架升级方案。
在写任何代码之前，请先阅读以下需求，然后：
1. 用中文总结你理解的当前状态和目标状态
2. 列出迁移的关键风险点
3. 列出你会生成哪些文件
4. 确认你理解覆盖率目标的四个维度

确认后我会让你开始生成。
```

---

## Part 2：生成指令

````
请完整生成 BDD 测试框架升级方案，包括配置文件、工具函数和示例测试，规格如下：

## 当前状态
- 测试框架：Enzyme + Jest（旧版）
- BDD：Cucumber.js（已有，保留）
- Coverage：< 10%（branches / functions / lines / statements 全部）
- React：16（迁移期间需同时兼容）

## 目标状态
- 测试框架：React Testing Library (RTL) + Jest 30
- BDD：Cucumber.js（保留，升级配置）
- Coverage：85%+（四项全部）
- 支持 React 16 和 18 组件测试

---

## 1. Jest 30 配置

生成 jest.config.js，要求：
- testEnvironment: jsdom
- 支持 ESM（transformIgnorePatterns 正确配置）
- 保留 Cucumber 的 step definitions 路径
- coverage 配置：
  - provider: v8（比 babel 更准确）
  - thresholds：branches 85 / functions 85 / lines 85 / statements 85
  - collectCoverageFrom 包含 src/**/*.{js,jsx}，排除 index.js / stories / mocks
- setupFilesAfterFramework 引入 @testing-library/jest-dom

同时生成 babel.config.js，支持：
- @babel/preset-env（target: current node）
- @babel/preset-react
- 支持动态 import

---

## 2. 测试工具函数（test-utils/）

### render.js — 自定义 render wrapper
包含：
- 默认 wrapper（带 Redux Provider / Router / ThemeProvider，按实际情况可选）
- 支持传入自定义 store / route
- 双语注释

### fixtures.js — 测试数据工厂
包含：
- createUser(overrides) — 生成用户对象
- createFormData(overrides) — 生成表单数据
- 工厂函数模式（每次调用返回新对象，避免测试间污染）

### mocks/ — API Mock 配置
- 使用 msw@2（Mock Service Worker）
- handlers.js：定义常用 API mock（GET/POST 示例各一个）
- server.js：jest setup 用的 msw server（beforeAll / afterEach / afterAll）
- browser.js：浏览器环境用的 worker

---

## 3. Enzyme → RTL 迁移对照表

生成 docs/enzyme-to-rtl-guide.md，包含以下 pattern 的迁移对照：

| Enzyme 写法 | RTL 对应写法 |
|-------------|-------------|
| shallow(<Component />) | render(<Component />) |
| mount(<Component />) | render(<Component />) |
| wrapper.find('button') | screen.getByRole('button') |
| wrapper.find('.class') | screen.getByTestId / getByText |
| wrapper.simulate('click') | userEvent.click(element) |
| wrapper.prop('onClick') | 直接 getByRole + userEvent |
| wrapper.state() | 通过 UI 验证状态结果 |
| wrapper.instance() | 不推荐，改用 behavior 测试 |

每个对照必须附上完整的代码示例（before/after）。

---

## 4. Cucumber 配置升级

生成 cucumber.js（配置文件），要求：
- 正确指向 features/ 和 step-definitions/
- 支持 @tag 过滤运行特定场景
- 生成 HTML 报告（cucumber-html-reporter）
- 配合 Jest 覆盖率（说明如何合并 Cucumber + Jest 的 coverage）

生成一个完整的 feature 文件示例（features/login.feature）：
- 使用规范的 Gherkin 语法
- 包含 Scenario / Scenario Outline 两种形式
- 中英双语注释说明

生成对应的 step definitions（step-definitions/login.steps.js）：
- 使用 RTL + msw mock API
- 双语注释

---

## 5. 覆盖率提升策略

生成 docs/coverage-strategy.md，包含：

### 快速提升覆盖率的优先级
1. 工具函数（utils/）— 纯函数，最容易测，收益最高
2. Custom hooks — 用 renderHook，覆盖率提升快
3. 表单组件 — 用 userEvent，覆盖 validation branches
4. API 调用层 — 用 msw mock，覆盖 success/error branches

### 覆盖率陷阱（branches 最难达到 85%）
- 每个 if/else/ternary 都是 branch
- 重点：error handling / loading state / empty state 这三类 branch 最容易漏
- 建议：先跑 coverage，找 uncovered branches，再针对性补测试

### 每周 coverage 追踪
提供一个 npm script：
```bash
"coverage:report": "jest --coverage --coverageReporters=json-summary && node scripts/coverage-check.js"
````

生成 scripts/coverage-check.js：

- 读取 coverage-summary.json
- 输出四项指标的当前值 vs 目标值
- 如果任何一项低于 85%，exit code 1（CI 失败）
- 彩色输出（chalk）

---

## 6. package.json scripts

生成完整的 scripts 配置：

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:bdd": "cucumber-js",
  "test:all": "jest --coverage && cucumber-js",
  "coverage:check": "npm run test:coverage && node scripts/coverage-check.js",
  "coverage:open": "open coverage/lcov-report/index.html"
}
```

---

## 输出要求

- 每个文件完整输出
- 不要用占位符省略代码
- 双语注释必须在所有工具函数中出现
- 所有示例代码可以直接运行
- 完成后提供"第一步执行"的命令清单

```

---

## 补充追问模板

如果覆盖率仍难提升，追加：
```

我当前的 coverage 报告显示以下 branches 没有覆盖：
[paste coverage 报告的 uncovered lines]

请帮我针对以上未覆盖的 branch，生成对应的测试用例。

```

如果 msw 配置有问题：
```

我用的是 msw@2，在 Jest 30 环境下遇到以下错误：
[paste 错误信息]
请给出完整的修复方案。

```

```
