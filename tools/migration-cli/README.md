# migration-cli

Interactive migration runner for React + Node.js project upgrades.

Walks you through each phase of a legacy migration with dry-run support and safety checks.

## Why

Enterprise React migrations involve multiple sequential steps that must happen in order. This CLI codifies the steps, adds dry-run previews, and handles the tedious parts (lockfile conversion, codemod execution, config updates).

## Phases

| Phase | Name | What it does |
|-------|------|-------------|
| 1 | Dependency Audit | Analyze React version, find incompatible/deprecated packages, run `npm outdated` |
| 2 | npm → pnpm | Convert lockfile, update `packageManager` field, create `.npmrc` |
| 3 | React 16 → 18 | Upgrade packages, update types, run `createRoot` codemod |
| 4 | Node 22 → 24 | Update `.nvmrc`, set `engines` field |
| 5 | React 18 → 19 | Upgrade to React 19 (with confirmation prompt) |

## Quick Start

```bash
# Audit your project first
node migration-cli/run-migration.js 1

# Preview pnpm migration without changes
node migration-cli/run-migration.js 2 --dry-run

# Run React 18 upgrade on a specific project
node migration-cli/run-migration.js 3 --path ../my-app
```

## Files

```
migration-cli/
├── migrate-cli.js          Standalone analyzer — React/Node/deps analysis with colored report
├── run-migration.js        Interactive runner — execute phases sequentially with dry-run
└── codemods/
    └── react-18-codemod.js AST transform: ReactDOM.render → createRoot
```

### migrate-cli.js

Analysis tool that generates a migration readiness report.

```bash
node migrate-cli.js analyze              # Full report
node migrate-cli.js check-react          # React status (JSON)
node migrate-cli.js check-node           # Node.js config (JSON)
node migrate-cli.js analyze --path ../app
```

### run-migration.js

Step-by-step runner that executes each phase.

```bash
node run-migration.js          # Show phase menu
node run-migration.js 1        # Run phase 1
node run-migration.js 3 --dry-run --path ../app
```

## Options

```
--path <dir>   Project directory (default: cwd)
--dry-run      Preview steps without executing
--help         Show usage
```

## Requirements

- Node.js 18+
- pnpm (for phase 2, will prompt if missing)
- No additional dependencies — uses Node.js built-ins only

## License

MIT
