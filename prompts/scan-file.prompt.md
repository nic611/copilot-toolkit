---
description: Full scan of a file — architecture, quality, risks, migration readiness
mode: agent
---

# Scan File

Deep analysis of a single file. Like a senior dev reviewing your code.

## Input
- File path or ${selection}

## Report

### 📋 Overview
- **Purpose**: What this file does (one line)
- **Type**: Component / Hook / Utility / Service / Config / Test
- **Size**: Lines of code, complexity assessment
- **Dependencies**: What it imports and why

### 🏗️ Architecture
- Is this the right abstraction level?
- Does it follow single responsibility?
- How does it fit in the broader codebase?

### ⚠️ Issues (ordered by severity)

| # | Severity | Issue | Line | Suggestion |
|---|----------|-------|------|------------|
| 1 | 🔴 Critical | ... | ... | ... |
| 2 | 🟡 Warning | ... | ... | ... |
| 3 | 🔵 Info | ... | ... | ... |

### 🔄 Migration Status
- React version compatibility: 16 ✅ / 18 ⚠️ / 19 ❌
- Deprecated APIs used: [list]
- Estimated migration effort: [hours]

### ✅ What's Good
- [Positive aspects — important for morale]

### 🎯 Recommended Actions
1. [Most impactful fix] — effort: X min
2. [Next priority] — effort: X min
3. [Nice to have] — effort: X min
