import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CACHE_DIR = join(homedir(), '.dep-doctor', 'cache');
const TTL_MS = 60 * 60 * 1000; // 1 hour

function ensureDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

export function getCached(key) {
  ensureDir();
  const file = join(CACHE_DIR, `${key.replace(/\//g, '__')}.json`);
  if (!existsSync(file)) return null;
  try {
    const { data, ts } = JSON.parse(readFileSync(file, 'utf-8'));
    if (Date.now() - ts > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data) {
  ensureDir();
  const file = join(CACHE_DIR, `${key.replace(/\//g, '__')}.json`);
  writeFileSync(file, JSON.stringify({ data, ts: Date.now() }));
}

export function getCacheStats() {
  ensureDir();
  try {
    return readdirSync(CACHE_DIR).length;
  } catch {
    return 0;
  }
}
