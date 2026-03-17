# 搬遷指南 — 點樣搬到工作機 VS Code

---

## 第一次設置（15 分鐘搞掂）

### Step 1: 打開 GitHub 複製文件

1. 工作機瀏覽器打開 **https://github.com/nic611/copilot-toolkit**
2. 你會見到所有文件列表

### Step 2: 建目錄

喺你工作項目嘅**根目錄**（即 `package.json` 所在嘅位置），開 terminal：

```bash
mkdir -p .github/prompts
mkdir -p knowledge
mkdir -p .vscode
```

你嘅工作 repo 應該變成：
```
your-work-project/
├── .github/
│   ├── prompts/              ← 等陣放 prompt files
│   └── copilot-instructions.md  ← 等陣放 instructions
├── knowledge/                ← 等陣放速查手冊
├── .vscode/
│   └── settings.json         ← 等陣改設定
├── src/
├── package.json
└── ...
```

### Step 3: 複製 copilot-instructions.md

1. GitHub 上點開 `copilot-instructions.md`
2. 點右上角 **Raw** 按鈕
3. 全選 (`Ctrl+A`) → 複製 (`Ctrl+C`)
4. VS Code 新建文件：`.github/copilot-instructions.md`
5. 貼上 (`Ctrl+V`) → 保存

**⚠️ 重要：** 文件入面嘅 `Project Context` 段落，**本地改成你真實嘅 package 名**：
```markdown
## Project Context
- 3 unmaintained core packages (@xx/core, @xx/form) blocking upgrades
                                 ↑ 改成真名，只存本地，唔好 commit
```

### Step 4: 複製 Prompt Files

逐個文件重複以下步驟（或一次過）：

**方法 A: 逐個複製（穩陣）**
1. GitHub 上入 `prompts/` 文件夾
2. 點開 `quick-fix.prompt.md` → 點 **Raw** → 全選複製
3. VS Code 新建：`.github/prompts/quick-fix.prompt.md` → 貼上保存
4. 重複以上步驟，逐個 prompt file 複製

**方法 B: Clone 整個 repo 再 copy（快）**
```bash
# 喺 home 目錄或者任意地方
git clone https://github.com/nic611/copilot-toolkit.git ~/copilot-toolkit

# 複製到工作 repo
cp ~/copilot-toolkit/copilot-instructions.md /path/to/work-repo/.github/
cp ~/copilot-toolkit/prompts/*.prompt.md /path/to/work-repo/.github/prompts/

# 日後更新也係：
cd ~/copilot-toolkit && git pull
# 再 cp 過去
```

**方法 C: 如果工作機有 git + GitHub access**
```bash
cd /path/to/work-repo
# 直接下載個別文件
curl -O https://raw.githubusercontent.com/nic611/copilot-toolkit/main/copilot-instructions.md
mv copilot-instructions.md .github/

# 或者用 git archive 下載整個 prompts 文件夾
# 但通常方法 B 最方便
```

### Step 5: 複製 Knowledge 文件

```bash
# 如果用方法 B clone 咗
cp ~/copilot-toolkit/knowledge/*.md /path/to/work-repo/knowledge/
```

或者逐個從 GitHub 複製，同 Step 4 方法 A 一樣。

**Knowledge 文件唔入 git（加到 .gitignore）：**
```bash
# 加到工作 repo 的 .gitignore
echo "knowledge/" >> .gitignore
```

### Step 6: VS Code 設定

打開你工作 repo 嘅 `.vscode/settings.json`（冇就新建），加入：

```jsonc
{
  // 啟用 Copilot 讀取 .github/copilot-instructions.md
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,

  // 啟用 prompt files（/name 調用）
  "chat.promptFiles": true,

  // 啟用 agent mode
  "github.copilot.chat.agent.enabled": true
}
```

**如果 `.vscode/settings.json` 已經有內容：** 手動加呢三行入去已有嘅 `{}` 裡面，唔好覆蓋。

### Step 7: VS Code Snippets（可選但推薦）

1. VS Code 按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows）
2. 輸入 `Snippets: Configure Snippets`，撳 Enter
3. 選 `javascriptreact`（或 `typescriptreact`）
4. 會打開一個 JSON 文件
5. 從 GitHub 複製 `vscode/snippets-react.json` 嘅內容
6. 貼入去（merge 到已有 snippets 入面）
7. 保存

