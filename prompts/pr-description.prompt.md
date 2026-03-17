---
description: Generate PR description from staged changes or branch diff
mode: agent
---

# Generate PR Description

Create a clear PR description from the current changes.

## Steps

1. Run `git diff main...HEAD` (or staged changes)
2. Analyze all changed files
3. Generate:

```markdown
## Summary
[1-3 bullet points: what changed and why]

## Changes
- `file1.js`: [what changed]
- `file2.js`: [what changed]

## Migration Notes (if applicable)
- [ ] Any breaking changes?
- [ ] peerDependency changes?
- [ ] Config changes needed?

## Testing
- [ ] Unit tests pass
- [ ] Manual testing done for: [list scenarios]
- [ ] No deprecated API introduced

## Screenshots (if UI change)
[describe what to screenshot]
```

## Rules
- Keep summary under 3 bullets
- Flag any migration/breaking changes prominently
- If touching shared code: note which downstream projects might be affected
- 不要寫廢話 like "This PR makes some changes to..."
