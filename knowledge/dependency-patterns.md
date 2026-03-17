# Dependency Hell Patterns & Solutions

> 工作速查：遇到依賴問題即查即用。

## 診斷命令

```bash
# 檢查 peerDep 衝突
npm ls react                    # 列出所有 react 版本
npm ls --all 2>&1 | grep "peer dep"  # 列出所有 peerDep warning

# pnpm 版本
pnpm why react                  # 為什麼安裝了某個版本
pnpm ls --depth=2               # 依賴樹

# 檢查 package 是否還在維護
npm view @xx/core time           # 最後發佈時間
npm view @xx/core maintainers    # 維護者
```

## 常見問題 → 解法

### 1. peerDep 版本衝突
```
npm ERR! peer dep: react@"^16.8.0" from @xx/core@2.3.1
```

**快速 unblock（臨時）：**
```jsonc
// package.json — npm 8.3+
{ "overrides": { "@xx/core": { "react": "$react" } } }

// .npmrc — pnpm
strict-peer-dependencies=false
```

**長期方案：** Adapter pattern（見 dependency-hell-sim/solutions/04-adapter/）

### 2. 多個 React 版本共存
```bash
npm ls react
# 如果看到多個版本 → Invalid Hook Call 的元兇
```

**Fix：**
```jsonc
// package.json
{ "resolutions": { "react": "^18.3.1" } }    // yarn
{ "overrides": { "react": "^18.3.1" } }       // npm
{ "pnpm": { "overrides": { "react": "^18.3.1" } } }  // pnpm
```

### 3. Unmaintained package 怎麼辦

決策樹：
```
Package unmaintained?
├── 有 community fork? → 用 fork（如 @cfaester/enzyme-adapter-react-18）
├── API surface 小? → 寫 drop-in replacement
├── 被多個包依賴? → Adapter pattern (在消費層 wrap)
└── 只有你一個項目用? → 直接 fork + patch
```

### 4. Monorepo 依賴同步
```bash
# 檢查所有 package 的 react 版本是否一致
find . -name "package.json" -not -path "*/node_modules/*" \
  -exec grep -l '"react"' {} \; \
  | xargs -I {} sh -c 'echo "=== {} ===" && node -e "
    const p = require(\"./{}\" );
    const deps = {...p.dependencies, ...p.peerDependencies};
    if(deps.react) console.log(\"react:\", deps.react);
  "'
```

## Audit Script

完整 audit 工具在：`dependency-hell-sim/tools/audit-react16-api.sh`

```bash
# 用法
./audit-react16-api.sh /path/to/project report.md
```

掃描：findDOMNode, componentWillMount, string refs, legacy context 等 17 種 deprecated API。
