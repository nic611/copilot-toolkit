import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scan } from './scanner.js';
import { auditReactAPIs } from './react-audit.js';
import { whyPackage } from './why.js';
import { printScanResults, printReactAudit, printWhyResult, printLockCheck, printFixReport } from './reporter.js';
import { checkLockIntegrity, checkPeerDeps } from './lock-checker.js';
import { fixDependencies } from './fixer.js';
import { detectPackageManager } from './pm-detect.js';

export function cli() {
  const program = new Command();

  program
    .name('dep-doctor')
    .version('1.0.0')
    .description(chalk.bold('dep-doctor') + chalk.dim(' — dependency health scanner'));

  // ── scan ──────────────────────────────────────────────
  program
    .command('scan')
    .description('Scan dependencies for issues')
    .option('-p, --path <path>', 'Project path', '.')
    .option('--json', 'Output JSON report only')
    .action(async (options) => {
      const projectPath = resolve(options.path);
      const spinner = ora({
        text: chalk.dim('Scanning packages...'),
        spinner: 'dots2',
      }).start();

      const start = Date.now();

      try {
        const results = await scan(projectPath, {
          onProgress(done, total) {
            spinner.text = chalk.dim(`Scanning ${done}/${total} packages...`);
          },
        });

        spinner.stop();

        const elapsed = Date.now() - start;

        if (options.json) {
          const report = { ...results, elapsed };
          console.log(JSON.stringify(report, null, 2));
        } else {
          printScanResults(results, elapsed);
        }

        // Save JSON report
        const reportPath = resolve(projectPath, 'dep-doctor-report.json');
        writeFileSync(reportPath, JSON.stringify(results, null, 2));

        process.exit(results.stats.atRisk > 0 ? 1 : 0);
      } catch (err) {
        spinner.fail(chalk.red(err.message));
        process.exit(2);
      }
    });

  // ── react-audit ──────────────────────────────────────
  program
    .command('react-audit')
    .description('Scan source for React 16 deprecated APIs')
    .option('-p, --path <path>', 'Project path', '.')
    .action((options) => {
      const projectPath = resolve(options.path);

      console.log('');
      const spinner = ora({
        text: chalk.dim('Scanning source files...'),
        spinner: 'dots2',
      }).start();

      try {
        const findings = auditReactAPIs(projectPath);
        spinner.stop();
        printReactAudit(findings);
        process.exit(findings.length > 0 ? 1 : 0);
      } catch (err) {
        spinner.fail(chalk.red(err.message));
        process.exit(2);
      }
    });

  // ── why ──────────────────────────────────────────────
  program
    .command('why <package>')
    .description('Show dependency chain for a package')
    .option('-p, --path <path>', 'Project path', '.')
    .action((pkg, options) => {
      const projectPath = resolve(options.path);
      const chain = whyPackage(projectPath, pkg);
      printWhyResult(chain);
    });

  // ── check ──────────────────────────────────────────────
  program
    .command('check')
    .description('Check lock file integrity + peerDep conflicts')
    .option('-p, --path <path>', 'Project path', '.')
    .action((options) => {
      const projectPath = resolve(options.path);
      const pm = detectPackageManager(projectPath);

      console.log('');
      const spinner = ora({
        text: chalk.dim(`Checking ${pm} lock file...`),
        spinner: 'dots2',
      }).start();

      try {
        const lockResult = checkLockIntegrity(projectPath);
        const peerConflicts = checkPeerDeps(projectPath);
        spinner.stop();
        printLockCheck(lockResult, peerConflicts);

        const hasIssues = !lockResult.ok || peerConflicts.length > 0;
        process.exit(hasIssues ? 1 : 0);
      } catch (err) {
        spinner.fail(chalk.red(err.message));
        process.exit(2);
      }
    });

  // ── fix ──────────────────────────────────────────────
  program
    .command('fix')
    .description('Auto-fix dependency issues (backup + lock regen)')
    .option('-p, --path <path>', 'Project path', '.')
    .option('--dry-run', 'Show what would change without modifying files')
    .option('--auto-stash', 'Auto git-stash uncommitted changes before fix')
    .action(async (options) => {
      const projectPath = resolve(options.path);

      console.log('');
      const spinner = ora({
        text: chalk.dim('Diagnosing dependencies...'),
        spinner: 'dots2',
      }).start();

      try {
        spinner.stop();
        const result = await fixDependencies(projectPath, {
          dryRun: options.dryRun,
          autoStash: options.autoStash,
        });
        printFixReport(result);
        process.exit(0);
      } catch (err) {
        spinner.fail(chalk.red(err.message));
        process.exit(2);
      }
    });

  // No args → help
  if (process.argv.length <= 2) {
    console.log('');
    console.log(chalk.bold('  🩺 dep-doctor') + chalk.dim(' v2.0.0 — dependency health scanner & fixer'));
    console.log('');
    console.log(chalk.dim('  Diagnose:'));
    console.log(`    ${chalk.cyan('scan')}            📦 Scan dependencies for issues`);
    console.log(`    ${chalk.cyan('check')}           🔒 Check lock file + peerDep conflicts`);
    console.log(`    ${chalk.cyan('react-audit')}     ⚛️  Scan source for React 16 deprecated APIs`);
    console.log(`    ${chalk.cyan('why')} ${chalk.gray('<pkg>')}       🔍 Show dependency chain`);
    console.log('');
    console.log(chalk.dim('  Fix:'));
    console.log(`    ${chalk.cyan('fix')}             🔧 Auto-fix issues (backup + lock regen)`);
    console.log(`    ${chalk.cyan('fix --dry-run')}   📋 Preview changes without modifying files`);
    console.log('');
    console.log(chalk.dim('  Options:'));
    console.log(`    ${chalk.gray('-p, --path')}      Project path (default: current directory)`);
    console.log(`    ${chalk.gray('--json')}          JSON output (scan command)`);
    console.log(`    ${chalk.gray('--auto-stash')}    Git stash before fix`);
    console.log('');
    console.log(chalk.dim('  Examples:'));
    console.log(`    ${chalk.gray('$')} dep-doctor scan`);
    console.log(`    ${chalk.gray('$')} dep-doctor check`);
    console.log(`    ${chalk.gray('$')} dep-doctor fix --dry-run`);
    console.log(`    ${chalk.gray('$')} dep-doctor react-audit`);
    console.log(`    ${chalk.gray('$')} dep-doctor why yup`);
    console.log('');
    return;
  }

  program.parse();
}
