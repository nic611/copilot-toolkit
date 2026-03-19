# GPT Prompt — 现代化迁移 CLI 工具

# 逐步将 legacy 项目（React 16 / Webpack 4 / Node 20）迁移到现代栈

# 使用方法：先发 Part 1，等 GPT 确认后再发 Part 2

---

## Part 1：发给 GPT 的第一条消息

```
我需要你帮我写一个 Node.js CLI 工具，用于辅助前端项目现代化迁移。
在写代码之前，请先阅读以下需求，然后：
1. 用中文总结你理解的迁移路径和 CLI 功能
2. 列出文件结构和依赖
3. 确认你理解 IE11 双模式的含义
4. 提出任何需要我澄清的地方

确认后我会让你生成代码。
```

---

## Part 2：生成指令

```
请完整生成 migration-doctor CLI 工具，规格如下：

## 项目背景
旧项目栈：React 16 / Webpack 4 / Node 20 / Enzyme / Jest（旧版）/ Cucumber
目标栈：React 18 / Rspack / Node 24 / RTL / Jest 30 / Cucumber（保留）

这个 CLI 帮工程师逐步执行迁移，每次只做一件事，有检查、有回滚。

## 双模式设计（核心需求）

工具启动时必须先询问：
```

? 当前项目是否需要支持 IE11？
❯ 是（IE11 兼容模式）
否（现代模式）

````

两种模式的差异：

| 配置项 | IE11 模式 | 现代模式 |
|--------|-----------|----------|
| Babel target | IE 11 + ES5 | last 2 Chrome versions |
| Polyfills | core-js/stable 全量引入 | 按需引入 |
| Rspack target | ['web', 'es5'] | ['web'] |
| CSS | 无 CSS variable | 支持 CSS variable |
| 动态 import | 转换为 require | 保留原生 |
| 测试环境 | jsdom（IE兼容配置）| jsdom（现代配置）|

## CLI 命令结构

```bash
migration-doctor                    # 交互式主菜单
migration-doctor check              # 全面检测当前项目状态
migration-doctor step <step-name>   # 执行某个迁移步骤
migration-doctor rollback <step>    # 回滚某个步骤
migration-doctor status             # 查看迁移进度
migration-doctor report             # 生成迁移报告
````

## 迁移步骤（按顺序，每步独立可执行）

### Step 1: audit

扫描当前项目，生成基线报告：

- Node 版本检测
- 找出所有 deprecated lifecycle methods（componentWillMount 等）
- 找出所有 ReactDOM.render() 调用
- 找出所有 Enzyme import
- 找出 IE 相关 polyfill 引用
- 输出：migration-baseline.json

### Step 2: node-upgrade

检测并指导 Node 20 → 24 升级：

- 检查 .nvmrc / .node-version 文件
- 检查 package.json engines 字段
- 检查是否有 Node 版本相关的 breaking change 风险
- 输出：需要执行的命令清单（不自动执行，只输出）

### Step 3: rspack

Webpack 4 → Rspack 迁移：

- 读取现有 webpack.config.js
- 生成对应的 rspack.config.js
- IE11 模式：自动加入 builtins.polyfill 配置
- 现代模式：移除所有 IE 相关 loader 和配置
- 输出 diff，让用户确认后再写入

### Step 4: jest-upgrade

Jest 旧版 → Jest 30：

- 检查现有 jest.config.js
- 生成新版配置（保留 Cucumber 集成）
- IE11 模式：testEnvironmentOptions 加入 IE 兼容配置
- 现代模式：启用 ESM 支持
- 输出 diff，让用户确认后再写入

### Step 5: enzyme-to-rtl

Enzyme → React Testing Library 迁移辅助：

- 扫描所有 .test.js / .spec.js 文件
- 统计 Enzyme API 使用情况（shallow / mount / wrapper.find 等）
- 生成迁移优先级清单（按使用频率排序）
- 对每个 Enzyme pattern，输出对应的 RTL 写法示例
- 不自动修改文件，只生成指南

### Step 6: react18

React 16 → 18 升级：

- 扫描所有 deprecated lifecycle methods，输出位置清单
- 扫描所有 ReactDOM.render()，输出替换建议
- 检查 Automatic Batching 潜在影响
- IE11 模式：阻止执行，输出警告（React 18 不支持 IE11）
- 现代模式：生成升级步骤清单

## 进度追踪

每个 step 执行后，记录到 .migration-progress.json：

```json
{
  "mode": "ie11|modern",
  "startDate": "2026-03-16",
  "steps": {
    "audit": { "status": "done", "date": "...", "issues": 12 },
    "node-upgrade": { "status": "pending" },
    "rspack": { "status": "skipped", "reason": "..." }
  }
}
```

migration-doctor status 读取此文件，显示进度条。

## 代码质量要求

**双语注释（必须）：**
每个函数 JSDoc 注释中英双语，英文在上，中文在下。

**安全原则：**

- 所有文件写入操作必须先显示 diff，用户确认后才执行
- 每次写入前自动备份原文件到 .migration-backups/
- 任何步骤失败都有明确 rollback 命令提示

**错误处理：**

- 找不到 package.json：清晰报错 + 提示需在项目根目录运行
- 步骤依赖未满足（如 step 6 要求先完成 step 1）：阻止执行并说明原因

**项目结构：**

```
migration-doctor/
├── bin/
│   └── migration-doctor.js
├── src/
│   ├── cli.js               # 主菜单和路由
│   ├── steps/
│   │   ├── audit.js
│   │   ├── node-upgrade.js
│   │   ├── rspack.js
│   │   ├── jest-upgrade.js
│   │   ├── enzyme-to-rtl.js
│   │   └── react18.js
│   ├── modes/
│   │   ├── ie11.js          # IE11 模式配置模板
│   │   └── modern.js        # 现代模式配置模板
│   ├── progress.js          # 进度读写
│   ├── diff.js              # 文件 diff 展示
│   └── backup.js            # 备份逻辑
├── package.json
└── README.md
```

依赖：inquirer@9 / chalk@5 / ora@7 / commander@12 / diff（npm 包）
不要用其他第三方依赖。

每个文件完整输出，不省略代码。

```

```
