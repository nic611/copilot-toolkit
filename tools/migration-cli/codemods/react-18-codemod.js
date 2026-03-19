#!/usr/bin/env node

/**
 * React 18 Codemod
 *
 * 自动转换 React 16/17 代码到 React 18
 * 优化: 拆分函数降低 complexity
 */

const fs = require("fs");
const path = require("path");

// ============================================
// 配置
// ============================================

const CONFIG = {
  FILE_EXTENSIONS: [".js", ".jsx", ".ts", ".tsx"],
  SKIP_DIRS: ["node_modules", ".git", "dist", "build", "coverage"],
  ENTRY_NAMES: [
    "index.js",
    "index.jsx",
    "index.ts",
    "index.tsx",
    "main.js",
    "main.jsx",
    "main.ts",
    "main.tsx",
  ],
};

const COLORS = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

// ============================================
// 转换规则
// ============================================

const createRenderTransform = () => ({
  name: "ReactDOM.render to createRoot",
  description: "将 ReactDOM.render 转换为 createRoot",
  pattern:
    /ReactDOM\.render\(\s*(<[^>]+>[\s\S]*?),\s*document\.getElementById\(['"]([^'"]+)['"]\)\s*\);?/g,
  replacement: (match, component, rootId) => {
    const trimmedComponent = component.trim();
    return `const container = document.getElementById('${rootId}');\nconst root = createRoot(container);\nroot.render(${trimmedComponent});`;
  },
  importChange: {
    from: "import ReactDOM from 'react-dom'",
    to: "import { createRoot } from 'react-dom/client'",
  },
});

const createHydrateTransform = () => ({
  name: "ReactDOM.hydrate to hydrateRoot",
  description: "将 ReactDOM.hydrate 转换为 hydrateRoot",
  pattern:
    /ReactDOM\.hydrate\(\s*(<[^>]+>[\s\S]*?),\s*document\.getElementById\(['"]([^'"]+)['"]\)\s*\);?/g,
  replacement: (match, component, rootId) => {
    const trimmedComponent = component.trim();
    return `hydrateRoot(document.getElementById('${rootId}'), ${trimmedComponent});`;
  },
  importChange: {
    from: "import ReactDOM from 'react-dom'",
    to: "import { hydrateRoot } from 'react-dom/client'",
  },
});

const TRANSFORMATIONS = [createRenderTransform(), createHydrateTransform()];

// ============================================
// 工具函数
// ============================================

const colorize = (text, color) => `${COLORS[color] || ""}${text}${COLORS.reset}`;

const shouldSkipDir = (dirName) => CONFIG.SKIP_DIRS.includes(dirName);

const isValidExtension = (filePath) => {
  const ext = path.extname(filePath);
  return CONFIG.FILE_EXTENSIONS.includes(ext);
};

// ============================================
// 文件操作
// ============================================

const getAllFiles = (dir, files = []) => {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !shouldSkipDir(item)) {
      getAllFiles(fullPath, files);
    } else if (isValidExtension(item)) {
      files.push(fullPath);
    }
  });

  return files;
};

const findEntryFilesInDir = (dir, entryNames) => {
  return entryNames
    .map((name) => path.join(dir, name))
    .filter((filePath) => fs.existsSync(filePath));
};

const findEntryFiles = (dir) => {
  const srcDir = path.join(dir, "src");
  const entryFiles = [];

  if (fs.existsSync(srcDir)) {
    entryFiles.push(...findEntryFilesInDir(srcDir, CONFIG.ENTRY_NAMES));
  }

  entryFiles.push(...findEntryFilesInDir(dir, CONFIG.ENTRY_NAMES));

  return entryFiles;
};

// ============================================
// 转换逻辑
// ============================================

const applyTransform = (content, transform) => {
  // 重置 lastIndex
  transform.pattern.lastIndex = 0;

  if (!transform.pattern.test(content)) {
    return { content, applied: false };
  }

  // 重置后再替换
  transform.pattern.lastIndex = 0;
  let newContent = content.replace(transform.pattern, transform.replacement);

  // 处理 import 变化
  if (transform.importChange) {
    newContent = newContent.replace(transform.importChange.from, transform.importChange.to);
  }

  return { content: newContent, applied: true };
};

const transformContent = (content) => {
  let currentContent = content;
  const appliedChanges = [];

  TRANSFORMATIONS.forEach((transform) => {
    const result = applyTransform(currentContent, transform);

    if (result.applied) {
      currentContent = result.content;
      appliedChanges.push(transform.name);
    }
  });

  return {
    content: currentContent,
    modified: appliedChanges.length > 0,
    changes: appliedChanges,
  };
};

