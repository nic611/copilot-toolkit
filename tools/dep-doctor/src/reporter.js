import chalk from 'chalk';
import Table from 'cli-table3';

// Status badge colors
const BADGE = {
  DEPRECATED:  chalk.bgRed.white.bold(' DEPRECATED '),
  UNMAINTAINED: chalk.bgMagenta.white.bold(' UNMAINTAINED '),
  OUTDATED:    chalk.bgYellow.black.bold(' OUTDATED '),
  TRANSITIVE:  chalk.bgBlue.white.bold(' TRANSITIVE '),
  OK:          chalk.bgGreen.black.bold(' OK '),
  UNKNOWN:     chalk.bgGray.white.bold(' UNKNOWN '),
  CRITICAL:    chalk.bgRed.white.bold(' CRITICAL '),
};

// Package name colors by status
const PKG_COLOR = {
  DEPRECATED:  (s) => chalk.red.bold(s),
  UNMAINTAINED: (s) => chalk.magenta.bold(s),
  OUTDATED:    (s) => chalk.yellow.bold(s),
  OK:          (s) => chalk.cyan(s),
  UNKNOWN:     (s) => chalk.gray(s),
  CRITICAL:    (s) => chalk.red.bold(s),
  TRANSITIVE:  (s) => chalk.blue.bold(s),
};

export function printScanResults({ results, stats }, elapsed) {
  const buf = [];

  // Header
  buf.push('');

  // Main table
  const table = new Table({
    head: [
      chalk.gray('package'),
      chalk.gray('current'),
      chalk.gray('latest'),
      chalk.gray('status'),
      chalk.gray('source'),
    ],
    colWidths: [25, 12, 12, 16, 28],
    style: {
      head: [],
      border: ['gray'],
      compact: false,
    },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│',
    },
  });

  // Only show non-OK first, then up to 5 OK
  const issues = results.filter((r) => r.status !== 'OK');
  const okItems = results.filter((r) => r.status === 'OK');
  const showItems = [...issues, ...okItems.slice(0, 3)];

  for (const r of showItems) {
    const colorFn = PKG_COLOR[r.status] || PKG_COLOR.OK;
    const badge = BADGE[r.status] || BADGE.OK;
    table.push([
      colorFn(r.name),
      chalk.white(r.current),
      chalk.white(r.latest),
      badge,
      chalk.gray(r.source),
    ]);
  }

  if (okItems.length > 3) {
    table.push([
      chalk.gray(`... ${okItems.length - 3} more OK`),
      '', '', BADGE.OK, '',
    ]);
  }

  buf.push(table.toString());
  buf.push('');

  // Stats boxes
  const statsTable = new Table({
    colWidths: [20, 20, 20, 20],
    style: { border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│',
    },
  });

  statsTable.push([
    { content: chalk.bold.white(`${stats.total}`), hAlign: 'center' },
    { content: chalk.bold.yellow(`${stats.atRisk}`), hAlign: 'center' },
    { content: chalk.bold.blue(`${stats.unmaintained}`), hAlign: 'center' },
    { content: chalk.bold.green(`${stats.cacheRate}%`), hAlign: 'center' },
  ]);
  statsTable.push([
    { content: chalk.gray('total packages'), hAlign: 'center' },
    { content: chalk.gray('at risk'), hAlign: 'center' },
    { content: chalk.gray('unmaintained'), hAlign: 'center' },
    { content: chalk.gray('cache hit'), hAlign: 'center' },
  ]);

  buf.push(statsTable.toString());
  buf.push('');

  // Summary line
  const parts = [];
  if (stats.deprecated > 0) parts.push(chalk.red(`✕ ${stats.deprecated} deprecated`));
  if (stats.outdated > 0) parts.push(chalk.yellow(`↑ ${stats.outdated} outdated`));
  if (stats.unmaintained > 0) parts.push(chalk.magenta(`◆ ${stats.unmaintained} unmaintained`));
  parts.push(chalk.green(`✓ ${stats.ok} ok`));
  buf.push(`  ${parts.join('  ')}`);
  buf.push('');

  // Footer
  const secs = (elapsed / 1000).toFixed(1);
  buf.push(chalk.gray(`  report saved → dep-doctor-report.json · cached ${stats.cacheHits} packages`));
  buf.push(chalk.gray(`  finished in ${secs}s on ${stats.total} dependencies`));
  buf.push('');

  // Flush
  process.stdout.write(buf.join('\n'));
}

export function printReactAudit(findings) {
  const buf = [];

  buf.push('');
  buf.push(chalk.bold('  React 16 Deprecated API Audit'));
  buf.push('');

  if (findings.length === 0) {
    buf.push(chalk.green('  ✓ No deprecated React APIs found.'));
    buf.push('');
    process.stdout.write(buf.join('\n'));
    return;
  }

  const table = new Table({
    head: [
      chalk.gray('file'),
      chalk.gray('line'),
      chalk.gray('api'),
      chalk.gray('severity'),
      chalk.gray('react 19'),
    ],
    colWidths: [35, 8, 30, 12, 12],
    style: { head: [], border: ['gray'] },
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│',
    },
  });

  for (const f of findings) {
    const sevColor = f.severity === 'CRITICAL' ? chalk.red.bold : chalk.yellow;
    table.push([
      chalk.gray(f.file),
      chalk.white(String(f.line)),
      chalk.cyan(f.api),
      sevColor(f.severity),
      chalk.red('REMOVED'),
    ]);
  }

  buf.push(table.toString());
  buf.push('');

  const critCount = findings.filter((f) => f.severity === 'CRITICAL').length;
  const warnCount = findings.length - critCount;
  buf.push(`  ${chalk.red(`✕ ${critCount} critical`)}  ${chalk.yellow(`⚠ ${warnCount} warning`)}  ${chalk.gray(`${findings.length} total`)}`);
  buf.push('');

  process.stdout.write(buf.join('\n'));
}

