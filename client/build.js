import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function copyDir(src, dest) {
  // Create destination directory
  mkdirSync(dest, { recursive: true });

  // Read directory contents
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Copy dist folder to server
const distPath = resolve(__dirname, "dist");
const serverDistPath = resolve(__dirname, "../server/dist");

try {
  copyDir(distPath, serverDistPath);
  console.log("Successfully copied build files to server directory");
} catch (error) {
  console.error("Error copying build files:", error);
  process.exit(1);
}
