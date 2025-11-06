import { execSync } from "child_process";
import fs from "fs";
import path from "path";

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

// Build server
run("npm install", serverDir);
run("npm run build", serverDir);

// Build client
run("npm install --legacy-peer-deps", clientDir);
run("npm run build", clientDir);

// Copy client /dist/ to server /public/
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.cpSync(path.join(clientDir, "dist"), publicDir, { recursive: true });

// Create version file
try {
  const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
  const versionFile = path.join(publicDir, "version.json");
  fs.writeFileSync(
    versionFile,
    JSON.stringify({ version: commitHash }, null, 2)
  );
  console.log("\nCreated version.json with commit hash:", commitHash);
} catch (error) {
  console.error("Failed to create version.json:", error);
}

// Prepare server package.json for deployment
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

// Install production dependencies in server/dist
run("npm install --omit=dev", serverDist);

console.log("\nserver/dist built successfully");
