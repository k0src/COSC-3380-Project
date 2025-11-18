#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentName = process.argv[2];
const relativePath = process.argv[3];

if (!componentName) {
  process.exit(1);
}

const actualCwd = process.env.INIT_CWD || process.cwd();

let targetDir, finalComponentName;

if (relativePath) {
  // If path is provided, use it as the directory
  targetDir = path.resolve(actualCwd, relativePath);
  finalComponentName = componentName;
} else {
  // If no path, check if componentName contains path separators
  const parts = componentName.split(/[/\\]/);
  if (parts.length > 1) {
    // componentName contains a path like "UserPage/UserPlaylists"
    finalComponentName = parts[parts.length - 1];
    const pathParts = parts.slice(0, -1).join(path.sep);
    targetDir = path.resolve(actualCwd, pathParts);
  } else {
    // Just a simple component name
    targetDir = actualCwd;
    finalComponentName = componentName;
  }
}

const componentDir = path.join(targetDir, finalComponentName);

console.log("Creating component at:", componentDir);

fs.mkdirSync(componentDir, { recursive: true });

const tsxFile = path.join(componentDir, `${finalComponentName}.tsx`);
const cssFile = path.join(componentDir, `${finalComponentName}.module.css`);

fs.writeFileSync(tsxFile, "");
fs.writeFileSync(cssFile, "");
