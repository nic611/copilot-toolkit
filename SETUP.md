# Portable Copilot Setup — 搬遷指南

## 你嘅 Workflow

```
晚上 (Home Mac + CC):
  學嘢 / 練習 / 整 prompt
  → git push 去個人 GitHub

返工 (Work Mac):
  → 打開個人 GitHub → 複製需要嘅文件落工作 repo
  → Copilot 自動讀取 instructions + prompts
  → 用 /name 調用各種 workflow
```

## 完整文件列表

```
portable/
├── SETUP.md                              ← 你在看的 (唔好 copy 去工作 repo)
├── copilot-instructions.md               → .github/copilot-instructions.md
│
├── prompts/                              → .github/prompts/
│   ├── quick-fix.prompt.md               ← 最常用：貼 error 即出 fix
│   ├── debug.prompt.md                   ← 深度 debug
│   ├── explain.prompt.md                 ← 讀源碼 + 解釋
│   ├── scan-file.prompt.md               ← 全面體檢
│   ├── trace-flow.prompt.md              ← 追蹤數據流
│   ├── optimize.prompt.md                ← 性能分析
│   ├── refactor.prompt.md                ← 重構建議
│   ├── diagnose-compat.prompt.md         ← 版本兼容檢查
│   ├── audit-deps.prompt.md              ← 依賴審計
│   ├── migrate-react.prompt.md           ← React 遷移
│   ├── fix-build.prompt.md               ← Build error
│   ├── tdd.prompt.md                     ← 先寫 test
│   ├── code-review.prompt.md             ← PR 前自查
│   ├── pr-description.prompt.md          ← 生成 PR 描述
│   └── daily-standup.prompt.md           ← Standup notes
│
├── knowledge/                            ← 知識庫 (放工作 repo 或自己看)
│   ├── react-migration.md                ← React 16→19 完整速查
│   ├── webpack-migration.md              ← Webpack 4→5 速查
│   ├── node-migration.md                 ← Node 22→25 速查
│   ├── ts-quickref.md                    ← TS for JS devs 速查
│   ├── dependency-patterns.md            ← 依賴地獄解法
│   └── daily-patterns.md                 ← 日常 React/Git/Debug patterns
│
└── vscode/                               ← VS Code 配置
    ├── settings-recommended.jsonc        → .vscode/settings.json (選擇性 merge)
    └── snippets-react.json               → 用戶 snippets (見下方安裝方法)
```

## 搬遷方法（從個人 GitHub 複製）

### Step 1: Copilot Instructions + Prompts
```bash
# 在工作 repo 根目錄
mkdir -p .github/prompts

# 從你個人 GitHub 下載（或直接開 raw 複製）
# copilot-instructions.md → .github/copilot-instructions.md
# prompts/*.prompt.md → .github/prompts/

# ⚠️ copilot-instructions.md 嘅 Project Context 段落
# 記得本地改成真實 package 名，唔好 push 上 GitHub
```

### Step 2: Knowledge 文件（可選位置）
```bash
# 方案 A: 放工作 repo (Copilot 可以引用)
mkdir -p knowledge
# 複製 knowledge/*.md

# 方案 B: 放個人目錄 (唔入 git)
mkdir -p ~/knowledge
# 複製到 ~/knowledge/
```

### Step 3: VS Code Settings
```bash
# settings — 手動 merge 需要嘅部分到 .vscode/settings.json
# 至少加這兩行：
# "chat.promptFiles": true
# "github.copilot.chat.codeGeneration.useInstructionFiles": true
```

### Step 4: Snippets
```
VS Code → Cmd+Shift+P → "Snippets: Configure Snippets"
→ 選 "javascriptreact" 或 "typescriptreact"
→ 貼入 snippets-react.json 內容
```

## VS Code 設置

### 1. 啟用 prompt files
```jsonc
// .vscode/settings.json
{
  "chat.promptFiles": true,
  "github.copilot.chat.codeGeneration.useInstructionFiles": true
}
```

### 2. 啟用 agent mode（如有）
```jsonc
{
  "github.copilot.chat.agent.enabled": true
}
```

### 3. 個人全局 instructions（可選）
建 `~/copilot-instructions.md`，放你嘅個人偏好：
```markdown
- I prefer direct answers, no filler
- 中英混合 OK, technical terms in English
- Always show code before explanation
- Flag deprecated React APIs proactively
```

## 使用方法

### Prompt Files（在 Copilot Chat 輸入 `/`）
| Command | 用途 | 適合場景 |
|---------|------|----------|
| `/quick-fix` | 貼 error → 即刻出 fix | 日常 debug，最常用 |
| `/debug` | 深度診斷 error | 複雜 bug，需要追蹤根因 |
| `/explain` | 讀源碼 → 解釋 + 改進建議 | 看不熟悉嘅代碼 |
| `/scan-file` | 全面掃描一個文件 | Code review、接手新代碼 |
| `/trace-flow` | 追蹤數據流 / 執行路徑 | 理解系統如何串聯 |
| `/optimize` | 性能分析 + 改進建議 | 頁面慢、bundle 大 |
| `/refactor` | 重構建議 + 代碼 | 代碼太長太亂 |
| `/diagnose-compat` | 版本兼容性檢查 | 遷移前評估 |
| `/audit-deps` | 依賴審計 | 升級前檢查 blocker |
| `/migrate-react` | React 遷移指導 | 逐文件遷移 |
| `/fix-build` | Build error 診斷修復 | 遷移後爆炸 |
| `/tdd` | 寫 test first | 新功能/bug fix |
| `/code-review` | Code review checklist | PR 前自查 |
| `/pr-description` | 生成 PR 描述 | 提 PR |
| `/daily-standup` | Standup notes | 每日站會 |

### 日常 Workflow

```
早上開工：
  /daily-standup          → 生成 standup notes

寫代碼遇到 error：
  /quick-fix              → 快速修（90% 情況夠用）
  /debug                  → 複雜 bug 深度診斷

看別人代碼：
  選中代碼 → /explain     → 即時理解
  /trace-flow             → 追蹤整個流程

提 PR 前：
  /scan-file              → 自查每個改動文件
  /code-review            → 跑一次 review checklist
  /pr-description         → 生成 PR 描述

遷移相關：
  /diagnose-compat        → 先檢查兼容性
  /migrate-react          → 逐文件遷移
  /audit-deps             → 依賴 blocker 檢查
```

### GPT-5.x vs 4.1 使用策略

| 場景 | 推薦 Model | 原因 |
|------|-----------|------|
| `/quick-fix`, `/debug` | 4.1 夠用 | 模式匹配，唔需要深度推理 |
| `/explain`, `/scan-file` | 4.1 夠用 | 讀 + 總結 |
| `/trace-flow`, `/optimize` | 5.x 更好 | 需要跨文件推理 |
| `/migrate-react`, `/diagnose-compat` | 5.x 更好 | 需要版本知識 + 判斷 |
| `/refactor` | 5.x 更好 | 需要架構思維 |

**策略：** 日常用 4.1 省 premium tokens，遷移/架構任務先切 5.x。

## 同 CC 嘅分工

| 任務 | 用 Copilot (Work) | 用 CC (Home) |
|------|-------------------|--------------|
| 日常 debug | ✅ | |
| 寫代碼 + quick fix | ✅ | |
| 深度架構分析 | | ✅ (Opus) |
| 遷移 POC + planning | | ✅ (plan mode) |
| 知識沉澱 | | ✅ → knowledge/*.md |
| RFC / proposal | | ✅ |
| Prompt 優化 | | ✅ → 同步到 work |
