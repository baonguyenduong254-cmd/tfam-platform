import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
// Keep one live handle while awaiting Vite's complete multi-environment build.
// Some native bundler tasks use unreferenced handles during chunk rendering.
if (!managedLinux && command === 'build') {
  const watchdog = setTimeout(() => {
    console.error('Production build exceeded three minutes.');
    process.exit(1);
  }, 180_000);
  try {
    process.env.NODE_ENV ||= 'production';
    const { createBuilder } = await import('vite');
    const modeIndex = args.indexOf('--mode');
    const builder = await createBuilder({ mode: modeIndex >= 0 ? args[modeIndex + 1] : 'production' }, false);
    await builder.buildApp();
    const { accessSync } = await import('node:fs');
    for (const output of ['dist/server/index.js', 'dist/server/wrangler.json', 'dist/client/.vite/manifest.json']) {
      accessSync(fileURLToPath(new URL('../' + output, import.meta.url)));
    }
    console.log('Build complete.');
  } finally {
    clearTimeout(watchdog);
  }
} else {
  await import(cli.href);
}
