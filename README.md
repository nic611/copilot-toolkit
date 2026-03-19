# Copilot Toolkit

Portable GitHub Copilot configuration for React migration workflows.

Copy to any project's `.github/` directory — works immediately with Copilot Chat, Agent mode, and prompt files.

## What's Inside

- **16 prompt files** — invoke with `/name` in Copilot Chat (`/quick-fix`, `/migrate-react`, `/tdd`, etc.)
- **8 knowledge cheatsheets** — React 16→19, Webpack 4→5, Enzyme→RTL, Node ESM, TypeScript
- **3 CLI tools** — dependency scanner, migration runner, React API auditor
- **3 GPT prompts** — two-part prompts for code generation with GPT-5.x/4.1
- **VS Code config** — Copilot settings + React/RTL code snippets

## Quick Start

```bash
git clone https://github.com/nic611/copilot-toolkit.git
cd copilot-toolkit

# Copy to your project
cp copilot-instructions.md /path/to/project/.github/copilot-instructions.md
cp prompts/*.prompt.md /path/to/project/.github/prompts/
```

See [SETUP.md](./SETUP.md) for full installation guide.

## Structure

```
├── copilot-instructions.md     Auto-attached context for all Copilot Chat
├── prompts/                    16 reusable prompt files (/name invocation)
├── knowledge/                  8 migration cheatsheets
├── tools/
│   ├── dep-doctor/             Dependency health scanner + auto-fixer
│   ├── migration-cli/          Step-by-step React/Node migration runner
│   └── audit-react16-api.sh    React 16 deprecated API scanner
├── gpt-prompts/                Two-part prompts for GPT code generation
└── vscode/                     Editor settings + code snippets
```

## Prompts

### Daily Development

| Command | Purpose |
|---------|---------|
| `/quick-fix` | Paste error → instant fix |
| `/debug` | Deep root cause analysis |
| `/explain` | Read and explain source code |
| `/scan-file` | Full file analysis (quality, migration readiness) |
| `/trace-flow` | Trace data/execution path across files |

### Code Quality

| Command | Purpose |
|---------|---------|
| `/optimize` | Performance audit → Quick Win / Medium / Heavy |
| `/refactor` | Modernize and simplify |
| `/code-review` | Pre-PR quality checklist |
| `/tdd` | Test-driven development with RTL |
| `/pr-description` | Generate PR from git diff |
| `/daily-standup` | Standup notes from git log |

### Migration

| Command | Purpose |
|---------|---------|
| `/diagnose-compat` | React/Node/Webpack compatibility matrix |
| `/audit-deps` | Dependency blocker scan |
| `/migrate-react` | React 16→18/19 file-by-file guide |
| `/fix-build` | Build error diagnosis |
| `/analyze-project` | Generate PROJECT-CONTEXT.md architecture doc |

## Tools

| Tool | What it does |
|------|-------------|
| [dep-doctor](./tools/dep-doctor/) | Scan + fix dependencies: outdated, vulnerable, peerDep conflicts |
| [migration-cli](./tools/migration-cli/) | 5-phase migration: audit → pnpm → React 18 → Node 24 → React 19 |
| [audit-react16-api.sh](./tools/audit-react16-api.sh) | grep-based React 16 deprecated API scanner |

## Knowledge Base

| File | Content |
|------|---------|
| `react-migration.md` | React 16 → 18 → 19 API changes with side-by-side examples |
| `webpack-migration.md` | Webpack 4 → 5 breaking changes |
| `build-tool-configs.md` | Same project in Webpack 5 vs Rspack vs Vite |
| `node-migration.md` | Node 22 → 25 CJS/ESM migration |
| `testing-migration.md` | Enzyme → RTL → Vitest (same test, three ways) |
| `ts-quickref.md` | TypeScript for JS developers |
| `dependency-patterns.md` | Dependency diagnosis + pnpm overrides |
| `daily-patterns.md` | Common React/Git/Debug patterns |

## GPT Model Strategy

| Use GPT-4.1 (unlimited) | Use GPT-5.x (premium) |
|--------------------------|------------------------|
| `/quick-fix`, `/debug`, `/explain` | `/trace-flow`, `/optimize`, `/migrate-react` |
| `/scan-file`, `/daily-standup`, `/pr-description` | `/diagnose-compat`, `/refactor`, `/audit-deps` |

Pattern-matching tasks → 4.1. Cross-file reasoning → 5.x.

## License

MIT
