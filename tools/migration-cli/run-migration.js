#!/usr/bin/env node

/**
 * Migration Runner - 一键执行迁移步骤
 *
 * 优化: 拆分函数降低 complexity
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

// ============================================
// 常量配置
// ============================================

const PHASES = {
  1: { name: "依赖审计", description: "Analyze current dependencies" },
  2: { name: "npm → pnpm", description: "Migrate from npm to pnpm" },
  3: { name: "React 16 → 18", description: "Upgrade React to version 18" },
  4: { name: "Node 22 → 24", description: "Upgrade Node.js to version 24" },
  5: { name: "React 18 → 19", description: "Upgrade React to version 19" },
};

const COLORS = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

const ICONS = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✗",
  step: "→",
};

// ============================================
// 工具函数
// ============================================

const colorize = (text, color) => `${COLORS[color] || ""}${text}${COLORS.reset}`;

const log = (message, type = "info") => {
  const iconColor = {
    info: "blue",
    success: "green",
    warning: "yellow",
    error: "red",
    step: "cyan",
  };
  const icon = colorize(ICONS[type] || "", iconColor[type]);
  console.log(`${icon} ${message}`);
};

const fileExists = (filePath) => fs.existsSync(filePath);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf-8"));

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
};

// ============================================
// 命令执行
// ============================================

const runCommand = (cmd, options = {}) => {
  const { cwd, silent = false, allowFail = false } = options;

  if (!silent) {
    console.log(colorize(`  $ ${cmd}`, "dim"));
  }

  try {
    const result = execSync(cmd, {
      cwd,
      encoding: "utf-8",
      stdio: silent ? "pipe" : "inherit",
    });
    return { success: true, output: result };
  } catch (error) {
    if (allowFail) {
      return { success: false, error: error.message };
    }
    throw error;
  }
};

const prompt = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
};

// ============================================
// Phase 1: 依赖审计
// ============================================

const analyzePackageJson = (projectPath) => {
  const pkgPath = path.join(projectPath, "package.json");

  if (!fileExists(pkgPath)) {
    log("package.json not found!", "error");
    return null;
  }

  return readJson(pkgPath);
};

const checkReactStatus = (deps) => {
  if (!deps["react"]) return null;

  const version = deps["react"].replace(/[\^~>=<]/g, "");
  const major = parseInt(version.split(".")[0], 10);
  const status = major < 18 ? colorize("需要升级", "yellow") : colorize("OK", "green");

  return { version: deps["react"], status };
};

const findProblemPackages = (deps) => {
  const problemList = ["enzyme", "enzyme-adapter-react-16", "node-sass", "request"];
  return problemList.filter((pkg) => deps[pkg]);
};

const printDependencyInfo = (pkg) => {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  console.log(colorize("\n📦 Current Dependencies:", "bold"));
  console.log("-".repeat(40));

  const reactStatus = checkReactStatus(deps);
  if (reactStatus) {
    console.log(`  react: ${reactStatus.version} ${reactStatus.status}`);
  }

  if (deps["react-dom"]) {
    console.log(`  react-dom: ${deps["react-dom"]}`);
  }

  const problems = findProblemPackages(deps);
  if (problems.length > 0) {
    console.log(colorize("\n⚠️  Problem Packages Found:", "yellow"));
    problems.forEach((p) => console.log(`  - ${p}@${deps[p]}`));
  }
};

const phase1 = async (projectPath) => {
  log("Phase 1: 依赖审计", "step");

  const pkg = analyzePackageJson(projectPath);
  if (!pkg) return false;

  printDependencyInfo(pkg);

  console.log(colorize("\n📊 Outdated Packages:", "bold"));
  console.log("-".repeat(40));
  runCommand("npm outdated", { cwd: projectPath, allowFail: true });

  log("\n审计完成。查看上方报告了解需要升级的内容。", "success");
  return true;
};

// ============================================
// Phase 2: npm → pnpm
// ============================================

const checkPnpmInstalled = () => {
  const result = runCommand("which pnpm", { silent: true, allowFail: true });
  return result.success;
};

const migrateToPnpm = (projectPath) => {
  const lockPath = path.join(projectPath, "package-lock.json");
  const nodeModulesPath = path.join(projectPath, "node_modules");

  if (fileExists(lockPath)) {
    log("Importing from package-lock.json...", "info");
    runCommand("pnpm import", { cwd: projectPath });
  }

  if (fileExists(nodeModulesPath)) {
    log("Removing node_modules...", "info");
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }

  if (fileExists(lockPath)) {
    log("Removing package-lock.json...", "info");
    fs.unlinkSync(lockPath);
  }

  log("Running pnpm install...", "info");
  runCommand("pnpm install", { cwd: projectPath });
};

const updatePackageManagerField = (projectPath) => {
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = readJson(pkgPath);
  pkg.packageManager = "pnpm@9.0.0";
  writeJson(pkgPath, pkg);
};

const createNpmrc = (projectPath) => {
  const npmrcPath = path.join(projectPath, ".npmrc");

  if (fileExists(npmrcPath)) return;

  const content = `auto-install-peers=true\nstrict-peer-dependencies=false\n`;
  fs.writeFileSync(npmrcPath, content, "utf-8");
  log("Created .npmrc with recommended settings", "info");
};

const phase2 = async (projectPath, dryRun) => {
  log("Phase 2: npm → pnpm 迁移", "step");

  if (dryRun) {
    log("Dry run - 以下是将要执行的步骤:", "info");
    console.log("  1. pnpm import");
    console.log("  2. rm -rf node_modules");
    console.log("  3. rm package-lock.json");
    console.log("  4. pnpm install");
    console.log("  5. 更新 package.json");
    return true;
  }

  if (!checkPnpmInstalled()) {
    log("pnpm not installed. Please run: npm install -g pnpm", "error");
    return false;
  }

  migrateToPnpm(projectPath);
  updatePackageManagerField(projectPath);
  createNpmrc(projectPath);

  log("\npnpm 迁移完成!", "success");
  return true;
};

// ============================================
// Phase 3: React 16 → 18
// ============================================

const getPackageManager = (projectPath) => {
  return fileExists(path.join(projectPath, "pnpm-lock.yaml")) ? "pnpm" : "npm";
};

const upgradeReactPackages = (projectPath, pm) => {
  log("Upgrading React packages...", "info");
  runCommand(`${pm} add react@18 react-dom@18`, { cwd: projectPath });
};

const upgradeReactTypes = (projectPath, pm, pkg) => {
  if (!pkg.devDependencies?.["@types/react"]) return;
  runCommand(`${pm} add -D @types/react@18 @types/react-dom@18`, { cwd: projectPath });
};

const runReactCodemod = (projectPath) => {
  const codemodPath = path.join(__dirname, "codemods", "react-18-codemod.js");

  if (!fileExists(codemodPath)) return;

  log("Running React 18 codemod...", "info");
  runCommand(`node ${codemodPath} ${projectPath} --entry-only`, { cwd: projectPath });
};

const printReactUpgradeNotes = () => {
  log("\n重要: 请手动检查以下内容:", "warning");
  console.log("  1. 入口文件的 createRoot 转换是否正确");
  console.log("  2. useEffect 在 StrictMode 下双重执行是否有问题");
  console.log("  3. 第三方库是否兼容 React 18");
};

const phase3 = async (projectPath, dryRun) => {
  log("Phase 3: React 16 → 18 升级", "step");

  if (dryRun) {
    log("Dry run - 以下是将要执行的步骤:", "info");
    console.log("  1. 升级 react 和 react-dom 到 ^18.2.0");
    console.log("  2. 升级 @types/react (如果存在)");
    console.log("  3. 运行 React 18 codemod");
    return true;
  }

  const pkgPath = path.join(projectPath, "package.json");
  const pkg = readJson(pkgPath);
  const pm = getPackageManager(projectPath);

  upgradeReactPackages(projectPath, pm);
  upgradeReactTypes(projectPath, pm, pkg);
  runReactCodemod(projectPath);

  log("\nReact 18 升级完成!", "success");
  printReactUpgradeNotes();

  return true;
};

// ============================================
// Phase 4: Node 22 → 24
// ============================================

const updateNvmrc = (projectPath) => {
  const nvmrcPath = path.join(projectPath, ".nvmrc");
  fs.writeFileSync(nvmrcPath, "24\n", "utf-8");
  log("Updated .nvmrc to Node 24", "info");
};

const updateEnginesField = (projectPath) => {
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = readJson(pkgPath);

  pkg.engines = pkg.engines || {};
  pkg.engines.node = ">=24.0.0";

  writeJson(pkgPath, pkg);
  log("Updated package.json engines field", "info");
};

const printNodeUpgradeNotes = () => {
  log("\n下一步 (手动执行):", "warning");
  console.log("  1. fnm install 24");
  console.log("  2. fnm use 24");
  console.log("  3. rm -rf node_modules && pnpm install");
  console.log("  4. pnpm build && pnpm test");
};

const phase4 = async (projectPath, dryRun) => {
  log("Phase 4: Node.js 22 → 24 升级", "step");

  if (dryRun) {
    log("Dry run - 以下是将要执行的步骤:", "info");
    console.log("  1. 更新 .nvmrc 到 24");
    console.log("  2. 更新 package.json engines");
    return true;
  }

  updateNvmrc(projectPath);
  updateEnginesField(projectPath);

  log("\nNode.js 配置更新完成!", "success");
  printNodeUpgradeNotes();

  return true;
};

// ============================================
// Phase 5: React 18 → 19
// ============================================

const phase5 = async (projectPath, dryRun) => {
  log("Phase 5: React 18 → 19 升级 (预览)", "step");
  log("React 19 目前处于候选发布阶段", "warning");

  if (dryRun) {
    log("\nDry run - 以下是将要执行的步骤:", "info");
    console.log("  1. 升级 react 和 react-dom 到 ^19.0.0");
    console.log("  2. 移除 forwardRef 包装");
    return true;
  }

  const answer = await prompt("\nReact 19 还在开发中，确定要升级吗? (y/n) ");
  if (answer !== "y" && answer !== "yes") {
    log("已取消升级", "info");
    return false;
  }

  const pm = getPackageManager(projectPath);

  log("Upgrading to React 19...", "info");
  runCommand(`${pm} add react@19 react-dom@19`, { cwd: projectPath });

  log("\nReact 19 升级完成!", "success");
  log("请参考 guides/05-react-18-to-19.md 了解破坏性变更", "info");

  return true;
};

// ============================================
// CLI 参数解析
// ============================================

const parseArgs = (args) => {
  const result = {
    phase: null,
    projectPath: process.cwd(),
    dryRun: false,
    showHelp: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--path" && args[i + 1]) {
      result.projectPath = path.resolve(args[i + 1]);
      i++;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      result.showHelp = true;
    } else if (!isNaN(parseInt(arg, 10))) {
      result.phase = parseInt(arg, 10);
    }
  }

  return result;
};

// ============================================
// 帮助和菜单
// ============================================

const showHelp = () => {
  console.log(`
Migration Runner - 一键执行迁移步骤

Usage:
  node run-migration.js <phase> [options]

Phases:
  1    依赖审计
  2    npm → pnpm
  3    React 16 → 18
  4    Node 22 → 24
  5    React 18 → 19 (预览)

Options:
  --path <dir>   指定项目路径
  --dry-run      只显示将执行的操作
  --help, -h     显示帮助

Examples:
  node run-migration.js 1
  node run-migration.js 2 --dry-run
  node run-migration.js 3 --path ../my-app
  `);
};

const showMenu = () => {
  console.log("Available Phases:\n");

  Object.entries(PHASES).forEach(([num, info]) => {
    console.log(`  ${num}. ${info.name}`);
    console.log(`     ${colorize(info.description, "dim")}`);
  });

  console.log("\nUsage: node run-migration.js <phase> [--path <dir>] [--dry-run]");
};

const printBanner = (projectPath, dryRun) => {
  console.log(colorize("\n🚀 Migration Runner\n", "bold"));
  console.log(`Project: ${projectPath}`);
  console.log(`Mode: ${dryRun ? "Dry Run" : "Execute"}`);
  console.log("\n" + "=".repeat(50) + "\n");
};

// ============================================
// 主函数
// ============================================

const PHASE_HANDLERS = {
  1: phase1,
  2: phase2,
  3: phase3,
  4: phase4,
  5: phase5,
};

const main = async () => {
  const args = process.argv.slice(2);
  const { phase, projectPath, dryRun, showHelp: needHelp } = parseArgs(args);

  if (needHelp) {
    showHelp();
    return;
  }

  printBanner(projectPath, dryRun);

  if (!phase) {
    showMenu();
    return;
  }

  const handler = PHASE_HANDLERS[phase];

  if (!handler) {
    log(`Unknown phase: ${phase}`, "error");
    return;
  }

  try {
    await handler(projectPath, dryRun);
  } catch (error) {
    log(`Error: ${error.message}`, "error");
    process.exit(1);
  }

  console.log();
};

main();
