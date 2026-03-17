# Copilot Toolkit

Portable VS Code + GitHub Copilot toolkit for React migration and daily development workflow.

## What's Inside

### Copilot Instructions
- `copilot-instructions.md` → Copy to `.github/copilot-instructions.md`
- Auto-attached to all Copilot Chat requests
- Compatible with GPT-5.x and GPT-4.1 fallback

### Prompt Files (15)
Copy `prompts/` to `.github/prompts/`. Use `/name` in Copilot Chat.

| Command | Purpose |
|---------|---------|
| `/quick-fix` | Paste error → get instant fix |
| `/debug` | Deep error diagnosis |
| `/explain` | Read & explain source code |
| `/scan-file` | Full file analysis (like senior dev review) |
| `/trace-flow` | Trace data/execution path |
| `/optimize` | Performance audit |
| `/refactor` | Modernize & simplify code |
| `/diagnose-compat` | React/Node/Webpack version compatibility check |
| `/audit-deps` | Dependency blocker scan |
| `/migrate-react` | React 16→18/19 migration guide |
| `/fix-build` | Build error resolution |
| `/tdd` | Test-driven development |
| `/code-review` | Pre-PR quality check |
| `/pr-description` | Generate PR description |
| `/daily-standup` | Standup notes from git |

### Knowledge Base (6 cheatsheets)
| File | Content |
|------|---------|
| `react-migration.md` | React 16→18→19 every deprecated API with before/after code |
| `webpack-migration.md` | Webpack 4→5 breaking changes + fixes |
| `node-migration.md` | Node 22→25 ESM/CJS changes |
| `ts-quickref.md` | TypeScript for experienced JS developers |
| `dependency-patterns.md` | Dependency hell diagnosis & solutions |
| `daily-patterns.md` | Daily React/Git/Debug patterns |

### VS Code Config
- `vscode/settings-recommended.jsonc` — Copilot + editor settings
- `vscode/snippets-react.json` — React/TS/RTL snippets

### Tools
- `tools/audit-react16-api.sh` — Scan codebase for React 16 deprecated APIs, output markdown report

## Quick Setup

```bash
# In your project root
mkdir -p .github/prompts
cp copilot-instructions.md .github/copilot-instructions.md
cp prompts/*.prompt.md .github/prompts/
```

See `SETUP.md` for full setup guide.

## License
MIT