const transformFile = (filePath, dryRun = false) => {
  const originalContent = fs.readFileSync(filePath, "utf-8");
  const result = transformContent(originalContent);

  if (result.modified && !dryRun) {
    fs.writeFileSync(filePath, result.content, "utf-8");
  }

  return {
    modified: result.modified,
    changes: result.changes,
  };
};

// ============================================
// 结果输出
// ============================================

const printFileResult = (relativePath, changes) => {
  console.log(colorize(`✓ ${relativePath}`, "green"));
  changes.forEach((change) => {
    console.log(`  - ${change}`);
  });
};

const printSummary = (modifiedCount, dryRun) => {
  console.log("\n" + "-".repeat(50));
  console.log(colorize("\n📊 Summary\n", "bold"));

  if (modifiedCount === 0) {
    console.log("No files needed modification.");
    console.log("Your code might already be React 18 compatible, or uses a different pattern.");
    return;
  }

  const action = dryRun ? "Would modify" : "Modified";
  console.log(`${action}: ${modifiedCount} file(s)`);

  if (dryRun) {
    console.log(
      colorize("\nThis was a dry run. Run without --dry-run to apply changes.", "yellow"),
    );
  } else {
    console.log(colorize("\n✅ Changes applied successfully!", "green"));
    console.log("\nNext steps:");
    console.log("1. Review the changes");
    console.log("2. Run your tests");
    console.log("3. Check for any remaining manual migrations");
  }
};

const processFiles = (files, targetDir, dryRun) => {
  let modifiedCount = 0;

  files.forEach((file) => {
    const result = transformFile(file, dryRun);

    if (result.modified) {
      modifiedCount++;
      const relativePath = path.relative(targetDir, file);
      printFileResult(relativePath, result.changes);
    }
  });

  return modifiedCount;
};

// ============================================
// CLI 参数解析
// ============================================

const parseArgs = (args) => {
  const result = {
    targetDir: null,
    dryRun: false,
    entryOnly: false,
    showHelp: false,
  };

  args.forEach((arg) => {
    if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--entry-only") {
      result.entryOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      result.showHelp = true;
    } else if (!arg.startsWith("-")) {
      result.targetDir = path.resolve(arg);
    }
  });

  return result;
};

const showHelp = () => {
  console.log(`
React 18 Codemod

自动转换 React 16/17 代码到 React 18

Usage:
  node react-18-codemod.js <directory> [options]

Options:
  --dry-run     只显示会做的改动，不实际修改文件
  --entry-only  只转换入口文件
  --help, -h    显示帮助

Examples:
  node react-18-codemod.js ./src
  node react-18-codemod.js ./src --dry-run
  node react-18-codemod.js . --entry-only
  `);
};

// ============================================
// 主函数
// ============================================

const validateTargetDir = (targetDir) => {
  if (!targetDir) {
    return false;
  }

  if (!fs.existsSync(targetDir)) {
    console.error(colorize(`Error: Directory not found: ${targetDir}`, "red"));
    return false;
  }

  return true;
};

const getFilesToProcess = (targetDir, entryOnly) => {
  if (entryOnly) {
    const files = findEntryFiles(targetDir);
    console.log(`Found ${files.length} entry file(s)\n`);
    return files;
  }

  const files = getAllFiles(targetDir);
  console.log(`Found ${files.length} file(s) to process\n`);
  return files;
};

const printHeader = (targetDir, dryRun) => {
  console.log(colorize("\n🔄 React 18 Codemod\n", "bold"));
  console.log(`Target: ${targetDir}`);
  console.log(`Mode: ${dryRun ? "Dry Run (no changes)" : "Apply Changes"}`);
  console.log("\n" + "-".repeat(50) + "\n");
};

const main = () => {
  const args = process.argv.slice(2);
  const { targetDir, dryRun, entryOnly, showHelp: needHelp } = parseArgs(args);

  if (needHelp || !targetDir) {
    showHelp();
    process.exit(needHelp ? 0 : 1);
  }

  if (!validateTargetDir(targetDir)) {
    process.exit(1);
  }

  printHeader(targetDir, dryRun);

  const files = getFilesToProcess(targetDir, entryOnly);
  const modifiedCount = processFiles(files, targetDir, dryRun);

  printSummary(modifiedCount, dryRun);
  console.log("\n");
};

main();
