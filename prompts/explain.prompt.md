---
description: Read and explain source code — what it does, why, and how to improve it
mode: agent
---

# Explain This Code

Read the selected code (or file) and give me a clear breakdown.

## Input
- ${selection} or file path

## Output Structure

### 1. What It Does (一句話)
One sentence: what is this code's job?

### 2. How It Works (流程)
Step-by-step walkthrough in execution order.
Use numbered list. Keep each step to one line.

### 3. Key Dependencies
- What external packages/modules does it use?
- What internal modules does it depend on?
- Any implicit assumptions (global state, env vars, specific React version)?

### 4. Potential Issues
- ⚠️ Deprecated APIs (React 16 patterns, old Node APIs)
- ⚠️ Performance concerns (unnecessary re-renders, O(n²) loops)
- ⚠️ Error handling gaps
- ⚠️ Security risks

### 5. If I Were to Improve This
- What would you change? (max 3 suggestions)
- Show code example for the most impactful change

## Rules
- Assume I know JS/React basics — don't explain `useState`
- DO explain non-obvious patterns, magic numbers, or clever tricks
- If it's a class component: note what the hooks equivalent would be
- 中英混合 OK
