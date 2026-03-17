import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PATTERNS = [
  { pattern: /ReactDOM\.findDOMNode/g, api: 'ReactDOM.findDOMNode()', severity: 'CRITICAL' },
  { pattern: /componentWillMount\b(?!.*UNSAFE)/g, api: 'componentWillMount', severity: 'CRITICAL' },
  { pattern: /componentWillReceiveProps\b(?!.*UNSAFE)/g, api: 'componentWillReceiveProps', severity: 'CRITICAL' },
  { pattern: /componentWillUpdate\b(?!.*UNSAFE)/g, api: 'componentWillUpdate', severity: 'CRITICAL' },
  { pattern: /UNSAFE_componentWillMount/g, api: 'UNSAFE_componentWillMount', severity: 'HIGH' },
  { pattern: /UNSAFE_componentWillReceiveProps/g, api: 'UNSAFE_componentWillReceiveProps', severity: 'HIGH' },
  { pattern: /UNSAFE_componentWillUpdate/g, api: 'UNSAFE_componentWillUpdate', severity: 'HIGH' },
  { pattern: /this\.refs\.\w+/g, api: 'String refs (this.refs)', severity: 'CRITICAL' },
  { pattern: /ref="[^"]+"/g, api: 'String ref assignment', severity: 'CRITICAL' },
  { pattern: /getChildContext\b/g, api: 'Legacy Context (getChildContext)', severity: 'CRITICAL' },
  { pattern: /childContextTypes/g, api: 'Legacy Context (childContextTypes)', severity: 'CRITICAL' },
  { pattern: /contextTypes\s*=/g, api: 'Legacy Context (contextTypes)', severity: 'CRITICAL' },
  { pattern: /React\.createFactory/g, api: 'React.createFactory()', severity: 'CRITICAL' },
  { pattern: /ReactDOM\.render\b/g, api: 'ReactDOM.render()', severity: 'HIGH' },
  { pattern: /ReactDOM\.hydrate\b/g, api: 'ReactDOM.hydrate()', severity: 'HIGH' },
];

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.next', 'vendor']);

function walkDir(dir, basePath) {
  const files = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (EXCLUDE_DIRS.has(entry) || entry.startsWith('.')) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        files.push(...walkDir(full, basePath));
      } else if (EXTENSIONS.has(entry.slice(entry.lastIndexOf('.')))) {
        files.push(full);
      }
    }
  } catch { /* permission denied etc */ }
  return files;
}

export function auditReactAPIs(projectPath) {
  const srcDir = join(projectPath, 'src');
  const files = walkDir(srcDir, projectPath);
  const findings = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

      for (const { pattern, api, severity } of PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          findings.push({
            file: relative(projectPath, filePath),
            line: i + 1,
            api,
            severity,
            code: line.trim().slice(0, 60),
          });
        }
      }
    }
  }

  return findings;
}
