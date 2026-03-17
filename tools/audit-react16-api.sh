#!/bin/zsh
# ============================================
# React 16 Deprecated API Audit Script
# 用法: ./audit-react16-api.sh /path/to/project
#
# 扫描目标:
#   1. React 16 专属 API (React 18 warning, React 19 移除)
#   2. 统计每个 API 出现次数 + 文件列表
#   3. 输出 markdown 格式报告（可直接贴 RFC）
#
# 注意: 只扫 .js/.jsx/.ts/.tsx 文件，排除 node_modules/dist/build
# ============================================

set -uo pipefail

TARGET="${1:-.}"
REPORT_FILE="${2:-react16-audit-report.md}"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔍 React 16 Deprecated API Audit${NC}"
echo -e "   Target: ${TARGET}"
echo -e "   Report: ${REPORT_FILE}"
echo ""

# Check rg exists
if ! command -v rg &> /dev/null; then
  echo -e "${RED}Error: ripgrep (rg) not found. Install: brew install ripgrep${NC}"
  exit 1
fi

# Common exclude patterns
EXCLUDE="--glob=!node_modules --glob=!dist --glob=!build --glob=!coverage --glob=!.next --glob=!*.min.js --glob=!*.bundle.js --glob=!vendor"
INCLUDE="--glob=*.{js,jsx,ts,tsx}"

# ============================================
# Define patterns to scan
# Format: "PATTERN|DESCRIPTION|SEVERITY|REACT18_BEHAVIOR|REACT19_BEHAVIOR"
# ============================================
PATTERNS=(
  # --- React 19 REMOVED APIs ---
  'findDOMNode|ReactDOM.findDOMNode()|CRITICAL|StrictMode warning|REMOVED'
  'componentWillMount[^a-zA-Z]|componentWillMount lifecycle|CRITICAL|Warning (needs UNSAFE_)|REMOVED'
  'componentWillReceiveProps[^a-zA-Z]|componentWillReceiveProps lifecycle|CRITICAL|Warning (needs UNSAFE_)|REMOVED'
  'componentWillUpdate[^a-zA-Z]|componentWillUpdate lifecycle|CRITICAL|Warning (needs UNSAFE_)|REMOVED'
  'UNSAFE_componentWillMount|UNSAFE_componentWillMount|HIGH|Works but deprecated|REMOVED'
  'UNSAFE_componentWillReceiveProps|UNSAFE_componentWillReceiveProps|HIGH|Works but deprecated|REMOVED'
  'UNSAFE_componentWillUpdate|UNSAFE_componentWillUpdate|HIGH|Works but deprecated|REMOVED'
  'this\.refs\.[a-zA-Z]|String refs (this.refs.x)|CRITICAL|Deprecated|REMOVED'
  'ref="[^"]+"|String ref assignment|CRITICAL|Deprecated|REMOVED'
  'getChildContext|Legacy Context (getChildContext)|CRITICAL|Deprecated|REMOVED'
  'childContextTypes|Legacy Context (childContextTypes)|CRITICAL|Deprecated|REMOVED'
  'contextTypes\s*=|Legacy Context (contextTypes consumer)|CRITICAL|Deprecated|REMOVED'
  'React\.createFactory|React.createFactory()|CRITICAL|Deprecated|REMOVED'
  'ReactDOM\.render[^e]|ReactDOM.render() (not createRoot)|HIGH|Works but deprecated|REMOVED'
  'ReactDOM\.hydrate[^R]|ReactDOM.hydrate() (not hydrateRoot)|HIGH|Works but deprecated|REMOVED'
  'ReactDOM\.unmountComponentAtNode|ReactDOM.unmountComponentAtNode()|HIGH|Works but deprecated|REMOVED'
  'React\.createElement\s*\(\s*["\x27]|React.createElement with string (check createFactory usage)|LOW|Works|Works'

  # --- Patterns that indicate React 16 era code ---
  'defaultProps\s*=|defaultProps (removed for function components in React 19)|MEDIUM|Works|REMOVED for FC'
  'propTypes\s*=|PropTypes usage (consider TypeScript)|LOW|Works|Works but ecosystem moving away'

  # --- Test-related (Enzyme) ---
  'from\s+["\x27]enzyme["\x27]|Enzyme import|HIGH|Incompatible without adapter|No adapter available'
  'enzyme-adapter|Enzyme adapter|HIGH|Only community adapters|No support'
  'shallow\(|Enzyme shallow render|HIGH|Incompatible|No support'
  'mount\(|Enzyme mount (check if from enzyme)|MEDIUM|Check source|Check source'
)

# ============================================
# Run audit
# ============================================

total_hits=0
declare -A severity_counts
severity_counts[CRITICAL]=0
severity_counts[HIGH]=0
severity_counts[MEDIUM]=0
severity_counts[LOW]=0

# Start report
cat > "$REPORT_FILE" << 'HEADER'
# React 16 Deprecated API Audit Report

> Auto-generated. Use this data for migration planning / RFC.

## Summary

HEADER

# Temp file for detailed results
DETAIL_FILE=$(mktemp)

echo "| # | API | Severity | Files | Hits | React 18 | React 19 |" >> "$DETAIL_FILE"
echo "|---|-----|----------|-------|------|----------|----------|" >> "$DETAIL_FILE"

