import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const MAJOR_VERSION = 2;
const VERSION_FILE = path.join(process.cwd(), "build-version.json");

let minorVersion = 41;
if (fs.existsSync(VERSION_FILE)) {
  try {
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, "utf-8"));
    minorVersion = versionData.minor || 41;
  } catch (error) {
    console.log("Could not read version file, starting from 41");
  }
}

minorVersion++;
const BUILD_VERSION = `v${MAJOR_VERSION}.${minorVersion}`;

fs.writeFileSync(
  VERSION_FILE,
  JSON.stringify({ major: MAJOR_VERSION, minor: minorVersion }, null, 2)
);

const rootDir = process.cwd();
const serverDir = path.join(rootDir, "server");
const clientDir = path.join(rootDir, "client");
const serverDist = path.join(serverDir, "dist");
const publicDir = path.join(serverDist, "public");
const serverPkg = path.join(serverDir, "package.json");
const distPkg = path.join(serverDist, "package.json");

const run = (cmd, cwd = rootDir) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
};

run("npm install", serverDir);
run("npm run build", serverDir);

run("npm install --legacy-peer-deps", clientDir);
run("npm run build", clientDir);

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(path.join(clientDir, "dist"), publicDir, { recursive: true });

const pkgContent = JSON.parse(fs.readFileSync(serverPkg, "utf-8"));
const deployPkg = {
  name: pkgContent.name,
  version: pkgContent.version,
  type: "module",
  main: "server.js",
  scripts: { start: "node server.js" },
  dependencies: pkgContent.dependencies || {},
};

fs.writeFileSync(distPkg, JSON.stringify(deployPkg, null, 2));

const buildInfoPath = path.join(publicDir, "build-info.json");
fs.writeFileSync(
  buildInfoPath,
  JSON.stringify({ version: BUILD_VERSION }, null, 2)
);

run("npm install --omit=dev", serverDist);

console.log(`\nserver/dist built successfully - ${BUILD_VERSION}`);
