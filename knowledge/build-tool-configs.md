# Build Tool Config 對比
# 同一個 React 項目，三種配置

> 場景：一個典型 React 項目，有 JSX、CSS Modules、圖片、環境變量、proxy、alias。
> 三份 config 做同一件事，方便你對比。

---

## 項目結構（三者通用）

```
my-app/
├── public/
│   └── favicon.ico
├── src/
│   ├── index.jsx
│   ├── App.jsx
│   ├── App.module.css
│   ├── components/
│   │   └── Button/
│   │       ├── Button.jsx
│   │       └── Button.module.css
│   ├── assets/
│   │   └── logo.png
│   └── utils/
│       └── api.js
├── .env
├── package.json
└── [config file]          ← 這個不同
```

---

## 1. Webpack 5

```js
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: './src/index.jsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },

  module: {
    rules: [
      // JS/JSX — 需要 babel-loader + preset
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      // CSS Modules
      {
        test: /\.module\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { modules: true },
          },
        ],
      },
      // 普通 CSS
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      // 圖片
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 8 * 1024 },
        },
      },
      // 字體
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    // 環境變量
    new webpack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
    }),
  ],

  devServer: {
    static: './public',
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    ],
  },

  devtool: isDev ? 'eval-source-map' : 'source-map',
};
```

```json
// 需要安裝的 devDependencies
{
  "webpack": "^5",
  "webpack-cli": "^5",
  "webpack-dev-server": "^4",
  "babel-loader": "^9",
  "@babel/core": "^7",
  "@babel/preset-env": "^7",
  "@babel/preset-react": "^7",
  "css-loader": "^6",
  "style-loader": "^3",
  "mini-css-extract-plugin": "^2",
  "html-webpack-plugin": "^5"
}
```

---

## 2. Rspack（同一個項目）

```js
// rspack.config.js
const path = require('path');
const rspack = require('@rspack/core');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: './src/index.jsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },

  module: {
    rules: [
      // JS/JSX — 用內建 swc-loader 替代 babel（快 10x）
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',          // ← 唯一大區別
        options: {
          jsc: {
            parser: { syntax: 'ecmascript', jsx: true },
            transform: { react: { runtime: 'automatic' } },
          },
        },
      },
      // CSS Modules — 內建支持，不需要 css-loader
      {
        test: /\.module\.css$/,
        type: 'css/module',                     // ← 簡化了
      },
      // 普通 CSS — 也是內建
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css',                            // ← 簡化了
      },
      // 圖片 — 同 Webpack 5
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: { maxSize: 8 * 1024 },
        },
      },
      // 字體 — 同 Webpack 5
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    // 內建替代 html-webpack-plugin
    new rspack.HtmlRspackPlugin({               // ← 換了名
      template: './public/index.html',
    }),
    // 內建替代 mini-css-extract-plugin
    new rspack.CssExtractRspackPlugin({          // ← 換了名
      filename: '[name].[contenthash].css',
    }),
    // DefinePlugin 同 Webpack 一樣
    new rspack.DefinePlugin({
      'process.env.API_URL': JSON.stringify(process.env.API_URL),
    }),
  ],

  devServer: {
    static: './public',
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    ],
  },

  devtool: isDev ? 'eval-source-map' : 'source-map',
};
```

```json
// 需要安裝的 devDependencies — 少好多
{
  "@rspack/core": "^1",
  "@rspack/cli": "^1"
  // 就這些！不需要 babel, css-loader, style-loader, html-webpack-plugin 等
}
```

---

## 3. Vite（同一個項目）

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },

  // CSS Modules — 內建，零配置
  // 只要文件叫 *.module.css 就自動識別

  // 圖片 — 內建，直接 import
  // import logo from './assets/logo.png'

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

```html
<!-- index.html — 必須在根目錄（不是 public/） -->
<!DOCTYPE html>
<html>
<head><title>My App</title></head>
<body>
  <div id="root"></div>
  <!-- Vite 特有：直接引入 JSX -->
  <script type="module" src="/src/index.jsx"></script>
</body>
</html>
```

```bash
# .env — 前綴不同
# Webpack/Rspack: 自己 DefinePlugin 控制
# Vite: 必須 VITE_ 前綴
VITE_API_URL=http://localhost:8080
```

```jsx
// src/utils/api.js — 環境變量用法不同
// Webpack / Rspack
const API_URL = process.env.API_URL;

// Vite
const API_URL = import.meta.env.VITE_API_URL;
```

```json
// 需要安裝的 devDependencies — 最少
{
  "vite": "^6",
  "@vitejs/plugin-react": "^4"
  // 就這些！CSS, 圖片, HMR 全部內建
}
```

