# Webpack 4 → 5 Migration Cheatsheet

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

## 遷移步驟

1. `npm install webpack@5 webpack-cli@5 webpack-dev-server@4`
2. 刪除 file-loader, url-loader, raw-loader → 用 asset modules
3. 修 Node polyfills
4. `[hash]` → `[contenthash]`
5. 檢查所有 plugins 是否兼容 Webpack 5
6. 跑 build，逐個 error 修
