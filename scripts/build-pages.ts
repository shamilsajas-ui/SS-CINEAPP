import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rootDir = process.cwd();
const appApiDir = path.join(rootDir, "app", "api");
const tempApiDir = path.join(rootDir, "app_api_backup");
const outDir = path.join(rootDir, "out");

console.log("🚀 Starting GitHub Pages Static Build Preparation...");

let apiMoved = false;

try {
  // 1. Temporarily move app/api out of app/ so Next.js static export succeeds
  if (fs.existsSync(appApiDir)) {
    console.log("📦 Stashing backend API routes for static compilation...");
    fs.renameSync(appApiDir, tempApiDir);
    apiMoved = true;
  }

  // 2. Execute Next.js Build with STATIC_EXPORT and basePath set
  console.log("⚡ Compiling Next.js static export bundle (basePath: /SS-CINEAPP)...");
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "true",
      NEXT_PUBLIC_BASE_PATH: "/SS-CINEAPP",
    },
  });

  // 3. Create .nojekyll in ./out so GitHub Pages does not ignore _next assets
  const noJekyllPath = path.join(outDir, ".nojekyll");
  fs.writeFileSync(noJekyllPath, "");
  console.log("✅ Created .nojekyll file in ./out");

  // 4. Ensure 404.html exists for SPA fallback routing
  const indexHtml = path.join(outDir, "index.html");
  const fallback404 = path.join(outDir, "404.html");
  if (fs.existsSync(indexHtml) && !fs.existsSync(fallback404)) {
    fs.copyFileSync(indexHtml, fallback404);
    console.log("✅ Created 404.html for GitHub Pages client-side routing");
  }

  console.log("🎉 GitHub Pages build completed successfully in ./out!");
} catch (err) {
  console.error("❌ Build error:", err);
  process.exitCode = 1;
} finally {
  // Always restore app/api back
  if (apiMoved && fs.existsSync(tempApiDir)) {
    console.log("🔄 Restoring backend API routes...");
    fs.renameSync(tempApiDir, appApiDir);
  }
}
