# Node 22 → 25 Migration Cheatsheet

## Key Changes

### ESM 更嚴格
```js
// Node 22: CJS require() 可以 load 部分 ESM
// Node 25: 更嚴格，需要明確區分

// package.json 控制模式
{ "type": "module" }     // 所有 .js = ESM
{ "type": "commonjs" }   // 所有 .js = CJS (default)

// 混用時
file.mjs  // 強制 ESM
file.cjs  // 強制 CJS
```

### __dirname / __filename in ESM
```js
// ❌ ESM 中不可用
console.log(__dirname);

// ✅ ESM 替代
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 或直接用 import.meta
import.meta.url       // file:///path/to/file.js
import.meta.dirname   // Node 21+ 直接可用
import.meta.filename  // Node 21+ 直接可用
```

### require() ESM
```js
// Node 22+: require() 可以同步 load ESM (實驗性)
// 但有限制：ESM 文件不能有 top-level await
const mod = require('./esm-module.mjs');
```

### Built-in Test Runner
```js
// Node 22+: 內建 test runner，可替代 Jest (簡單場景)
import { test, describe, it } from 'node:test';
import assert from 'node:assert';

describe('MyModule', () => {
  it('should work', () => {
    assert.strictEqual(1 + 1, 2);
  });
});

// 運行: node --test
```

### Permission Model
```bash
# Node 22+: 可限制文件/網絡訪問
node --experimental-permission --allow-fs-read=./data app.js
```

### fetch 原生
```js
// Node 22+: fetch 全局可用，不需要 node-fetch
const res = await fetch('https://api.example.com/data');
const data = await res.json();
```

## 常見 Error → Fix

| Error | Cause | Fix |
|-------|-------|-----|
| `ERR_REQUIRE_ESM` | require() 一個 ESM package | 改用 import() 或 dynamic import |
| `ReferenceError: __dirname` | ESM 中用了 CJS 變量 | 用 `import.meta.dirname` |
| `ERR_UNKNOWN_FILE_EXTENSION .ts` | Node 不原生支持 TS | 用 tsx 或 ts-node |
| `fetch is not defined` | Node < 18 | 升級或安裝 node-fetch |
| `Top-level await` | CJS 文件用了 await | 改成 .mjs 或加 "type": "module" |

## package.json 兼容策略
```jsonc
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",    // ESM
      "require": "./dist/index.cjs"     // CJS fallback
    }
  },
  "engines": {
    "node": ">=22"
  }
}
```
