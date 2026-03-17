# Build Tool Migration Cheatsheet
# Webpack 4 → 5 → Rspack / Vite

## Breaking Changes 速查

### Dev Server
```js
// ❌ Webpack 4 (devServer)
devServer: {
  contentBase: './dist',
  hot: true,
}

// ✅ Webpack 5 (devServer v4)
devServer: {
  static: './dist',
  hot: true,
}
```

### Asset Modules（替代 file/url/raw-loader）
```js
// ❌ Webpack 4
module: {
  rules: [
    { test: /\.(png|jpg)$/, use: 'file-loader' },
    { test: /\.svg$/, use: 'url-loader' },
    { test: /\.txt$/, use: 'raw-loader' },
  ]
}

// ✅ Webpack 5
module: {
  rules: [
    { test: /\.(png|jpg)$/, type: 'asset/resource' },
    { test: /\.svg$/, type: 'asset/inline' },
    { test: /\.txt$/, type: 'asset/source' },
    { test: /\.(png|jpg)$/, type: 'asset', parser: { dataUrlCondition: { maxSize: 8096 } } },
  ]
}
```

### Node Polyfills（不再自動提供）
```js
// ❌ Webpack 4: 自動 polyfill Buffer, process, path 等
// ✅ Webpack 5: 需要手動
resolve: {
  fallback: {
    "buffer": require.resolve("buffer/"),
    "process": require.resolve("process/browser"),
    "path": require.resolve("path-browserify"),
    // 不需要就設 false
    "fs": false,
    "crypto": false,
  }
},
plugins: [
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: 'process/browser',
  }),
]
```

### output.filename hash
```js
// ❌ Webpack 4
output: { filename: '[name].[hash].js' }

// ✅ Webpack 5 ([hash] deprecated → [contenthash])
output: { filename: '[name].[contenthash].js' }
```

### Module Federation（Webpack 5 新功能）
```js
// 微前端：多個 app 共享 dependencies
new ModuleFederationPlugin({
  name: 'app1',
  remotes: { app2: 'app2@http://localhost:3002/remoteEntry.js' },
  shared: ['react', 'react-dom'],
})
```

## 常見 Error → Fix

| Error | Cause | Fix |
|-------|-------|-----|
| `contentBase is not allowed` | dev-server v4 | 改 `static` |
| `Module not found: 'crypto'` | Node polyfill removed | 加 `resolve.fallback` |
| `[hash] is now [fullhash]` | hash deprecated | 改 `[contenthash]` |
| `Rule.loaders has been removed` | Webpack 5 syntax | `loaders` → `use` |
| `compilation.mainTemplate.hooks` | Plugin incompatible | 升級 plugin 或換替代 |

## Webpack 4→5 遷移步驟

1. `npm install webpack@5 webpack-cli@5 webpack-dev-server@4`
2. 刪除 file-loader, url-loader, raw-loader → 用 asset modules
3. 修 Node polyfills
4. `[hash]` → `[contenthash]`
5. 檢查所有 plugins 是否兼容 Webpack 5
6. 跑 build，逐個 error 修

---

## Rspack — Webpack 的 Rust 替代（Drop-in Replacement）

> Webpack 5 config 幾乎直接搬過去。5-10x 更快 build。

### 為什麼考慮 Rspack
| | Webpack 5 | Rspack |
|---|---|---|
| 語言 | JS | Rust (核心) + JS (plugins) |
| Cold build | 慢 (大項目 30s+) | 快 5-10x |
| HMR | 秒級 | 毫秒級 |
| Config 兼容 | — | **99% 兼容 Webpack 5** |
| Loader 兼容 | — | **完全兼容** |
| Plugin 兼容 | — | 大部分兼容 |
| 學習成本 | — | **幾乎零（同一套 config）** |

### Rspack 遷移步驟

```bash
# 1. 安裝
npm install -D @rspack/core @rspack/cli

# 2. 重命名 config（內容幾乎不用改）
cp webpack.config.js rspack.config.js

# 3. 修改 package.json scripts
# "build": "webpack" → "build": "rspack build"
# "dev": "webpack serve" → "dev": "rspack serve"
```

### Config 對照（幾乎一樣）
```js
// webpack.config.js → rspack.config.js
// 大部分 config 直接搬，只需改：

// ❌ Webpack plugin import
const webpack = require('webpack');
new webpack.DefinePlugin({ ... })

// ✅ Rspack plugin import
const rspack = require('@rspack/core');
new rspack.DefinePlugin({ ... })
```

