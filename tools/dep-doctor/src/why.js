import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function whyPackage(projectPath, targetPkg) {
  const lockPath = resolve(projectPath, 'package-lock.json');

  if (existsSync(lockPath)) {
    return whyFromNpmLock(lockPath, targetPkg);
  }

  // Fallback: check package.json direct deps
  const pkgPath = resolve(projectPath, 'package.json');
  if (!existsSync(pkgPath)) return [];

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (allDeps[targetPkg]) {
    return [`${targetPkg}@${allDeps[targetPkg]}`, 'package.json (direct dependency)'];
  }

  return [];
}

function whyFromNpmLock(lockPath, targetPkg) {
  try {
    const lock = JSON.parse(readFileSync(lockPath, 'utf-8'));
    const packages = lock.packages || {};

    // Find target in lock
    const chains = [];

    // Direct check
    const directKey = `node_modules/${targetPkg}`;
    if (packages[directKey]) {
      const ver = packages[directKey].version || 'unknown';
      chains.push(`${targetPkg}@${ver}`);
      chains.push('package.json (direct dependency)');
      return chains;
    }

    // Transitive: find who depends on target
    for (const [key, meta] of Object.entries(packages)) {
      const deps = { ...meta.dependencies, ...meta.peerDependencies };
      if (deps[targetPkg]) {
        const parentName = key.replace('node_modules/', '').split('/node_modules/').pop();
        const parentVer = meta.version || 'unknown';
        const targetVer = packages[`node_modules/${targetPkg}`]?.version || deps[targetPkg];

        chains.push(`${targetPkg}@${targetVer}`);
        chains.push(`${parentName}@${parentVer}`);

        // Check if parent is also transitive
        const parentInRoot = packages['']?.dependencies?.[parentName] || packages['']?.devDependencies?.[parentName];
        if (parentInRoot) {
          chains.push('package.json (direct dependency)');
        }
        return chains;
      }
    }

    return [];
  } catch {
    return [];
  }
}
