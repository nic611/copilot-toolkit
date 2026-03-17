# Copilot Toolkit

Portable GitHub Copilot configuration for React migration and daily development workflow in VS Code.

## Contents

### Copilot Instructions
- `copilot-instructions.md` → `.github/copilot-instructions.md`
- Automatically attached to all Copilot Chat requests
- Compatible with GPT-5.x and GPT-4.1 fallback

### Prompt Files (15)
Copy `prompts/` to `.github/prompts/`. Invoke with `/name` in Copilot Chat.

| Command | Purpose |
|---------|---------|
| `/quick-fix` | Paste error → get instant fix |
| `/debug` | Deep error diagnosis with root cause analysis |
| `/explain` | Read and explain source code |
| `/scan-file` | Full file analysis (architecture, quality, migration readiness) |
| `/trace-flow` | Trace data/execution path through codebase |
| `/optimize` | Performance audit with prioritized fixes |
| `/refactor` | Modernize and simplify code |
| `/diagnose-compat` | React/Node/Webpack version compatibility check |
| `/audit-deps` | Dependency blocker scan for upgrades |
| `/migrate-react` | React 16→18/19 file-by-file migration guide |
| `/fix-build` | Build error diagnosis and resolution |
| `/tdd` | Test-driven development with RTL |
| `/code-review` | Pre-PR quality checklist |
| `/pr-description` | Generate PR description from git diff |
| `/daily-standup` | Generate standup notes from git log |

### Knowledge Base (8 cheatsheets)
| File | Content |
|------|---------|
| `react-migration.md` | React 16→18→19 API migration with side-by-side component comparison |
| `webpack-migration.md` | Webpack 4→5 breaking changes and fixes |
| `build-tool-configs.md` | Webpack 5 vs Rspack vs Vite — same project, three configs |
| `node-migration.md` | Node 22→25 CJS/ESM migration with side-by-side module comparison |
| `ts-quickref.md` | TypeScript for JS developers with JS vs TS component comparison |
| `testing-migration.md` | Enzyme→RTL→Vitest with same test written three ways |
| `dependency-patterns.md` | Dependency conflict diagnosis and resolution patterns |
| `daily-patterns.md` | Common React/Git/Debug patterns for daily development |

### VS Code Config
- `vscode/settings-recommended.jsonc` — Copilot and editor settings
- `vscode/snippets-react.json` — React/TypeScript/RTL code snippets

### Tools
- `tools/audit-react16-api.sh` — Scan codebase for React 16 deprecated APIs, output markdown report

## Quick Start

See [SETUP.md](./SETUP.md) for detailed installation instructions.

```bash
# In your project root
mkdir -p .github/prompts
cp copilot-instructions.md .github/copilot-instructions.md
cp prompts/*.prompt.md .github/prompts/
```

## License
MIT