### 主要差異
```js
// 1. 用 builtin:swc-loader 替代 babel-loader（更快）
module: {
  rules: [{
    test: /\.jsx?$/,
    // ❌ babel-loader（仍可用，但慢）
    // use: 'babel-loader',
    // ✅ rspack 內建（快 10x）
    loader: 'builtin:swc-loader',
    options: {
      jsc: { parser: { syntax: 'ecmascript', jsx: true } },
    },
  }]
}

// 2. CSS Modules 內建支持
module: {
  rules: [{
    test: /\.module\.css$/,
    type: 'css/module',    // 不需要 css-loader
  }]
}

// 3. 部分 webpack plugin 有 rspack 內建替代
// mini-css-extract-plugin → rspack.CssExtractRspackPlugin
// html-webpack-plugin → rspack.HtmlRspackPlugin
```

### 不兼容的（需要注意）
| Webpack Feature | Rspack Status |
|----------------|---------------|
| `compilation.mainTemplate` | ❌ 不支持（部分舊 plugin 用到） |
| Custom resolver plugins | 🟡 部分支持 |
| Webpack-specific plugin hooks | 🟡 逐步支持中 |
| `thread-loader` | ❌ 不需要（Rust 本身並行） |

### 遷移建議
```
Webpack 4 → Webpack 5 → Rspack
             ↑ 当前步骤       ↑ 下一步（成本极低）
```
**先完成 Webpack 4→5，再换 Rspack。因为 Rspack 兼容 Webpack 5，不兼容 4。**

---

## Vite — 完全不同的 Build Tool

> 不是 drop-in replacement。需要重写 config，但 DX 质变。

### 為什麼考慮 Vite
| | Webpack 5 / Rspack | Vite |
|---|---|---|
| Dev server | Bundle 全部再 serve | **ESM 原生，按需編譯** |
| Cold start | 秒級 (Rspack) / 十秒級 (Webpack) | **毫秒級 (~300ms)** |
| HMR | 秒級 | **即時** |
| Config | 複雜（loader, plugin 一堆） | **簡單（大部分內建）** |
| 生態 | 最大 | 快速增長，2026 主流 |
| Production build | Webpack/Rspack 自己 | **Rollup (或 Rolldown)** |

### Vite 遷移步驟

```bash
# 1. 安裝
npm install -D vite @vitejs/plugin-react

# 2. 建 vite.config.js（全新写，不是改 webpack config）
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',  // 替代 webpack devServer.proxy
    },
  },
  resolve: {
    alias: {
      '@': '/src',  // 替代 webpack resolve.alias
    },
  },
});
```

### Webpack → Vite 主要改動

| Webpack | Vite |
|---------|------|
| `webpack.config.js` | `vite.config.js`（全新格式） |
| `index.html` 在 `public/` | `index.html` 在**根目錄** |
| `require()` | 必須用 `import` (ESM only) |
| `process.env.X` | `import.meta.env.X` |
| `file-loader` / asset modules | 直接 `import img from './img.png'` |
| CSS Modules: `css-loader` | 內建：`*.module.css` 自動識別 |
| `devServer.proxy` | `server.proxy` |
| `resolve.alias` 用 path | `resolve.alias` 用 `/src` 格式 |

### 環境變量
```bash
# ❌ Webpack (process.env)
REACT_APP_API_URL=https://api.example.com

# ✅ Vite (import.meta.env)
VITE_API_URL=https://api.example.com
# 必須 VITE_ 前綴才會暴露到客戶端
```

### index.html 位置
```bash
# ❌ Webpack: public/index.html
# ✅ Vite: 項目根目錄/index.html
mv public/index.html ./index.html

# 並且加 script tag:
# <script type="module" src="/src/main.jsx"></script>
```

### JSX 文件擴展名
```
# Vite 比 Webpack 更嚴格
# 用了 JSX 语法的文件必须是 .jsx 或 .tsx
# .js 文件不可以包含 JSX
```

### 常見 Error → Fix

| Error | Cause | Fix |
|-------|-------|-----|
| `process is not defined` | Vite 没有 Node globals | `process.env.X` → `import.meta.env.X` |
| `require is not defined` | Vite = ESM only | 改用 `import` |
| `Failed to resolve import` | 擴展名問題 | 確保 JSX 文件用 `.jsx` |
| `[plugin:vite:import-analysis]` | CJS module | 加到 `optimizeDeps.include` |

### Vite 遷移建議
```
Webpack 4 → Webpack 5 → Rspack（低成本，即時性能提升）
                           或
Webpack 4 → Webpack 5 → Vite（高成本，但 DX 質變）
```

**推薦路線：**
1. **短期 (now):** Webpack 4 → 5（解決 breaking changes）
2. **中期 (穩定後):** Webpack 5 → Rspack（幾乎零成本，5-10x 提速）
3. **長期 (新項目):** 新項目直接用 Vite；舊項目評估遷移成本

**选择 Rspack 还是 Vite？**
- 舊項目 webpack config 複雜 → **Rspack**（改最少）
- 新項目 / config 簡單 → **Vite**（DX 最好）
- 需要 Module Federation → **Rspack**（Vite 支持較弱）
