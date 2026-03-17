---
description: Refactor code — extract, simplify, modernize patterns
mode: agent
---

# Refactor This

Analyze and refactor the selected code for clarity and maintainability.

## Input
- ${selection} or file path
- Optional: specific goal ("extract hook", "split component", "remove class")

## Analysis

### Size Check
- Component > 200 lines? → Must split
- Function > 50 lines? → Must extract
- File has multiple components? → Separate files

### Pattern Modernization
- Class component → Function component + hooks
- `connect()` HOC → `useSelector` + `useDispatch`
- Render props → Custom hook
- Nested ternaries → Early return or extracted component
- Callback chains → async/await
- `var` → `const`/`let`
- String concatenation → Template literals

### Code Smells
- Duplicated logic → Extract to shared function/hook
- Prop drilling > 3 levels → Context or state management
- God component (does everything) → Split by responsibility
- Feature envy (uses another component's state too much) → Move logic

## Output
1. List what to refactor and why (max 5 items)
2. Show refactored code
3. Confirm: no behavior change (same inputs → same outputs)
4. Suggest tests to verify the refactor
