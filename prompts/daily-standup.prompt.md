---
description: Generate daily standup summary from recent git activity
mode: agent
---

# Daily Standup

Generate standup notes from yesterday's work.

## Steps

1. Run `git log --oneline --since="1 day ago" --author=$(git config user.name)`
2. Run `git diff --stat HEAD~5` (recent changes overview)
3. Check for any uncommitted work: `git status`

## Output

```markdown
## Yesterday
- [completed items from git log, grouped by feature/fix]

## Today
- [inferred from uncommitted changes and recent branch]
- [any ongoing migration work]

## Blockers
- [any failing tests, build errors, or dependency issues]
```

## Rules
- Keep it short — standup format, not essay
- Group related commits
- If there are dependency/migration blockers, highlight them
- 唔好寫 "I worked on..." — 直接寫做咗咩
