# GPT Context — 项目背景

# 使用方法：每次开新对话，把这整个文件内容 paste 入第一条消息，然后直接问问题

---

## 当前项目一：dep-doctor（CLI 工具）

Node.js CLI，扫描项目依赖，识别风险包，辅助 Sonatype IQ 问题排查。

**核心功能：**

- 读取 package.json + package-lock.json
- 并行 fetch npm registry，查每个包状态
- 磁盘缓存（避免重复请求）
- 识别：过期包 / 已废弃包 / 间接依赖来源（等同 npm why）
- 输出：terminal 彩色报告 + JSON 文件
- 双语注释（中英）

**已知问题：** [每次按实际情况补充]

---

## 当前项目二：旧项目现代化迁移

### Tech Stack 现状

```
React 16 / Jest（旧版）/ Cucumber / Webpack 4 / Node 20 / Enzyme
```

### 升级目标

| 项目     | 现状   | 目标                  |
| -------- | ------ | --------------------- |
| React    | 16     | 18（不上 19）         |
| Webpack  | 4      | Rspack                |
| Node     | 20     | 24                    |
| 测试     | Enzyme | React Testing Library |
| Coverage | <10%   | 85%+                  |

### BDD 测试框架

- Jest 30 + Cucumber.js（Gherkin）+ RTL + MSW
- 目标：branches / functions / lines / statements 全部 85%+
- 项目结构：features/ → step-definitions/ → **tests**/ → test-utils/

### React 16→18 关键风险

- componentWillMount / componentWillReceiveProps / componentWillUpdate 需替换
- ReactDOM.render() → createRoot()
- Automatic Batching 行为变化
- useEffect 在 discrete events 下变同步（注意 LCP 回归）
- IE 支持彻底移除

---

## 已知痛点（Sonatype IQ）

- 本地无法复现 pipeline 报错（本地有 node_modules 缓存）
- 间接依赖触发扫描报警（如 yup 被其他包引入）
- Pipeline 删包后仍然报（transitive dependency 问题，非缓存）

**排查命令：**

```bash
rm -rf node_modules && npm ci   # 模拟 pipeline 环境
npm why <package>               # 追踪间接依赖来源
npm ls <package>                # 查依赖树
```

---

## 回答要求

1. 直接给结论，不要废话
2. 优先给命令，少说原理（除非我问）
3. 中文回答，代码保持英文
4. 需要看代码时，告诉我 paste 哪部分
5. 每次只给下一步一件事，不要宏大计划
