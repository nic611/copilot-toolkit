# GPT Prompts

Two-part prompts designed for GPT (via Copilot Chat or web). Each prompt follows a **confirm-then-generate** pattern to improve output quality.

## How to Use

1. Send **Part 1** — GPT summarizes its understanding and proposes a file list
2. Review and confirm
3. Send **Part 2** — GPT generates the complete code

This two-step flow prevents GPT from rushing into code before understanding the requirements.

## Prompts

| File | Tool | What it generates |
|------|------|------------------|
| [01-dep-doctor.md](./01-dep-doctor.md) | dep-doctor v1 | Dependency scanner CLI with chalk, ora, cli-table3 |
| [02-migration-cli.md](./02-migration-cli.md) | migration-doctor | Dual-mode migration CLI (IE11 vs Modern) with progress tracking |
| [03-bdd-upgrade.md](./03-bdd-upgrade.md) | BDD framework | Jest + Cucumber + RTL test infrastructure (10% → 85% coverage) |

## Context File

[gpt-context.md](./gpt-context.md) — Paste this into the first message of any GPT conversation to set project context (migration state, tech stack, pain points, response style).

## Prompt vs Tool Relationship

```
GPT Prompt (spec)          Tool (implementation)
─────────────────          ────────────────────
01-dep-doctor.md    ──→    tools/dep-doctor/ (v1 spec, v2 is a rewrite)
02-migration-cli.md ──→    tools/migration-cli/ (partial overlap)
03-bdd-upgrade.md   ──→    (standalone — generates test infra)
```

> **Note:** dep-doctor v2 (in `tools/`) is a ground-up rewrite with zero dependencies. The v1 GPT prompt still works for generating a simpler chalk-based scanner.

## Tips

- GPT-4.1 tends to truncate long files — ask "output the complete file" if cut short
- If dual-language comments are missing, prompt: "ensure every function has bilingual JSDoc"
- These prompts work with both GPT-5.x and GPT-4.1
