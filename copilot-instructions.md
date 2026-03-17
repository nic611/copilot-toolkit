# Project Instructions

> Copy this file to `.github/copilot-instructions.md` in your work repo.
> Designed to work with both GPT-5.x (premium) and GPT-4.1 (fallback).

## About Me
- 5+ years React experience, currently migrating legacy projects
- Languages: English, 粵語, 中文 — technical terms stay in English
- Prefer direct answers with action items, not explanations

## Project Context
- React 16 codebase migrating to React 18/19
- Webpack 4 → 5 migration in progress
- Node 22 → 25 planned
- 3 unmaintained core packages (@xx/core, @xx/form) blocking upgrades
- Company UI library depends on these packages
- 20+ downstream projects affected

## Coding Style
- Max 200 lines per component, 50 lines per function
- PascalCase components, camelCase functions, UPPER_SNAKE constants
- No console.log in production
- No inline styles, no magic numbers
- Import order: React → external → internal → relative → styles

## When I Ask About Migration
1. Always check which React version the code targets
2. Flag deprecated APIs: findDOMNode, componentWillMount, string refs, legacy context
3. Suggest React 18/19 equivalent with code example
4. Warn about peerDependency conflicts

## When I Ask About Dependencies
1. Check if package is maintained (last publish date)
2. Check peerDependencies for React version lock
3. Suggest alternatives if unmaintained
4. Consider adapter pattern before full replacement

## TypeScript
- I'm learning TS from JS background — explain types in JS terms
- For new files: use .ts with basic type annotations
- Don't over-type: `unknown` > `any`, but simple types > complex generics
- Show the JS equivalent when introducing TS concepts

## Testing
- Use React Testing Library (not Enzyme) for new tests
- Test behavior not implementation
- Coverage target: 85%+
- Mock external APIs, not internal modules

## Review Checklist (apply to all suggestions)
- [ ] No deprecated React APIs
- [ ] No security vulnerabilities (XSS, injection)
- [ ] No hardcoded secrets
- [ ] Works with React 16 AND 18 (transition period)
- [ ] peerDependencies compatible

## Response Style
- Direct, no filler — lead with the answer
- Code examples > text explanations
- Flag risks explicitly: "⚠️ This will break if..."
- 中英混合 OK for comments

## Available Prompts
Use `/name` in chat to invoke. See `.github/prompts/` for details.
- `/quick-fix` — paste error, get instant fix
- `/debug` — deep error diagnosis
- `/explain` — read & explain source code
- `/scan-file` — full file analysis
- `/trace-flow` — trace data/execution path
- `/optimize` — performance audit
- `/refactor` — modernize & simplify
- `/diagnose-compat` — version compatibility check
- `/audit-deps` — dependency blocker scan
- `/migrate-react` — React 16→18/19 guide
- `/fix-build` — build error resolution
- `/tdd` — test-driven development
- `/code-review` — pre-PR quality check
- `/pr-description` — generate PR description
- `/daily-standup` — standup notes from git
