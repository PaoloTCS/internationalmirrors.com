import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

function metaAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
}

function isNoindexContent(content) {
  const tokens = content
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  return tokens.includes("noindex") || tokens.includes("none");
}

function countEffectiveNoindex(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  let count = 0;
  for (const tag of tags) {
    if (metaAttribute(tag, "name").toLowerCase() !== "robots") {
      continue;
    }
    if (isNoindexContent(metaAttribute(tag, "content"))) {
      count += 1;
    }
  }
  return count;
}

function hasEffectiveNoindex(html) {
  return countEffectiveNoindex(html) > 0;
}

function injectNoindex(html) {
  const head = html.match(/<head\b[^>]*>/i);
  const tag = '<meta name="robots" content="noindex" />';
  if (head) {
    const after = head.index + head[0].length;
    const following = html.slice(after);
    const indentMatch = following.match(/^(\r?\n)([ \t]*)/);
    const newline = indentMatch ? indentMatch[1] : html.includes("\r\n") ? "\r\n" : "\n";
    const indent = indentMatch ? indentMatch[2] : "    ";
    return html.slice(0, after) + `${newline}${indent}${tag}` + html.slice(after);
  }
  const htmlTag = html.match(/<html\b[^>]*>/i);
  if (htmlTag) {
    const after = htmlTag.index + htmlTag[0].length;
    const newline = html.includes("\r\n") ? "\r\n" : "\n";
    return `${html.slice(0, after)}${newline}<head>${newline}  ${tag}${newline}</head>${html.slice(after)}`;
  }
  return `${tag}\n${html}`;
}

async function walkHtml(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of dirents.sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkHtml(abs)));
    } else if (/\.html?$/i.test(entry.name)) {
      files.push(abs);
    }
  }
  return files;
}

async function applyArchiveNoindex(archiveDir) {
  const pages = await walkHtml(archiveDir);
  let injected = 0;
  let preserved = 0;
  for (const page of pages) {
    const original = await readFile(page, "utf8");
    if (hasEffectiveNoindex(original)) {
      preserved += 1;
      continue;
    }
    await writeFile(page, injectNoindex(original));
    injected += 1;
  }
  return { injected, preserved, total: pages.length };
}

async function main() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });

  for (const entry of entries) {
    await cp(resolve(root, entry), resolve(output, entry), { recursive: true });
  }

  const archive = await applyArchiveNoindex(resolve(output, "archive"));
  console.log(`Built ${entries.length} site entries in ${output}`);
  console.log(
    `Archive noindex: ${archive.injected} injected, ${archive.preserved} already present, ${archive.total} HTML pages`
  );
}

const isDirectRun =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  }
}

export {
  applyArchiveNoindex,
  countEffectiveNoindex,
  hasEffectiveNoindex,
  injectNoindex,
  output as dist,
  root,
  walkHtml,
};
