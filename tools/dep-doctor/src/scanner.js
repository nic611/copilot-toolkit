import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pLimit from 'p-limit';
import semver from 'semver';
import { fetchPackageInfo } from './registry.js';

export async function scan(projectPath, { onProgress } = {}) {
  const pkgPath = resolve(projectPath, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${pkgPath}`);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const allDeps = [
    ...Object.entries(deps).map(([n, v]) => ({ name: n, current: v, isDev: false })),
    ...Object.entries(devDeps).map(([n, v]) => ({ name: n, current: v, isDev: true })),
  ];

  const total = allDeps.length;
  let completed = 0;
  let cacheHits = 0;
  const limit = pLimit(15);

  const results = await Promise.all(
    allDeps.map((dep) =>
      limit(async () => {
        const info = await fetchPackageInfo(dep.name);
        completed++;
        if (info.fromCache) cacheHits++;
        if (onProgress) onProgress(completed, total);
        return classifyDep(dep, info);
      })
    )
  );

  // Sort: CRITICAL > DEPRECATED > UNMAINTAINED > OUTDATED > TRANSITIVE > OK
  const order = { CRITICAL: 0, DEPRECATED: 1, UNMAINTAINED: 2, OUTDATED: 3, TRANSITIVE: 4, OK: 5 };
  results.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  const stats = {
    total,
    deprecated: results.filter((r) => r.status === 'DEPRECATED').length,
    outdated: results.filter((r) => r.status === 'OUTDATED').length,
    unmaintained: results.filter((r) => r.status === 'UNMAINTAINED').length,
    ok: results.filter((r) => r.status === 'OK').length,
    atRisk: results.filter((r) => r.status !== 'OK').length,
    cacheHits,
    cacheRate: total > 0 ? Math.round((cacheHits / total) * 100) : 0,
  };

  return { results, stats, projectName: pkg.name || 'unknown' };
}

function classifyDep(dep, info) {
  const currentClean = semver.coerce(dep.current)?.version || dep.current.replace(/^[\^~>=<]+/, '');
  const result = {
    name: dep.name,
    current: currentClean,
    latest: info.latest || 'unknown',
    isDev: dep.isDev,
    source: 'package.json → direct',
    peerDeps: info.peerDeps || {},
    deprecated: info.deprecated,
    error: info.error || null,
  };

  if (info.error) {
    result.status = 'UNKNOWN';
    result.source = 'private / not found';
    return result;
  }

  // Check deprecated
  if (info.deprecated) {
    result.status = 'DEPRECATED';
    return result;
  }

  // Check unmaintained (>2 years since last publish)
  if (info.lastPublish) {
    const age = Date.now() - new Date(info.lastPublish).getTime();
    const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
    if (age > twoYears) {
      result.status = 'UNMAINTAINED';
      return result;
    }
  }

  // Check outdated (major version diff)
  if (result.latest !== 'unknown' && currentClean !== result.latest) {
    const diff = semver.diff(currentClean, result.latest);
    if (diff === 'major' || diff === 'premajor') {
      result.status = 'OUTDATED';
    } else if (diff === 'minor' || diff === 'preminor') {
      result.status = 'OUTDATED';
    } else if (diff) {
      result.status = 'OUTDATED';
    } else {
      result.status = 'OK';
    }
    return result;
  }

  result.status = 'OK';
  return result;
}
