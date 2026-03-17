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

---

## 完整對比：同一個 Module，CJS vs ESM

> 場景：一個 API service module，有 file path 操作、async fetch、export/import。

### CommonJS (CJS) — Node 22 傳統寫法

```js
// services/api.cjs
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';
const CONFIG_PATH = path.join(__dirname, '../config/api.json');

// 同步讀 config
function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

// Async fetch
async function fetchUser(id) {
  const config = loadConfig();
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    headers: { 'Authorization': `Bearer ${config.token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function updateUser(id, data) {
  const config = loadConfig();
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// CJS export
module.exports = { fetchUser, updateUser, loadConfig };

// CJS 用法
const { fetchUser } = require('./services/api.cjs');
```

### ESM — Node 25 現代寫法

```js
// services/api.mjs (或 .js + "type": "module")
import { readFileSync } from 'node:fs';           // ✅ node: 前綴（推薦）
import { join } from 'node:path';

// ✅ __dirname 替代
const __dirname = import.meta.dirname;              // Node 21+
const CONFIG_PATH = join(__dirname, '../config/api.json');

const BASE_URL = process.env.API_URL || 'http://localhost:8080';

function loadConfig() {
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

// ✅ Top-level await (ESM only)
// const config = await loadConfig();  // 可以在頂層 await

async function fetchUser(id) {
  const config = loadConfig();
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    headers: { 'Authorization': `Bearer ${config.token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function updateUser(id, data) {
  const config = loadConfig();
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ✅ ESM named export
export { fetchUser, updateUser, loadConfig };

// ESM 用法
import { fetchUser } from './services/api.mjs';
```

### 並排對比表

| 功能 | CJS (Node 22) | ESM (Node 25) |
|------|---------------|---------------|
| **Import** | `const x = require('x')` | `import x from 'x'` |
| **Named import** | `const { a } = require('x')` | `import { a } from 'x'` |
| **Export** | `module.exports = { a }` | `export { a }` |
| **Default export** | `module.exports = fn` | `export default fn` |
| **Dynamic import** | `require(variable)` | `await import(variable)` |
| **__dirname** | `__dirname`（全局） | `import.meta.dirname` |
| **__filename** | `__filename`（全局） | `import.meta.filename` |
| **JSON import** | `require('./data.json')` | `import data from './data.json' assert { type: 'json' }` |
| **Top-level await** | ❌ 不支持 | ✅ 支持 |
| **條件 import** | `if (x) require('y')` | `if (x) await import('y')` |
| **File extension** | 可省略 `.js` | **必須寫完整** |
| **node: prefix** | 可選 | 推薦（明確是 built-in） |

### CJS ↔ ESM 互操作

```js
// ESM 中用 CJS module
import cjsModule from './legacy.cjs';          // default import
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');          // ESM 中 require JSON

// CJS 中用 ESM module（Node 22+）
const esmModule = await import('./modern.mjs'); // 必須 dynamic import + await
```

### 測試對比：node:test vs Jest

```js
// ===== Jest (CJS 風格) =====
const { fetchUser } = require('./services/api');

describe('API Service', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('fetches user by id', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Nic' }),
    });
    const user = await fetchUser('1');
    expect(user.name).toBe('Nic');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.any(Object)
    );
  });
});

// ===== node:test (ESM 風格) =====
import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { fetchUser } from './services/api.mjs';

describe('API Service', () => {
  beforeEach(() => {
    global.fetch = mock.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'Nic' }),
      })
    );
  });

  it('fetches user by id', async () => {
    const user = await fetchUser('1');
    assert.strictEqual(user.name, 'Nic');
    assert.strictEqual(global.fetch.mock.calls.length, 1);
  });
});
// 運行: node --test
```
