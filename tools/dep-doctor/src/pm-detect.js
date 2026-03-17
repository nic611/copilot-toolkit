import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function detectPackageManager(projectPath) {
  if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(projectPath, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(projectPath, 'bun.lockb'))) return 'bun';
  if (existsSync(join(projectPath, 'package-lock.json'))) return 'npm';
  return 'npm'; // default
}

export function getLockFile(projectPath) {
  const pm = detectPackageManager(projectPath);
  const map = {
    npm: 'package-lock.json',
    pnpm: 'pnpm-lock.yaml',
    yarn: 'yarn.lock',
    bun: 'bun.lockb',
  };
  return { pm, lockFile: map[pm], lockPath: join(projectPath, map[pm]) };
}

export function getInstallCommand(pm, opts = {}) {
  const ci = opts.ci || false;
  const cmds = {
    npm: ci ? 'npm ci' : 'npm install',
    pnpm: ci ? 'pnpm install --frozen-lockfile' : 'pnpm install',
    yarn: ci ? 'yarn install --frozen-lockfile' : 'yarn install',
    bun: 'bun install',
  };
  return cmds[pm] || 'npm install';
}
