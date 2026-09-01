import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = resolve(root, "dist");
const entries = [
  "index.html",
  "styles.css",
  "CNAME",
  "robots.txt",
  "sitemap.xml",
  "research",
  "protocols",
  "responses",
  "results",
  "notes",
  "archive",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of entries) {
  await cp(resolve(root, entry), resolve(output, entry), { recursive: true });
}

console.log(`Built ${entries.length} site entries in ${output}`);
