#!/usr/bin/env node

/**
 * Migration CLI - 项目迁移分析工具
 *
 * 优化: 拆分函数降低 complexity
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ============================================
// 配置常量
// ============================================

const CONFIG = {
  REACT_18_INCOMPATIBLE: [
    "enzyme",
    "enzyme-adapter-react-16",
    "enzyme-adapter-react-17",
    "react-test-renderer",
  ],

  DEPRECATED_PACKAGES: ["request", "request-promise", "node-sass", "moment", "enzyme"],

  DEPRECATED_ALTERNATIVES: {
    request: "axios, node-fetch, or undici",
    "request-promise": "axios or node-fetch",
    "node-sass": "sass (dart-sass)",
    moment: "dayjs, date-fns, or luxon",
    enzyme: "@testing-library/react",
  },

  REACT_RELATED_PACKAGES: [
    "react-router",
    "react-router-dom",
    "react-redux",
    "redux",
    "@reduxjs/toolkit",
    "antd",
    "@mui/material",
    "styled-components",
    "@emotion/react",
    "formik",
    "react-hook-form",
    "@tanstack/react-query",
    "swr",
  ],
};

const COLORS = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

// ============================================
// 工具函数
// ============================================

const colorize = (text, color) => `${COLORS[color] || ""}${text}${COLORS.reset}`;

const getVersion = (versionString) => {
  if (!versionString) return null;
  return versionString.replace(/^[\^~>=<]+/, "");
};

const getMajorVersion = (versionString) => {
  const version = getVersion(versionString);
  if (!version) return null;
  return parseInt(version.split(".")[0], 10);
};

// ============================================
// 文件操作
// ============================================

const readPackageJson = (projectPath) => {
  const pkgPath = path.join(projectPath, "package.json");

  if (!fs.existsSync(pkgPath)) {
    console.error("Error: package.json not found at", pkgPath);
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
};

const getAllDependencies = (pkg) => ({
  ...pkg.dependencies,
  ...pkg.devDependencies,
});

// ============================================
// 分析器 - React
// ============================================

const checkReactVersion = (deps) => {
  const reactVersion = deps["react"];
  if (!reactVersion) return { currentVersion: null, needsUpgrade: false };

  const currentVersion = getVersion(reactVersion);
  const major = getMajorVersion(reactVersion);

  return {
    currentVersion,
    needsUpgrade: major < 18,
  };
};

const findIncompatiblePackages = (deps) => {
  return CONFIG.REACT_18_INCOMPATIBLE.filter((pkg) => deps[pkg]).map((pkg) => ({
    name: pkg,
    version: deps[pkg],
    reason: "Not compatible with React 18",
  }));
};

const findRelatedPackages = (deps) => {
  return CONFIG.REACT_RELATED_PACKAGES.filter((pkg) => deps[pkg]).map((pkg) => ({
    name: pkg,
    version: deps[pkg],
  }));
};

const analyzeReact = (deps) => ({
  ...checkReactVersion(deps),
  incompatiblePackages: findIncompatiblePackages(deps),
  relatedPackages: findRelatedPackages(deps),
});

// ============================================
// 分析器 - Node
// ============================================

const readNvmrc = (projectPath) => {
  const nvmrcPath = path.join(projectPath, ".nvmrc");
  if (!fs.existsSync(nvmrcPath)) return null;
  return fs.readFileSync(nvmrcPath, "utf-8").trim();
};

const getEnginesNode = (pkg) => {
  return pkg.engines?.node || null;
};

const analyzeNode = (projectPath) => {
  const pkg = readPackageJson(projectPath);

  return {
    currentVersion: process.version,
    nvmrcVersion: readNvmrc(projectPath),
    enginesVersion: getEnginesNode(pkg),
  };
};

// ============================================
// 分析器 - 废弃包
// ============================================

const analyzeDeprecated = (deps) => {
  return CONFIG.DEPRECATED_PACKAGES.filter((pkg) => deps[pkg]).map((pkg) => ({
    name: pkg,
    version: deps[pkg],
    alternative: CONFIG.DEPRECATED_ALTERNATIVES[pkg] || "See npm for alternatives",
  }));
};

// ============================================
// 分析器 - 过期包
// ============================================

const runNpmOutdated = (projectPath) => {
  try {
    const output = execSync("npm outdated --json", {
      cwd: projectPath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output || "{}");
  } catch (e) {
    if (e.stdout) {
      try {
        return JSON.parse(e.stdout);
      } catch {
        return {};
      }
    }
    return {};
  }
};

const categorizeOutdatedPackage = (name, info) => {
  const currentMajor = getMajorVersion(info.current);
  const latestMajor = getMajorVersion(info.latest);

  if (currentMajor !== latestMajor) {
    return { type: "major", name, ...info };
  }

  const currentMinor = parseInt(getVersion(info.current).split(".")[1], 10);
  const latestMinor = parseInt(getVersion(info.latest).split(".")[1], 10);

  if (currentMinor !== latestMinor) {
    return { type: "minor", name, ...info };
  }

  return { type: "patch", name, ...info };
};

const analyzeOutdated = (projectPath) => {
  const outdated = runNpmOutdated(projectPath);
  const categorized = { major: [], minor: [], patch: [] };

  Object.entries(outdated).forEach(([name, info]) => {
    const result = categorizeOutdatedPackage(name, info);
    categorized[result.type].push(result);
  });

  return categorized;
};

// ============================================
// 报告打印
// ============================================

const printHeader = (projectPath) => {
  console.log(colorize("\n📦 Migration Analysis Report\n", "bold"));
  console.log("Project:", projectPath);
  console.log("Generated:", new Date().toISOString());
  console.log("\n" + "=".repeat(60) + "\n");
};

const printReactAnalysis = (results) => {
  console.log(colorize("🔵 React Analysis", "blue"));
  console.log("-".repeat(40));

  if (!results.currentVersion) {
    console.log("React not found in dependencies");
    return;
  }

  const status = results.needsUpgrade
    ? colorize("⚠️  Needs upgrade", "yellow")
    : colorize("✅ Up to date", "green");

  console.log(`Current version: ${results.currentVersion} ${status}`);

  if (results.needsUpgrade) {
    console.log(colorize("\nRecommendation: Upgrade to React 18", "yellow"));
  }

  if (results.incompatiblePackages.length > 0) {
    console.log(colorize("\n⚠️  Incompatible with React 18:", "red"));
    results.incompatiblePackages.forEach((pkg) => {
      console.log(`  - ${pkg.name}@${pkg.version}`);
    });
  }

  if (results.relatedPackages.length > 0) {
    console.log("\nRelated packages to check:");
    results.relatedPackages.forEach((pkg) => {
      console.log(`  - ${pkg.name}@${pkg.version}`);
    });
  }
};

const printNodeAnalysis = (results) => {
  console.log("\n" + colorize("🟢 Node.js Analysis", "green"));
  console.log("-".repeat(40));
  console.log(`Current Node.js: ${results.currentVersion}`);

  if (results.nvmrcVersion) {
    console.log(`.nvmrc: ${results.nvmrcVersion}`);
  }

  if (results.enginesVersion) {
    console.log(`package.json engines: ${results.enginesVersion}`);
  }
};

const printDeprecatedAnalysis = (results) => {
  console.log("\n" + colorize("🔴 Deprecated Packages", "red"));
  console.log("-".repeat(40));

  if (results.length === 0) {
    console.log("  No deprecated packages found");
    return;
  }

  results.forEach((pkg) => {
    console.log(`  - ${pkg.name}@${pkg.version}`);
    console.log(`    Alternative: ${pkg.alternative}`);
  });
};

const printOutdatedCategory = (packages, label, color, limit) => {
  if (packages.length === 0) return;

  console.log(colorize(`\n${label}:`, color));
  packages.slice(0, limit).forEach((pkg) => {
    console.log(`  ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
  });

  if (packages.length > limit) {
    console.log(`  ... and ${packages.length - limit} more`);
  }
};

const printOutdatedAnalysis = (results) => {
  console.log("\n" + colorize("📊 Outdated Packages", "yellow"));
  console.log("-".repeat(40));

  const total = results.major.length + results.minor.length + results.patch.length;

  if (total === 0) {
    console.log("  All packages are up to date");
    return;
  }

  console.log(`Found ${total} outdated packages`);

  printOutdatedCategory(results.major, "Major updates (review carefully)", "red", 10);
  printOutdatedCategory(results.minor, "Minor updates (usually safe)", "yellow", 5);

  if (results.patch.length > 0) {
    console.log(colorize("\nPatch updates (safe):", "green"));
    console.log(`  ${results.patch.length} packages have patch updates`);
  }
};

const printSummary = (reactResults, deprecatedResults) => {
  console.log("\n" + "=".repeat(60));
  console.log(colorize("\n📋 Summary & Recommendations\n", "bold"));

  const recommendations = [];

  if (reactResults.needsUpgrade) {
    recommendations.push("1. Upgrade React 16 → 18 (see guides/03-react-16-to-18.md)");
  }

  if (reactResults.incompatiblePackages.length > 0) {
    recommendations.push("2. Replace enzyme with @testing-library/react");
  }

  if (deprecatedResults.length > 0) {
    recommendations.push("3. Replace deprecated packages");
  }

  if (recommendations.length === 0) {
    console.log(colorize("✅ Project looks good!", "green"));
  } else {
    recommendations.forEach((rec) => console.log(rec));
  }

  console.log("\n");
};

// ============================================
// 主报告生成
// ============================================

const generateReport = (projectPath) => {
  printHeader(projectPath);

  const pkg = readPackageJson(projectPath);
  const deps = getAllDependencies(pkg);

  const reactResults = analyzeReact(deps);
  printReactAnalysis(reactResults);

  const nodeResults = analyzeNode(projectPath);
  printNodeAnalysis(nodeResults);

  const deprecatedResults = analyzeDeprecated(deps);
  printDeprecatedAnalysis(deprecatedResults);

  const outdatedResults = analyzeOutdated(projectPath);
  printOutdatedAnalysis(outdatedResults);

  printSummary(reactResults, deprecatedResults);
};

// ============================================
// CLI 命令处理
// ============================================

const parseArgs = (args) => {
  let projectPath = process.cwd();
  const pathIndex = args.indexOf("--path");

  if (pathIndex !== -1 && args[pathIndex + 1]) {
    projectPath = path.resolve(args[pathIndex + 1]);
  }

  return { projectPath, command: args[0] };
};

const showHelp = () => {
  console.log(`
Migration CLI - 项目迁移分析工具

Usage:
  node migrate-cli.js <command> [options]

Commands:
  analyze       分析项目并生成报告
  report        同 analyze
  check-react   检查 React 相关依赖 (JSON 输出)
  check-node    检查 Node.js 配置 (JSON 输出)
  help          显示帮助

Options:
  --path <dir>  指定项目路径 (默认当前目录)

Examples:
  node migrate-cli.js analyze
  node migrate-cli.js analyze --path /path/to/project
  node migrate-cli.js check-react --path ../my-app
  `);
};

const handleCommand = (command, projectPath) => {
  const pkg = readPackageJson(projectPath);
  const deps = getAllDependencies(pkg);

  const handlers = {
    analyze: () => generateReport(projectPath),
    report: () => generateReport(projectPath),
    "check-react": () => console.log(JSON.stringify(analyzeReact(deps), null, 2)),
    "check-node": () => console.log(JSON.stringify(analyzeNode(projectPath), null, 2)),
  };

  const handler = handlers[command];

  if (handler) {
    handler();
  } else {
    showHelp();
  }
};

// ============================================
// 入口
// ============================================

const main = () => {
  const args = process.argv.slice(2);
  const { command, projectPath } = parseArgs(args);
  handleCommand(command, projectPath);
};

main();
