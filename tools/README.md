# Tools

CLI tools for React migration and dependency management.

| Tool | Purpose | Dependencies |
|------|---------|-------------|
| [dep-doctor](./dep-doctor/) | Scan + auto-fix dependency health issues | None (Node.js built-ins) |
| [migration-cli](./migration-cli/) | Step-by-step React + Node.js migration runner | None (Node.js built-ins) |
| [audit-react16-api.sh](./audit-react16-api.sh) | Scan codebase for React 16 deprecated APIs | bash, grep |

## dep-doctor

Diagnoses outdated, vulnerable, and conflicting dependencies. Auto-fixes with rollback support.

```bash
dep-doctor scan                    # Full analysis
dep-doctor fix --dry-run           # Preview fixes
dep-doctor why react-router-dom    # Trace dependency chain
dep-doctor check --ci              # Pre-push validation
```

## migration-cli

Guided migration through 5 phases: audit → pnpm → React 18 → Node 24 → React 19.

```bash
node run-migration.js 1            # Audit
node run-migration.js 3 --dry-run  # Preview React 18 upgrade
```

## audit-react16-api.sh

Shell script that greps your codebase for deprecated React 16 APIs and outputs a markdown report.

```bash
./audit-react16-api.sh /path/to/project > report.md
```

Detects: `componentWillMount`, `componentWillReceiveProps`, `findDOMNode`, string refs, legacy context, `ReactDOM.render`, and more.
