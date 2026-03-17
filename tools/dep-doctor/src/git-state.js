import { execSync } from 'node:child_process';

export function checkGitState(projectPath) {
  try {
    const status = execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf-8' });
    const isClean = status.trim() === '';
    const hasUnstaged = status.split('\n').some((l) => l.startsWith(' M') || l.startsWith('??'));
    const hasStagedChanges = status.split('\n').some((l) => /^[MADRC]/.test(l));

    return {
      isGit: true,
      isClean,
      hasUnstaged,
      hasStagedChanges,
      files: status.trim().split('\n').filter(Boolean).map((l) => l.trim()),
    };
  } catch {
    return { isGit: false, isClean: true, hasUnstaged: false, hasStagedChanges: false, files: [] };
  }
}

export function stashChanges(projectPath) {
  try {
    execSync('git stash push -m "dep-doctor: auto-stash before fix"', { cwd: projectPath, encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

export function unstashChanges(projectPath) {
  try {
    execSync('git stash pop', { cwd: projectPath, encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}