**之後你可以用嘅快捷：**
| 打字 | 生成 |
|------|------|
| `rfc` + Tab | React Function Component |
| `rfct` + Tab | React FC with TypeScript |
| `ust` + Tab | useState |
| `uef` + Tab | useEffect |
| `urf` + Tab | useRef |
| `usl` + Tab | useSelector |
| `udp` + Tab | useDispatch |
| `rtlt` + Tab | RTL test boilerplate |
| `cdb` + Tab | Debug console.log with 🔴 marker |

### Step 8: 驗證

1. 打開 VS Code 嘅 Copilot Chat（側欄或者 `Ctrl+Shift+I`）
2. 輸入 `/` — 你應該見到你嘅 prompt files 列表：
   ```
   /quick-fix
   /debug
   /explain
   /scan-file
   ...
   ```
3. 試下輸入 `/quick-fix` 然後貼一個 error message
4. 如果 Copilot 有回應就代表設定成功

**如果見唔到 prompt files：**
- 確認 `.github/prompts/` 文件夾存在
- 確認 `settings.json` 有 `"chat.promptFiles": true`
- 重啟 VS Code

---

## 日後更新（2 分鐘）

每晚你喺屋企用 CC 學到新嘢，我會幫你更新 `copilot-toolkit` repo。

第二日返工：

**如果用咗方法 B（clone 咗 repo）：**
```bash
cd ~/copilot-toolkit
git pull
cp knowledge/*.md /path/to/work-repo/knowledge/
# prompts 和 instructions 通常唔使成日更新
```

**如果用方法 A（手動複製）：**
- 打開 GitHub → 睇邊個文件有更新（睇 commit 時間）→ 複製更新嘅文件

---

## 完整文件列表 + 放邊度

| 來源文件 | 放去工作 repo 嘅位置 | 作用 |
|----------|---------------------|------|
| `copilot-instructions.md` | `.github/copilot-instructions.md` | Copilot 自動讀取，每次 chat 都附加 |
| `prompts/*.prompt.md` (15 個) | `.github/prompts/` | 用 `/name` 調用 |
| `knowledge/*.md` (8 個) | `knowledge/` (加入 .gitignore) | 自己查 + Copilot 可以引用 |
| `vscode/settings-recommended.jsonc` | `.vscode/settings.json` (merge) | 啟用 Copilot 功能 |
| `vscode/snippets-react.json` | VS Code user snippets | 代碼快捷輸入 |
| `tools/audit-react16-api.sh` | 任意位置 | 跑 deprecated API 掃描 |

---

## Prompt Files 速查

| 場景 | 輸入 | 效果 |
|------|------|------|
| Console 報錯 | `/quick-fix` + 貼 error | 即出 fix + 驗證命令 |
| 複雜 bug | `/debug` + 貼 error/描述 | 逐步診斷 + 根因分析 |
| 睇唔明段 code | 選中代碼 → `/explain` | 一句話總結 + 改進建議 |
| 全面體檢文件 | `/scan-file` + 文件路徑 | 架構 + 質量 + 遷移評分 |
| 追蹤數據點撚流 | `/trace-flow` + 起點描述 | 執行路徑圖 + 風險點 |
| 頁面慢 | `/optimize` + 文件/組件 | Quick Win / Medium / Heavy 分類 |
| 代碼太亂 | `/refactor` + 文件 | 重構建議 + 代碼 |
| 想知兼唔兼容 | `/diagnose-compat` + 文件 | React/Node/Webpack 版本矩陣 |
| 升級前檢查 | `/audit-deps` | 依賴 blocker 列表 |
| 遷移一個文件 | `/migrate-react` + 文件 | 逐步遷移指導 |
| Build 爆炸 | `/fix-build` + error | 診斷 + before/after fix |
| 寫新功能 | `/tdd` + 功能描述 | 先寫 test 再寫 code |
| 提 PR 前 | `/code-review` + 文件 | Quality checklist |
| 寫 PR | `/pr-description` | 從 git diff 生成描述 |
| 每日站會 | `/daily-standup` | 從 git log 生成 notes |

---

## GPT-5.x vs 4.1 策略

Premium tokens 有限，要慳住用：

| 用 4.1 (免費無限) | 用 5.x (premium) |
|-------------------|-------------------|
| `/quick-fix` | `/trace-flow` |
| `/debug` | `/optimize` |
| `/explain` | `/migrate-react` |
| `/scan-file` | `/diagnose-compat` |
| `/daily-standup` | `/refactor` |
| `/pr-description` | `/audit-deps` |

**原則：模式匹配型任務用 4.1，需要跨文件推理嘅用 5.x。**
