import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scan } from './scanner.js';
import { auditReactAPIs } from './react-audit.js';
import { whyPackage } from './why.js';
import { printScanResults, printReactAudit, printWhyResult } from './reporter.js';

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

  // No args → help
  if (process.argv.length <= 2) {
    console.log('');
    console.log(chalk.bold('  dep-doctor') + chalk.dim(' v1.0.0 — dependency health scanner'));
    console.log('');
    console.log(chalk.dim('  Commands:'));
    console.log(`    ${chalk.cyan('scan')}          Scan dependencies for issues`);
    console.log(`    ${chalk.cyan('react-audit')}   Scan source for React 16 deprecated APIs`);
    console.log(`    ${chalk.cyan('why')} ${chalk.gray('<pkg>')}     Show dependency chain for a package`);
    console.log('');
    console.log(chalk.dim('  Options:'));
    console.log(`    ${chalk.gray('-p, --path')}    Project path (default: current directory)`);
    console.log(`    ${chalk.gray('--json')}        Output JSON report only (scan command)`);
    console.log('');
    console.log(chalk.dim('  Examples:'));
    console.log(`    ${chalk.gray('$')} dep-doctor scan`);
    console.log(`    ${chalk.gray('$')} dep-doctor scan --json`);
    console.log(`    ${chalk.gray('$')} dep-doctor react-audit`);
    console.log(`    ${chalk.gray('$')} dep-doctor why lodash`);
    console.log('');
    return;
  }

  program.parse();
}
