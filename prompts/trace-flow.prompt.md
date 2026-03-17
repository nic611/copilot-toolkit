---
description: Trace data flow or execution path through the codebase
mode: agent
---

# Trace Flow

Trace how data or execution flows through the codebase.

## Input
- Starting point: a function call, API endpoint, user action, or state change
- Question: "Where does X come from?", "What happens when user clicks Y?", "How does Z propagate?"

## Trace Method

### Step 1: Find Entry Point
- Locate the starting function/component/handler
- Read the source code

### Step 2: Follow the Chain
For each step in the flow:
```
[File:Line] FunctionName
  → calls [File:Line] NextFunction
  → reads from [state/props/context/API]
  → writes to [state/store/DOM/API]
```

### Step 3: Draw the Flow
```
User Action → EventHandler → StateUpdate → Re-render → API Call → Response → StateUpdate → UI
```

### Step 4: Identify
- **Side effects**: API calls, localStorage, DOM manipulation
- **Branching**: Where does the flow split based on conditions?
- **Error paths**: What happens when something fails?
- **Performance hotspots**: N+1 queries, unnecessary re-renders

## Output
1. Flow diagram (text-based)
2. Key files involved (with line numbers)
3. Any issues or risks found during trace
4. Suggestions if the flow is overly complex