export function printLockCheck(lockResult, peerConflicts) {
  const buf = [];
  buf.push('');
  buf.push(chalk.bold(`  🔒 Lock File Check`) + chalk.gray(` (${lockResult.pm} / ${lockResult.lockFile})`));
  buf.push('');

  if (lockResult.ok && peerConflicts.length === 0) {
    buf.push(chalk.green('  ✅ Lock file is in sync with package.json'));
    buf.push(chalk.green('  ✅ No peerDependency conflicts'));
    buf.push('');
    process.stdout.write(buf.join('\n'));
    return;
  }

  // Lock issues
  if (lockResult.issues.length > 0) {
    for (const issue of lockResult.issues) {
      const icon = issue.severity === 'CRITICAL' ? '❌' : issue.severity === 'HIGH' ? '⚠️' : 'ℹ️';
      const color = issue.severity === 'CRITICAL' ? chalk.red : issue.severity === 'HIGH' ? chalk.yellow : chalk.gray;
      buf.push(`  ${icon} ${color(issue.msg)}`);
      if (issue.fix) buf.push(chalk.gray(`     💡 ${issue.fix}`));
    }
    buf.push('');
  }

  // peerDep conflicts
  if (peerConflicts.length > 0) {
    buf.push(chalk.bold('  ⛓️  peerDependency Conflicts'));
    buf.push('');

    const table = new Table({
      head: [
        chalk.gray('package'),
        chalk.gray('requires'),
        chalk.gray('installed'),
        chalk.gray('severity'),
      ],
      colWidths: [22, 22, 22, 14],
      style: { head: [], border: ['gray'] },
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│',
      },
    });

    for (const c of peerConflicts) {
      const sevBadge = c.severity === 'CRITICAL' ? BADGE.CRITICAL : BADGE.OUTDATED;
      table.push([
        chalk.cyan.bold(c.package),
        chalk.yellow(c.requires),
        chalk.red(c.installed),
        sevBadge,
      ]);
    }
    buf.push(table.toString());
    buf.push('');
  }

  // Summary
  const lockIssues = lockResult.issues.filter((i) => i.severity !== 'LOW').length;
  const parts = [];
  if (lockIssues > 0) parts.push(chalk.red(`❌ ${lockIssues} lock issues`));
  if (peerConflicts.length > 0) parts.push(chalk.yellow(`⛓️  ${peerConflicts.length} peer conflicts`));
  if (parts.length === 0) parts.push(chalk.green('✅ all clear'));
  buf.push(`  ${parts.join('  ')}`);
  buf.push('');

  process.stdout.write(buf.join('\n'));
}

export function printFixReport(result) {
  const buf = [];
  buf.push('');
  buf.push(chalk.bold('  🔧 dep-doctor fix') + (result.dryRun ? chalk.yellow(' (dry run)') : ''));
  buf.push('');

  // Steps
  for (const step of result.steps) {
    buf.push(`  ${step.icon} ${chalk.bold(step.name)} ${chalk.gray('—')} ${chalk.white(step.detail)}`);
  }
  buf.push('');

  // Changes
  if (result.changes.length > 0) {
    buf.push(chalk.bold('  📋 Changes'));
    buf.push('');
    for (const ch of result.changes) {
      const icon = ch.auto ? '🔧' : '📌';
      const badge = ch.type === 'DEPRECATED' ? BADGE.DEPRECATED :
                    ch.type === 'RANGE_FIX' ? chalk.bgCyan.black.bold(' RANGE ') :
                    chalk.bgGray.white.bold(` ${ch.type} `);
      buf.push(`  ${icon} ${badge} ${chalk.cyan.bold(ch.pkg)}`);
      buf.push(chalk.gray(`     ${ch.action}`));
    }
    buf.push('');
  }

  // Before/After
  buf.push(chalk.bold('  📊 Summary'));
  buf.push(`  ${chalk.gray('Before:')} ${result.before} dependencies`);
  buf.push(`  ${chalk.gray('After: ')} ${result.after} dependencies`);
  buf.push(`  ${chalk.gray('PM:    ')} ${result.pm}`);
  if (result.backupSuffix) {
    buf.push(`  ${chalk.gray('Backup:')} package.json${result.backupSuffix}`);
  }
  buf.push('');

  process.stdout.write(buf.join('\n'));
}

export function printWhyResult(chain) {
  const buf = [];
  buf.push('');

  if (!chain || chain.length === 0) {
    buf.push(chalk.yellow('  Package not found in dependency tree.'));
    buf.push('');
    process.stdout.write(buf.join('\n'));
    return;
  }

  for (let i = 0; i < chain.length; i++) {
    const indent = i === 0 ? '' : '  '.repeat(i - 1) + (i === chain.length - 1 ? '└── ' : '├── ');
    const color = i === 0 ? chalk.cyan.bold : chalk.white;
    buf.push(`  ${indent}${color(chain[i])}`);
  }

  buf.push('');
  process.stdout.write(buf.join('\n'));
}
