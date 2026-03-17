import { getCached, setCache } from './cache.js';

export async function fetchPackageInfo(name) {
  const cached = getCached(name);
  if (cached) return { ...cached, fromCache: true };

  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.npm.install-v1+json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { name, error: `HTTP ${res.status}`, fromCache: false };
    }

    const pkg = await res.json();
    const distTags = pkg['dist-tags'] || {};
    const latest = distTags.latest || 'unknown';
    const versions = pkg.versions || {};
    const latestMeta = versions[latest] || {};

    // Deprecated flag
    const deprecated = latestMeta.deprecated || null;

    // Last publish time
    const time = pkg.time || {};
    const lastPublish = time[latest] || time.modified || null;

    // peerDependencies of latest
    const peerDeps = latestMeta.peerDependencies || {};

    const result = { name, latest, deprecated, lastPublish, peerDeps, fromCache: false };
    setCache(name, { ...result, fromCache: false });
    return result;
  } catch (err) {
    return { name, error: err.message, fromCache: false };
  }
}
