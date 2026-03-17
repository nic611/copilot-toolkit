---
description: Check code compatibility across React/Node/Webpack versions
mode: agent
---

# Diagnose Compatibility

Scan selected code or file for version compatibility issues.

## Input
- ${selection} or file path
- Target versions (default: React 18, Node 25, Webpack 5)

## Compatibility Matrix

### React API Check
| API | React 16 | React 17 | React 18 | React 19 |
|-----|----------|----------|----------|----------|
| `ReactDOM.render` | ✅ | ✅ | ⚠️ deprecated | ❌ removed |
| `findDOMNode` | ✅ | ✅ | ⚠️ StrictMode | ❌ removed |
| `componentWillMount` | ✅ | ⚠️ UNSAFE_ | ⚠️ UNSAFE_ | ❌ removed |
| `string refs` | ✅ | ✅ | ⚠️ deprecated | ❌ removed |
| `legacy context` | ✅ | ✅ | ⚠️ deprecated | ❌ removed |
| `defaultProps` (FC) | ✅ | ✅ | ✅ | ❌ removed |
| `createFactory` | ✅ | ✅ | ⚠️ deprecated | ❌ removed |
| `forwardRef` | ✅ | ✅ | ✅ | ⚠️ unnecessary |

### Node API Check
| Pattern | Node 22 | Node 25 |
|---------|---------|---------|
| `require()` for ESM | ✅ workaround | ⚠️ stricter |
| `__dirname` in ESM | ❌ | ❌ use `import.meta` |
| `fs.promises` | ✅ | ✅ |
| `fetch` global | ✅ | ✅ |
| `node:test` | ✅ | ✅ improved |

### Webpack Check
| Config | Webpack 4 | Webpack 5 |
|--------|-----------|-----------|
| `contentBase` | ✅ | ❌ use `static` |
| `raw-loader` | ✅ | ❌ use asset/source |
| `file-loader` | ✅ | ❌ use asset/resource |
| `url-loader` | ✅ | ❌ use asset/inline |
| `node.Buffer` polyfill | ✅ auto | ❌ manual |

## Output

For each issue found:
```
⚠️ Line XX: `findDOMNode(this)`
   React 18: StrictMode warning | React 19: REMOVED
   Fix: Use `useRef()` instead
   [show code fix]
```

Summary table at end:
```
| Severity | Count | Blocks React 18? | Blocks React 19? |
```
