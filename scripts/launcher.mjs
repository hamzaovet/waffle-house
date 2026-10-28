import { spawn } from "child_process";
import { createServer } from "net";
import { exec } from "child_process";

const PORT = 3080;
const APP_DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

function checkPort(port) {
  return new Promise((resolve) => {
    // Check both IPv4 and IPv6
    const srv = createServer();
    srv.once("error", () => resolve(false)); // port in use → false
    srv.once("listening", () => { srv.close(); resolve(true); }); // port free → true
    srv.listen(port); // listen on all interfaces (catches :: and 0.0.0.0)
  });
}

async function openBrowser(url) {
  await new Promise((r) => setTimeout(r, 4000));
  const cmd = process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`;
  exec(cmd);
}

async function main() {
  console.log("🧇 Waffle House Desserts ERP — Launcher");
  console.log("=======================================");
  console.log("🚀 Powered by Orca Cloud Solutions (01018671000)");
  console.log(`📁 App: ${APP_DIR}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log("");

  const portFree = await checkPort(PORT);
  if (!portFree) {
    console.log(`\n✅ السيرفر شغال بالفعل على البورت ${PORT}!`);
    console.log(`🌐 بيفتح المتصفح...`);
    exec(`start "" "http://localhost:${PORT}"`);
    console.log(`\n   http://localhost:${PORT}`);
    console.log(`   http://localhost:${PORT}/login  ← دخول الموظفين`);
    setTimeout(() => process.exit(0), 1500);
    return;
  }

  console.log("🚀 Starting Next.js server...");

  const child = spawn("npm", ["run", "dev"], {
    cwd: APP_DIR,
    shell: true,
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  openBrowser(`http://localhost:${PORT}`);

  child.on("error", (err) => { console.error("Failed to start:", err); });
  child.on("exit", (code) => { console.log(`Server exited: ${code}`); });

  process.on("SIGINT", () => { child.kill(); process.exit(); });
}

main();