idx=0
for entry in "${PATTERNS[@]}"; do
  IFS='|' read -r pattern description severity react18 react19 <<< "$entry"

  # Count matches
  hit_count=$(rg -c "$pattern" $EXCLUDE $INCLUDE "$TARGET" 2>/dev/null | awk -F: '{sum += $NF} END {print sum+0}')
  file_count=$(rg -l "$pattern" $EXCLUDE $INCLUDE "$TARGET" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$hit_count" -gt 0 ]; then
    idx=$((idx + 1))
    total_hits=$((total_hits + hit_count))
    severity_counts[$severity]=$(( ${severity_counts[$severity]} + hit_count ))

    # Color output
    case $severity in
      CRITICAL) color=$RED ;;
      HIGH)     color=$YELLOW ;;
      MEDIUM)   color=$CYAN ;;
      *)        color=$NC ;;
    esac

    echo -e "${color}[$severity]${NC} ${description}: ${hit_count} hits in ${file_count} files"

    # Add to report
    echo "| $idx | $description | **$severity** | $file_count | $hit_count | $react18 | $react19 |" >> "$DETAIL_FILE"

    # List affected files (max 10)
    rg -l "$pattern" $EXCLUDE $INCLUDE "$TARGET" 2>/dev/null | head -10 | while read -r f; do
      echo "  → $f"
    done
    if [ "$file_count" -gt 10 ]; then
      echo "  → ... and $((file_count - 10)) more files"
    fi
    echo ""
  fi
done

# ============================================
# Write summary to report
# ============================================

cat >> "$REPORT_FILE" << EOF
| Severity | Count | Meaning |
|----------|-------|---------|
| **CRITICAL** | ${severity_counts[CRITICAL]} | React 19 will crash. Must fix before upgrade. |
| **HIGH** | ${severity_counts[HIGH]} | React 18 deprecated, React 19 removed. Fix soon. |
| **MEDIUM** | ${severity_counts[MEDIUM]} | Works but on deprecation path. Plan to fix. |
| **LOW** | ${severity_counts[LOW]} | Consider updating for best practices. |
| **TOTAL** | $total_hits | |

## Detailed Findings

EOF

cat "$DETAIL_FILE" >> "$REPORT_FILE"
rm "$DETAIL_FILE"

# ============================================
# Add affected files section
# ============================================

cat >> "$REPORT_FILE" << 'EOF'

## Most Affected Files

Top 20 files by number of deprecated API usages:

| File | Hits |
|------|------|
EOF

# Aggregate hits per file
rg_patterns=""
for entry in "${PATTERNS[@]}"; do
  IFS='|' read -r pattern description severity react18 react19 <<< "$entry"
  if [ -n "$rg_patterns" ]; then
    rg_patterns="$rg_patterns|$pattern"
  else
    rg_patterns="$pattern"
  fi
done

rg -c "($rg_patterns)" $EXCLUDE $INCLUDE "$TARGET" 2>/dev/null \
  | sort -t: -k2 -rn \
  | head -20 \
  | while IFS=: read -r filepath count; do
    echo "| \`$filepath\` | $count |" >> "$REPORT_FILE"
  done

# ============================================
# Add package dependency check
# ============================================

cat >> "$REPORT_FILE" << 'EOF'

## Package Dependency Chain Check

Packages with `react` in peerDependencies:

EOF

find "$TARGET" -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" | while read -r pkg; do
  # Check if has react peerDep
  if grep -q '"peerDependencies"' "$pkg" 2>/dev/null; then
    react_peer=$(python3 -c "
import json, sys
try:
    d = json.load(open('$pkg'))
    peers = d.get('peerDependencies', {})
    react_ver = peers.get('react', '')
    if react_ver:
        print(f'{react_ver}')
except: pass
" 2>/dev/null)
    if [ -n "$react_peer" ]; then
      echo "| \`$pkg\` | \`react: $react_peer\` |" >> "$REPORT_FILE"
    fi
  fi
done

# ============================================
# Recommendation
# ============================================

cat >> "$REPORT_FILE" << EOF

---

## Recommendation / 建议

### Migration Blocker Assessment

- **Total deprecated API usages**: $total_hits
- **CRITICAL (React 19 crash)**: ${severity_counts[CRITICAL]}
- **HIGH (React 18 deprecated)**: ${severity_counts[HIGH]}

### If CRITICAL > 0 in @legacy/* packages:
These packages CANNOT work with React 19 without code changes.
Since they are unmaintained, the **Adapter pattern** is recommended.
See: \`solutions/04-adapter/\` for implementation.

### Effort Estimate

| CRITICAL hits | Estimated adapter work |
|--------------|----------------------|
| 1-10 | 1-2 days |
| 10-30 | 3-5 days |
| 30-50 | 1-2 weeks |
| 50+ | Consider full replacement (Solution 3) |

---
*Generated by audit-react16-api.sh on $(date '+%Y-%m-%d %H:%M')*
EOF

# ============================================
# Final summary
# ============================================

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Audit Complete${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "  Total hits:  ${total_hits}"
echo -e "  ${RED}CRITICAL:  ${severity_counts[CRITICAL]}${NC}"
echo -e "  ${YELLOW}HIGH:      ${severity_counts[HIGH]}${NC}"
echo -e "  ${CYAN}MEDIUM:    ${severity_counts[MEDIUM]}${NC}"
echo -e "  LOW:       ${severity_counts[LOW]}"
echo ""
echo -e "  Report saved to: ${GREEN}${REPORT_FILE}${NC}"
echo ""

if [ "${severity_counts[CRITICAL]}" -gt 0 ]; then
  echo -e "${RED}⚠️  CRITICAL issues found. These WILL break on React 19.${NC}"
  echo -e "${RED}   Run on your @legacy/* source to assess adapter scope.${NC}"
fi
