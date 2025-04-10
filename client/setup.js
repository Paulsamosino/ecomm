import { execSync } from "child_process";
import { renameSync } from "fs";

// Components to install
const components = ["button", "card", "input", "label"];

console.log("🚀 Setting up PoultryMart frontend...\n");

try {
  // Install dependencies
  console.log("📦 Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Dependencies installed successfully!\n");

  // Initialize Shadcn UI
  console.log("🎨 Initializing Shadcn UI...");
  execSync("npx shadcn-ui@latest init", { stdio: "inherit" });
  console.log("✅ Shadcn UI initialized successfully!\n");

  // Install Shadcn UI components
  console.log("🎨 Installing Shadcn UI components...");
  components.forEach((component) => {
    console.log(`Installing ${component}...`);
    execSync(`npx shadcn-ui@latest add ${component} --yes`, {
      stdio: "inherit",
    });
  });
  console.log("✅ Shadcn UI components installed successfully!\n");

  // Rename configuration files to use .cjs extension if they exist
  console.log("🔧 Fixing configuration files...");
  try {
    renameSync("postcss.config.js", "postcss.config.cjs");
    console.log("✅ Renamed postcss.config.js to postcss.config.cjs");
  } catch (err) {
    // File might already be renamed or not exist
  }

  try {
    renameSync("tailwind.config.js", "tailwind.config.cjs");
    console.log("✅ Renamed tailwind.config.js to tailwind.config.cjs");
  } catch (err) {
    // File might already be renamed or not exist
  }

  console.log("\n🎉 Setup completed successfully!");
  console.log("\nYou can now run the development server with:");
  console.log("\nnpm run dev\n");
} catch (error) {
  console.error("❌ An error occurred during setup:", error);
  process.exit(1);
}
