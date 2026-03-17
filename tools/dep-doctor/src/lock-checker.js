import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import semver from 'semver';
import { getLockFile } from './pm-detect.js';

export function checkLockIntegrity(projectPath) {
  const pkgPath = resolve(projectPath, 'package.json');
  if (!existsSync(pkgPath)) return { ok: false, issues: [{ type: 'MISSING', msg: 'package.json not found' }] };

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const { pm, lockFile, lockPath } = getLockFile(projectPath);
  const issues = [];

  // Check lock file exists
  if (!existsSync(lockPath)) {
    issues.push({ type: 'NO_LOCK', msg: `${lockFile} not found — run "${pm} install" first`, severity: 'CRITICAL' });
    return { ok: false, issues, pm, lockFile };
  }

  if (pm === 'npm') {
    return checkNpmLock(pkg, lockPath, issues);
  }

  // For pnpm/yarn, basic existence check is enough for now
  return { ok: issues.length === 0, issues, pm, lockFile };
}

function checkNpmLock(pkg, lockPath, issues) {
  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf-8'));
  } catch (err) {
    issues.push({ type: 'CORRUPT_LOCK', msg: `package-lock.json is corrupt: ${err.message}`, severity: 'CRITICAL' });
    return { ok: false, issues, pm: 'npm', lockFile: 'package-lock.json' };
  }

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const lockPackages = lock.packages || {};
  const rootPkg = lockPackages[''] || {};
  const lockDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };

  // Check each dep in package.json has matching entry in lock
  for (const [name, range] of Object.entries(allDeps)) {
    const lockKey = `node_modules/${name}`;
    const lockEntry = lockPackages[lockKey];

    if (!lockEntry) {
      issues.push({
        type: 'MISSING_IN_LOCK',
        pkg: name,
        msg: `${name}@${range} in package.json but not in lock file`,
        severity: 'HIGH',
        fix: 'Run "npm install" to regenerate lock file',
      });
      continue;
    }

    // Check version satisfies range
    const lockedVersion = lockEntry.version;
    if (lockedVersion && range && !range.startsWith('file:') && !range.startsWith('git')) {
      const cleanRange = range.replace(/^[\^~>=<]+/, '');
      if (semver.valid(lockedVersion) && semver.validRange(range)) {
        if (!semver.satisfies(lockedVersion, range)) {
          issues.push({
            type: 'VERSION_MISMATCH',
            pkg: name,
            msg: `${name}: lock has ${lockedVersion} but package.json requires ${range}`,
            severity: 'HIGH',
            fix: `Update range or run "npm install"`,
          });
        }
      }
    }
  }

  // Check for orphaned entries in lock (in lock but removed from package.json)
  for (const [name, range] of Object.entries(lockDeps || {})) {
    if (!allDeps[name]) {
      issues.push({
        type: 'ORPHANED_IN_LOCK',
        pkg: name,
        msg: `${name} in lock file but not in package.json`,
        severity: 'LOW',
        fix: 'Run "npm install" to clean up',
      });
    }
  }

  return { ok: issues.length === 0, issues, pm: 'npm', lockFile: 'package-lock.json' };
}

export function checkPeerDeps(projectPath) {
  const lockPath = resolve(projectPath, 'package-lock.json');
  if (!existsSync(lockPath)) return [];

  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf-8'));
  } catch { return []; }

  const packages = lock.packages || {};
  const conflicts = [];

  for (const [key, meta] of Object.entries(packages)) {
    if (!key.startsWith('node_modules/')) continue;
    const name = key.replace('node_modules/', '').split('/node_modules/').pop();
    const peerDeps = meta.peerDependencies || {};

    for (const [peerName, peerRange] of Object.entries(peerDeps)) {
      const peerKey = `node_modules/${peerName}`;
      const peerInstalled = packages[peerKey];

      if (!peerInstalled) continue;
      const installedVer = peerInstalled.version;

      if (installedVer && semver.validRange(peerRange) && semver.valid(installedVer)) {
        if (!semver.satisfies(installedVer, peerRange)) {
          conflicts.push({
            package: name,
            requires: `${peerName}@${peerRange}`,
            installed: `${peerName}@${installedVer}`,
            severity: peerName === 'react' || peerName === 'react-dom' ? 'CRITICAL' : 'WARNING',
          });
        }
      }
    }
  }

  return conflicts;
}
