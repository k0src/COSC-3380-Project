import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const serverDist = path.join(rootDir, "server/dist");
const clientDist = path.join(rootDir, "client/dist");
const publicDir = path.join(serverDist, "public");
const serverPkg = path.join(rootDir, "server/package.json");
const distPkg = path.join(serverDist, "package.json");

try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.cpSync(clientDist, publicDir, { recursive: true });

  fs.copyFileSync(serverPkg, distPkg);

  console.log("Build succeeded:", serverDist);
} catch (error) {
  console.error("Build failed", error);
  process.exit(1);
}
