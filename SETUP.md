# Setup Guide

## Prerequisites

- VS Code with GitHub Copilot extension
- GitHub Copilot subscription (Pro, Business, or Enterprise)

## Installation

### Step 1: Clone this repository

```bash
git clone https://github.com/nic611/copilot-toolkit.git ~/copilot-toolkit
```

### Step 2: Copy files to your project

```bash
cd /path/to/your-project

# Create directories
mkdir -p .github/prompts
mkdir -p knowledge

# Copy Copilot instructions (auto-attached to all chat requests)
cp ~/copilot-toolkit/copilot-instructions.md .github/copilot-instructions.md

# Copy prompt files (invoked with /name in chat)
cp ~/copilot-toolkit/prompts/*.prompt.md .github/prompts/

# Copy knowledge base (reference cheatsheets)
cp ~/copilot-toolkit/knowledge/*.md knowledge/
```

### Step 3: Update project context

Edit `.github/copilot-instructions.md` — replace placeholder package names in the `Project Context` section with your actual package names:

```markdown
## Project Context
- 3 unmaintained core packages (@your/core, @your/form)
```

> **Note:** Do not commit real package names to public repositories. Add `.github/copilot-instructions.md` to `.gitignore` if needed, or keep the placeholders in the committed version and override locally.

### Step 4: Configure VS Code

Add the following to `.vscode/settings.json`:

```jsonc
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.promptFiles": true,
  "github.copilot.chat.agent.enabled": true
}
```

### Step 5: Install snippets (optional)

1. Open Command Palette: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows)
2. Select **Snippets: Configure Snippets**
3. Choose `javascriptreact` or `typescriptreact`
4. Paste the contents of `vscode/snippets-react.json`

Available snippets:

| Prefix | Output |
|--------|--------|
| `rfc` | React Function Component |
| `rfct` | React FC with TypeScript interface |
| `ust` | `useState` hook |
| `uef` | `useEffect` hook with cleanup |
| `urf` | `useRef` hook |
| `usl` | Redux `useSelector` |
| `udp` | Redux `useDispatch` |
| `rtlt` | React Testing Library test boilerplate |
| `cdb` | Debug `console.log` with emoji marker |

### Step 6: Verify

1. Open Copilot Chat in VS Code (`Ctrl+Shift+I`)
2. Type `/` — you should see your prompt files listed
3. Try `/quick-fix` and paste an error message
4. Copilot should respond using the prompt template

**Troubleshooting:**
- Prompt files not appearing → verify `.github/prompts/` directory exists
- Instructions not applied → check `settings.json` includes `useInstructionFiles: true`
- Restart VS Code after initial setup

---

## Updating

When the toolkit is updated:

```bash
cd ~/copilot-toolkit
git pull

# Copy updated files
cp knowledge/*.md /path/to/your-project/knowledge/
# Only re-copy prompts/instructions if changed
```

---

## File Mapping

| Source | Destination | Purpose |
|--------|-------------|---------|
| `copilot-instructions.md` | `.github/copilot-instructions.md` | Auto-attached context for all Copilot Chat requests |
| `prompts/*.prompt.md` | `.github/prompts/` | Reusable prompts invoked with `/name` |
| `knowledge/*.md` | `knowledge/` | Reference cheatsheets (add to `.gitignore`) |
| `vscode/settings-recommended.jsonc` | `.vscode/settings.json` | Copilot feature flags |
| `vscode/snippets-react.json` | VS Code user snippets | Code input shortcuts |
| `tools/audit-react16-api.sh` | Any location | React 16 deprecated API scanner |
| `tools/dep-doctor/` | Any location | Dependency scanner + auto-fixer |
| `tools/migration-cli/` | Any location | Step-by-step migration runner |
| `gpt-prompts/*.md` | Reference only | Two-part prompts for GPT code generation |

---

## Prompt Reference

### Daily Development

| Scenario | Command | When to use |
|----------|---------|-------------|
| Console error | `/quick-fix` | Fast fix, covers 90% of cases |
| Complex bug | `/debug` | Root cause analysis with execution trace |
| Unfamiliar code | `/explain` | Select code → get breakdown + improvement suggestions |
| File review | `/scan-file` | Full analysis: architecture, quality, migration readiness |
| Data flow | `/trace-flow` | Trace execution path across files |

### Code Quality

| Scenario | Command | When to use |
|----------|---------|-------------|
| Performance issue | `/optimize` | Categorized as Quick Win / Medium / Heavy |
| Messy code | `/refactor` | Extract, simplify, modernize |
| Pre-PR check | `/code-review` | Quality checklist before submitting |
| Write PR | `/pr-description` | Generate from git diff |
| New feature | `/tdd` | Write tests first, then implement |

### Migration

| Scenario | Command | When to use |
|----------|---------|-------------|
| Version check | `/diagnose-compat` | React/Node/Webpack compatibility matrix |
| Dependency audit | `/audit-deps` | Identify upgrade blockers |
| React migration | `/migrate-react` | File-by-file migration guide |
| Build failure | `/fix-build` | Diagnose and fix migration-related build errors |
| Standup | `/daily-standup` | Generate notes from git log |

---

## Model Selection Strategy

GPT-4.1 is unlimited; GPT-5.x consumes premium tokens.

| Use GPT-4.1 (unlimited) | Use GPT-5.x (premium) |
|--------------------------|------------------------|
| `/quick-fix`, `/debug` | `/trace-flow`, `/optimize` |
| `/explain`, `/scan-file` | `/migrate-react`, `/diagnose-compat` |
| `/daily-standup`, `/pr-description` | `/refactor`, `/audit-deps` |

**Principle:** Pattern-matching tasks → 4.1. Cross-file reasoning → 5.x.
