import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import semver from 'semver';
import { getLockFile, getInstallCommand } from './pm-detect.js';
import { checkGitState } from './git-state.js';

export async function fixDependencies(projectPath, { dryRun = false, autoStash = false } = {}) {
  const pkgPath = resolve(projectPath, 'package.json');
  const { pm, lockFile, lockPath } = getLockFile(projectPath);
  const steps = [];
  const changes = [];

  // Step 1: Git state
  const git = checkGitState(projectPath);
  steps.push({
    name: 'Git Status',
    icon: git.isClean ? '✅' : '⚠️',
    detail: git.isClean ? 'Working tree clean' : `${git.files.length} uncommitted changes`,
  });

  if (!git.isClean && !dryRun) {
    if (autoStash) {
      execSync('git stash push -m "dep-doctor: auto-stash before fix"', { cwd: projectPath });
      steps.push({ name: 'Git Stash', icon: '📦', detail: 'Changes stashed automatically' });
    } else {
      steps.push({
        name: 'Git Warning',
        icon: '⚠️',
        detail: 'Uncommitted changes detected. Use --auto-stash to stash first.',
      });
    }
  }

  // Step 2: Backup
  const backupSuffix = `.backup-${Date.now()}`;
  if (!dryRun) {
    copyFileSync(pkgPath, pkgPath + backupSuffix);
    if (existsSync(lockPath)) copyFileSync(lockPath, lockPath + backupSuffix);
    steps.push({ name: 'Backup', icon: '💾', detail: `package.json${backupSuffix}` });
  }

  // Step 3: Read and analyze
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const before = { ...pkg.dependencies, ...pkg.devDependencies };
  const beforeCount = Object.keys(before).length;
  steps.push({ name: 'Analyze', icon: '🔍', detail: `${beforeCount} dependencies found` });

  // Step 4: Fix deprecated packages
  const deprecated = await findDeprecatedWithAlternatives(pkg);
  for (const dep of deprecated) {
    changes.push({
      type: 'DEPRECATED',
      pkg: dep.name,
      action: dep.alternative ? `Consider replacing with ${dep.alternative}` : 'Review needed — no known alternative',
      auto: false,
    });
  }

  // Step 5: Fix version ranges (remove pinned versions that cause lock drift)
  const depsToFix = findPinnedVersions(pkg);
  for (const { name, current, section } of depsToFix) {
    if (!dryRun) {
      pkg[section][name] = `^${current.replace(/^[=~^>=<]+/, '')}`;
      changes.push({
        type: 'RANGE_FIX',
        pkg: name,
        action: `${current} → ${pkg[section][name]}`,
        auto: true,
      });
    } else {
      changes.push({
        type: 'RANGE_FIX',
        pkg: name,
        action: `Would change ${current} → ^${current.replace(/^[=~^>=<]+/, '')}`,
        auto: false,
      });
    }
  }

  // Step 6: Write updated package.json
  if (!dryRun && changes.some((c) => c.auto)) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    steps.push({ name: 'Update package.json', icon: '📝', detail: `${changes.filter((c) => c.auto).length} changes applied` });
  }

  // Step 7: Regenerate lock file
  if (!dryRun) {
    steps.push({ name: 'Regenerate lock file', icon: '🔄', detail: `Running ${getInstallCommand(pm)}...` });
    try {
      execSync(getInstallCommand(pm), {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 120000,
      });
      steps.push({ name: 'Install', icon: '✅', detail: 'Dependencies installed successfully' });
    } catch (err) {
      const stderr = err.stderr?.slice(0, 200) || err.message;
      steps.push({ name: 'Install', icon: '❌', detail: `Failed: ${stderr}` });
    }
  }

  // Step 8: Verify with npm ci (dry run)
  if (!dryRun) {
    try {
      execSync(`${getInstallCommand(pm, { ci: true })} --dry-run`, {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 60000,
      });
      steps.push({ name: 'CI Verify', icon: '✅', detail: `${getInstallCommand(pm, { ci: true })} passed` });
    } catch {
      steps.push({ name: 'CI Verify', icon: '⚠️', detail: 'CI install check has warnings (may still work)' });
    }
  }

  // Step 9: npm cache check
  if (pm === 'npm') {
    try {
      const cacheInfo = execSync('npm cache ls 2>&1 | wc -l', {
        cwd: projectPath, encoding: 'utf-8', stdio: 'pipe',
      }).trim();
      steps.push({ name: 'npm Cache', icon: '📂', detail: `${cacheInfo} cached entries` });
    } catch {
      steps.push({ name: 'npm Cache', icon: 'ℹ️', detail: 'Cache check skipped' });
    }
  }

  return {
    pm,
    steps,
    changes,
    before: beforeCount,
    after: Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length,
    dryRun,
    backupSuffix: dryRun ? null : backupSuffix,
  };
}

async function findDeprecatedWithAlternatives(pkg) {
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const knownAlternatives = {
    request: 'axios, got, or node-fetch',
    enzyme: '@testing-library/react',
    'enzyme-adapter-react-16': '@testing-library/react',
    moment: 'dayjs or date-fns',
    'node-sass': 'sass (dart-sass)',
    tslint: 'eslint with @typescript-eslint',
    'babel-eslint': '@babel/eslint-parser',
    uglifyjs: 'terser',
    'left-pad': 'String.prototype.padStart()',
  };

  return Object.keys(allDeps)
    .filter((name) => knownAlternatives[name])
    .map((name) => ({ name, alternative: knownAlternatives[name] }));
}

function findPinnedVersions(pkg) {
  const results = [];
  for (const section of ['dependencies', 'devDependencies']) {
    const deps = pkg[section] || {};
    for (const [name, ver] of Object.entries(deps)) {
      if (typeof ver !== 'string') continue;
      // Exact versions without ^ or ~ (e.g., "1.2.3" instead of "^1.2.3")
      if (semver.valid(ver) && !ver.startsWith('^') && !ver.startsWith('~')) {
        results.push({ name, current: ver, section });
      }
    }
  }
  return results;
}