---

## 並排對比總表

### Config 複雜度

| 功能 | Webpack 5 | Rspack | Vite |
|------|-----------|--------|------|
| **JSX 編譯** | babel-loader + preset | `builtin:swc-loader` | 內建 (plugin-react) |
| **CSS Modules** | css-loader + options | `type: 'css/module'` | **零配置** (*.module.css) |
| **CSS Extract** | mini-css-extract-plugin | `CssExtractRspackPlugin` | **內建** |
| **圖片** | `type: 'asset'` | `type: 'asset'` | **直接 import** |
| **HTML** | html-webpack-plugin | `HtmlRspackPlugin` | **根目錄 index.html** |
| **HMR** | webpack-dev-server | webpack-dev-server | **內建** |
| **環境變量** | DefinePlugin | DefinePlugin | `import.meta.env` |
| **Config 行數** | ~80 行 | ~70 行 | **~25 行** |
| **devDeps 數量** | ~10 個 | **2 個** | **2 個** |

### 性能對比

| 指標 | Webpack 5 | Rspack | Vite |
|------|-----------|--------|------|
| **Cold start (dev)** | 10-30s | 1-3s | **<1s** |
| **HMR** | 1-3s | 0.1-0.5s | **<0.1s** |
| **Production build** | 30-60s | 3-10s | 5-15s |
| **Bundle size** | 基準 | 相同 | 相同或更小 |

### 遷移成本

| 從 Webpack 5 遷移到 | 改動量 | 時間 | 風險 |
|---------------------|--------|------|------|
| **Rspack** | 改 plugin imports + loader | **半天** | **低** |
| **Vite** | 重寫 config + 改 env vars + 移 index.html + 確保 ESM | **2-5 天** | **中** |

---

## package.json scripts 對比

```jsonc
{
  "scripts": {
    // Webpack 5
    "dev:webpack": "webpack serve --mode development",
    "build:webpack": "webpack --mode production",

    // Rspack
    "dev:rspack": "rspack serve",
    "build:rspack": "rspack build",

    // Vite
    "dev:vite": "vite",
    "build:vite": "vite build",
    "preview:vite": "vite preview"    // Vite 獨有：preview production build
  }
}
```

---

## TypeScript 配置對比

### Webpack 5 + TS
```js
// 額外需要 ts-loader 或 babel + @babel/preset-typescript
{
  test: /\.tsx?$/,
  use: 'ts-loader',          // 或 babel-loader + preset
  exclude: /node_modules/,
}
```

### Rspack + TS
```js
// builtin:swc-loader 直接支持
{
  test: /\.tsx?$/,
  loader: 'builtin:swc-loader',
  options: {
    jsc: {
      parser: { syntax: 'typescript', tsx: true },
      transform: { react: { runtime: 'automatic' } },
    },
  },
}
```

### Vite + TS
```js
// 零配置！直接寫 .ts/.tsx 就得
// 只需 tsconfig.json 存在
// vite.config.js 不需要改任何内容
```

---

## Proxy 配置對比

```js
// Webpack 5 / Rspack (同一寫法)
devServer: {
  proxy: [{
    context: ['/api', '/auth'],
    target: 'http://localhost:8080',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  }],
}

// Vite
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),  // 函數式，更靈活
    },
    '/auth': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

---

## Alias 配置對比

```js
// Webpack 5 / Rspack (同一寫法)
const path = require('path');
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
}

// Vite
import path from 'path';
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    // 或簡寫
    '@': '/src',
  },
}

// ⚠️ 如果用 TS，三者都需要在 tsconfig.json 加：
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 建议（当前情况）

```
当前：Webpack 4 + React 16 + Enzyme + Node 22
         │
         ▼ (Phase 1: 穩定)
Step 1:  Webpack 4 → 5          ← 解決 breaking changes
Step 2:  React 16 → 18          ← 解決依賴地獄
Step 3:  Enzyme → RTL           ← 測試現代化
         │
         ▼ (Phase 2: 提速)
Step 4:  Webpack 5 → Rspack     ← 半天完成，build 快 5-10x
Step 5:  Node 22 → 25           ← ESM 更穩定
         │
         ▼ (Phase 3: 長期，新項目先)
Step 6:  Rspack → Vite          ← 新項目用；舊項目 Rspack 夠用
Step 7:  Jest → Vitest          ← 跟 Vite 一起換
```

**Phase 1 做完就已经解决 80% 痛点。Phase 2 是 bonus。Phase 3 不急。**
