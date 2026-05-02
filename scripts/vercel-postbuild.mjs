import { mkdir, copyFile, writeFile, readdir, stat, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const out = join(root, ".vercel", "output");

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const info = await stat(srcPath);
    if (info.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

// Clean previous output
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

// 1. Copy static client assets
const staticDir = join(out, "static");
await copyDir(join(root, "dist", "client"), staticDir);
console.log("✓ Copied dist/client → .vercel/output/static");

// 2. Bundle the server and all npm deps into a single self-contained CJS file.
//    CJS avoids ESM/require interop issues and import.meta.url problems.
const funcDir = join(out, "functions", "index.func");
await mkdir(funcDir, { recursive: true });

console.log("⏳ Bundling server with esbuild...");
await build({
  entryPoints: [join(root, "dist", "server", "server.js")],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: join(funcDir, "server.cjs"),
  external: ["node:*"],
  allowOverwrite: true,
  minify: false,
  logLevel: "warning",
});
console.log("✓ Bundled server → .vercel/output/functions/index.func/server.cjs");

// 3. Write the CJS handler
const handlerCode = `
"use strict";
const app = require("./server.cjs");

module.exports = async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const url = new URL(req.url, proto + "://" + host);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }

  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  const request = new Request(url.toString(), { method: req.method, headers, body });
  const response = await app.default.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));

  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
};
`;

await writeFile(join(funcDir, "handler.cjs"), handlerCode.trimStart());
console.log("✓ Wrote handler.cjs");

// 4. Write .vc-config.json
const vcConfig = {
  runtime: "nodejs22.x",
  handler: "handler.cjs",
  launcherType: "Nodejs",
};
await writeFile(join(funcDir, ".vc-config.json"), JSON.stringify(vcConfig, null, 2));
console.log("✓ Wrote .vc-config.json");

// 5. Write routing config — static assets served directly, everything else → SSR
const config = {
  version: 3,
  routes: [
    {
      src: "^/assets/(.*)$",
      headers: { "cache-control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/" },
  ],
};
await writeFile(join(out, "config.json"), JSON.stringify(config, null, 2));
console.log("✓ Wrote config.json");

console.log("\n✅ Vercel output ready at .vercel/output/");
