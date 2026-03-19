# GPT Prompt — dep-doctor CLI 工具

# 使用方法：先发 Part 1，等 GPT 确认后再发 Part 2

---

## Part 1：发给 GPT 的第一条消息（让它先理解再动手）

```
我需要你帮我写一个 Node.js CLI 工具，名为 dep-doctor。
在你写任何代码之前，请先阅读以下需求，然后：
1. 用中文总结你理解的 tech stack 和核心功能
2. 列出你会用到的所有 npm 依赖及版本
3. 列出你打算生成的文件清单
4. 指出任何你认为需要我确认的地方

确认后我会让你开始生成代码。
```

---

## Part 2：GPT 确认后发送的生成指令

````
好，请按以下规格完整生成 dep-doctor：

## 项目定位
Node.js CLI 工具，扫描前端项目的 npm 依赖健康状况。
目标用户：前端工程师，用于辅助 Sonatype IQ 安全扫描问题排查。

## 技术规格

**运行环境：** Node.js 18+，ESM 模块（package.json 设 "type": "module"）
**入口：** bin/dep-doctor.js，支持 npx 直接运行
**核心依赖（只用这些）：**
- chalk@5 — 终端颜色输出
- ora@7 — loading spinner
- cli-table3 — 表格输出
- commander@12 — CLI 参数解析
- 不要用任何其他第三方依赖，fetch 用 Node 原生 fetch

## 核心功能（按优先级）

### 1. 读取依赖
- 读取当前目录的 package.json
- 读取 package-lock.json（解析 v2/v3 格式）
- 区分 dependencies / devDependencies / 间接依赖（transitive）

### 2. 并行查询 npm registry
- 并发查询 https://registry.npmjs.org/<package>
- 并发数限制：最多 10 个同时进行（避免被限流）
- 每个查询 timeout：8 秒
- 失败时 retry 一次

### 3. 磁盘缓存
- 缓存目录：~/.dep-doctor-cache/
- 缓存文件：<package>@<version>.json
- 缓存有效期：24 小时
- 缓存命中时跳过网络请求，显示"(cached)"标记

### 4. 风险识别
识别以下类型，每种用不同颜色标注：
- 🔴 DEPRECATED：npm registry 标记为 deprecated 的包
- 🟡 OUTDATED：当前版本与最新版本差距超过 1 个 major version
- 🟠 TRANSITIVE：不在 package.json 但出现在 node_modules（间接依赖）
- 🔵 OK：正常

### 5. 输出格式

**Terminal 输出（默认）：**
- 扫描开始时显示 spinner + "Scanning X packages..."
- 结果用 cli-table3 表格显示
- 表格列：Package | Version | Latest | Status | Source
- 最后显示 summary：总包数 / 风险包数 / 缓存命中数

**JSON 输出（--json flag）：**
- 输出完整结果到 dep-doctor-report.json
- 包含：scanTime / totalPackages / risks[] / summary

### 6. CLI 命令

```bash
dep-doctor                    # 扫描当前目录
dep-doctor --json             # 同时输出 JSON 报告
dep-doctor --no-cache         # 跳过缓存，强制重新请求
dep-doctor --depth=direct     # 只扫直接依赖（默认 all）
dep-doctor why <package>      # 追踪某个包的来源（模仿 npm why）
````

## 代码质量要求

**双语注释（必须）：**
每个函数必须有中英双语 JSDoc 注释，格式：

```js
/**
 * Fetch package info from npm registry with retry
 * 从 npm registry 获取包信息，支持重试
 * @param {string} packageName - npm package name / npm 包名
 * @returns {Promise<PackageInfo>} package metadata / 包元数据
 */
```

**错误处理：**

- 找不到 package.json：显示清晰错误信息，exit code 1
- 网络失败：显示警告但继续扫描其他包，不中断
- 缓存写入失败：静默忽略，继续正常流程

**项目结构：**

```
dep-doctor/
├── bin/
│   └── dep-doctor.js        # CLI 入口
├── src/
│   ├── scanner.js           # 核心扫描逻辑
│   ├── registry.js          # npm registry 请求 + 并发控制
│   ├── cache.js             # 磁盘缓存读写
│   ├── analyzer.js          # 风险分析逻辑
│   ├── reporter.js          # 终端输出格式化
│   └── utils.js             # 工具函数（并发限制等）
├── package.json
└── README.md                # 中英双语说明
```

## 输出要求

- 每个文件完整输出，不要省略任何部分
- 不要用 "// ... rest of code" 这类占位符
- 代码可以直接运行，不需要我补充任何东西
- 完成后告诉我如何本地测试

```

---

## 补充说明（如果 GPT 输出质量不够）

如果某个文件输出不完整，追加：
```

请完整输出 src/registry.js，不要省略任何代码，包括所有注释。

```

如果双语注释不符合要求：
```

请检查所有函数的 JSDoc 注释，确保每个函数都有中英双语说明，
格式：英文在上，中文在下，参数和返回值都要双语标注。

```

```
