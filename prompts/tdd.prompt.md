---
description: Write tests first (TDD) for a component using React Testing Library
mode: agent
---

# TDD: Write Tests First

Write failing tests first, then implement to make them pass.

## Input
- Component name or feature description
- Expected behavior

## Test Structure

```javascript
describe('ComponentName', () => {
  describe('default state', () => {
    // What renders by default
  });
  describe('props handling', () => {
    // How props affect rendering
  });
  describe('user interactions', () => {
    // Click, type, submit behaviors
  });
  describe('edge cases', () => {
    // Empty data, errors, loading states
  });
});
```

## Rules
- Use `@testing-library/react` (NOT Enzyme)
- Test behavior, not implementation details
- Use `screen.getByRole`, `getByText`, `getByLabelText` (accessible queries first)
- Use `userEvent` over `fireEvent`
- Use `waitFor` instead of hardcoded `setTimeout`
- Mock external APIs with `jest.fn()` or `msw`
- Reset mocks in `beforeEach`

## Output
1. Write the test file first (RED phase)
2. Show minimal implementation to pass (GREEN phase)
3. Suggest refactoring opportunities (REFACTOR phase)
4. Report expected coverage
