import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync, spawn } from "node:child_process";

const packageDir = resolve(new URL("..", import.meta.url).pathname);
const tmpRoot = mkdtempSync(join(tmpdir(), "stitch-smoke-"));

function run(command, args, cwd, env = process.env) {
  const res = spawnSync(command, args, {
    cwd,
    env,
    stdio: "pipe",
    encoding: "utf8",
  });

  if (res.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed in ${cwd}\n${res.stdout}\n${res.stderr}`
    );
  }

  return res;
}

async function main() {
  try {
    run("npm", ["pack"], packageDir);
    const tarball = readdirSync(packageDir).find((f) => f.endsWith(".tgz"));
    if (!tarball) throw new Error("npm pack did not produce a tarball");

    run("npm", ["init", "-y"], tmpRoot);
    run("npm", ["install", join(packageDir, tarball)], tmpRoot);

    const binPath = join(tmpRoot, "node_modules", ".bin", "mcp-servers-za-stitch");
    const child = spawn(binPath, [], {
      cwd: tmpRoot,
      env: {
        ...process.env,
        STITCH_CLIENT_ID: "smoke-client-id",
        STITCH_CLIENT_SECRET: "smoke-client-secret",
      },
      stdio: "pipe",
    });

    await new Promise((r) => setTimeout(r, 1200));

    if (child.exitCode !== null && child.exitCode !== 0) {
      throw new Error(`Installed CLI exited early with code ${child.exitCode}`);
    }

    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));

    console.log("Smoke test passed: fresh install can start mcp-servers-za-stitch");
    rmSync(join(packageDir, tarball), { force: true });
    rmSync(tmpRoot, { recursive: true, force: true });
  } catch (err) {
    rmSync(tmpRoot, { recursive: true, force: true });
    throw err;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
