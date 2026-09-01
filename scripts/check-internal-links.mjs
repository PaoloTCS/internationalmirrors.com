import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");

const URL_ATTRIBUTES = new Set(["action", "cite", "data", "formaction", "href", "poster", "src"]);
const SRCSET_ATTRIBUTES = new Set(["srcset"]);
const HTML_EXTENSIONS = new Set([".html", ".htm"]);

const ATTRIBUTE_PATTERN =
  /\s(?:href|src|srcset|poster|action|cite|data|formaction|ping)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const STYLE_URL_PATTERN = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)"']+))\s*\)/gi;
const ID_PATTERN = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const ANCHOR_NAME_PATTERN = /<(?:a|area)\b[^>]*\sname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const BASE_HREF_PATTERN = /<base\b[^>]*\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

const ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function posixFromRepo(absPath) {
  return relative(root, absPath).split(sep).join("/");
}

function posixFromDist(absPath) {
  const rel = relative(dist, absPath).split(sep).join("/");
  return rel === "" ? "." : rel;
}

function isInsideDist(absPath) {
  const rel = relative(dist, absPath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolutePath(rel));
}

function isAbsolutePath(rel) {
  return rel.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(rel);
}

function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    }
    if (lower.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    }
    return ENTITY_MAP[lower] ?? match;
  });
}

function decodeHref(value) {
  const decoded = decodeEntities(value.trim());
  try {
    return decodeURI(decoded);
  } catch {
    return decoded;
  }
}

function decodeFragment(value) {
  const decoded = decodeEntities(value);
  try {
    return decodeURIComponent(decoded);
  } catch {
    return decoded;
  }
}

function lineNumberAt(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1;
    }
  }
  return line;
}

function maskKeepNewlines(block) {
  return block.replace(/[^\n]/g, " ");
}

function maskIgnoredRegions(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, maskKeepNewlines)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (block) => {
      const open = block.match(/^<script\b[^>]*>/i)?.[0] ?? "";
      const close = "</script>";
      const innerStart = open.length;
      const innerEnd = block.length - close.length;
      if (innerEnd <= innerStart) {
        return block;
      }
      return open + maskKeepNewlines(block.slice(innerStart, innerEnd)) + block.slice(innerEnd);
    })
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (block) => {
      const open = block.match(/^<style\b[^>]*>/i)?.[0] ?? "";
      const close = "</style>";
      const innerStart = open.length;
      const innerEnd = block.length - close.length;
      if (innerEnd <= innerStart) {
        return block;
      }
      return open + maskKeepNewlines(block.slice(innerStart, innerEnd)) + block.slice(innerEnd);
    });
}

function hasNonLocalScheme(href) {
  const trimmed = href.trim();
  if (trimmed.startsWith("//")) {
    return true;
  }
  const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  return Boolean(match);
}

function splitReference(href) {
  const trimmed = href.trim();
  let pathAndQuery = trimmed;
  let fragment = null;
  const hashIndex = trimmed.indexOf("#");
  if (hashIndex !== -1) {
    fragment = trimmed.slice(hashIndex + 1);
    pathAndQuery = trimmed.slice(0, hashIndex);
  }
  const queryIndex = pathAndQuery.indexOf("?");
  const path = queryIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, queryIndex);
  return { path, fragment };
}

function firstCapture(match) {
  return match[1] ?? match[2] ?? match[3] ?? "";
}

function extractAttributeReferences(html) {
  const references = [];
  ATTRIBUTE_PATTERN.lastIndex = 0;
  let match;
  while ((match = ATTRIBUTE_PATTERN.exec(html))) {
    const raw = match[0];
    const attrName = raw.match(/[a-zA-Z-]+/)[0].toLowerCase();
    const value = firstCapture(match);
    const valueIndex = match.index + raw.indexOf(value);
    if (attrName === "ping") {
      for (const token of value.trim().split(/\s+/).filter(Boolean)) {
        references.push({ attr: "ping", value: token, index: valueIndex });
      }
      continue;
    }
    if (SRCSET_ATTRIBUTES.has(attrName)) {
      for (const candidate of value.split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) {
          references.push({ attr: "srcset", value: url, index: valueIndex });
        }
      }
      continue;
    }
    if (URL_ATTRIBUTES.has(attrName)) {
      references.push({ attr: attrName, value, index: valueIndex });
    }
  }

  STYLE_URL_PATTERN.lastIndex = 0;
  while ((match = STYLE_URL_PATTERN.exec(html))) {
    const value = firstCapture(match).trim();
    if (value) {
      references.push({ attr: "style", value, index: match.index });
    }
  }

  return references;
}

function extractIds(html) {
  const ids = new Set();
  ID_PATTERN.lastIndex = 0;
  let match;
  while ((match = ID_PATTERN.exec(html))) {
    const id = decodeFragment(firstCapture(match).trim());
    if (id) {
      ids.add(id);
    }
  }
  ANCHOR_NAME_PATTERN.lastIndex = 0;
  while ((match = ANCHOR_NAME_PATTERN.exec(html))) {
    const name = decodeFragment(firstCapture(match).trim());
    if (name) {
      ids.add(name);
    }
  }
  return ids;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  const directories = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      directories.push(abs);
      const nested = await walk(abs);
      files.push(...nested.files);
      directories.push(...nested.directories);
    } else if (entry.isFile()) {
      files.push(abs);
    }
  }
  return { files, directories };
}

function inventorySet(paths) {
  return new Set(paths.map((abs) => posixFromDist(abs)));
}

function resolveLocalTarget(pageFile, hrefPath, baseHref) {
  const decodedPath = decodeHref(hrefPath);
  const fromDir = dirname(pageFile);
  let candidate;

  if (decodedPath === "") {
    candidate = pageFile;
  } else if (decodedPath.startsWith("/")) {
    candidate = resolve(dist, `.${decodedPath}`);
  } else if (baseHref) {
    const baseDir = baseHref.endsWith("/") ? baseHref : dirname(baseHref) + "/";
    candidate = resolve(fromDir, baseDir, decodedPath);
  } else {
    candidate = resolve(fromDir, decodedPath);
  }

  return candidate;
}

function classifyTarget(absPath, files, directories) {
  if (!isInsideDist(absPath)) {
    return { ok: false, reason: "escapes dist/", target: posixFromRepo(absPath) };
  }

  const rel = posixFromDist(absPath);
  if (files.has(rel)) {
    return { ok: true, kind: "file", target: join(dist, rel) };
  }
  if (directories.has(rel) || rel === ".") {
    const indexRel = rel === "." ? "index.html" : `${rel}/index.html`;
    if (files.has(indexRel)) {
      return { ok: true, kind: "directory-index", target: join(dist, indexRel) };
    }
    return {
      ok: false,
      reason: "directory has no index.html",
      target: posixFromRepo(rel === "." ? dist : join(dist, rel)),
    };
  }

  return { ok: false, reason: "missing", target: posixFromRepo(absPath) };
}

function isHtmlFile(absPath) {
  return HTML_EXTENSIONS.has(extname(absPath).toLowerCase());
}

async function main() {
  let distStat;
  try {
    distStat = await stat(dist);
  } catch {
    console.error("error: dist/ was not found. Run `npm run build` before checking links.");
    process.exitCode = 1;
    return;
  }

  if (!distStat.isDirectory()) {
    console.error("error: dist/ exists but is not a directory.");
    process.exitCode = 1;
    return;
  }

  const tree = await walk(dist);
  const files = inventorySet(tree.files);
  const directories = inventorySet(tree.directories);
  const htmlPages = tree.files.filter(isHtmlFile).sort((a, b) => a.localeCompare(b));

  if (htmlPages.length === 0) {
    console.error("error: no HTML pages were found in dist/.");
    process.exitCode = 1;
    return;
  }

  const idCache = new Map();
  const errors = [];
  let checked = 0;
  let skipped = 0;

  async function idsFor(absPath) {
    if (!idCache.has(absPath)) {
      const source = await readFile(absPath, "utf8");
      idCache.set(absPath, extractIds(maskIgnoredRegions(source)));
    }
    return idCache.get(absPath);
  }

  for (const page of htmlPages) {
    const source = await readFile(page, "utf8");
    const masked = maskIgnoredRegions(source);
    idCache.set(page, extractIds(masked));
    const baseMatch = BASE_HREF_PATTERN.exec(masked);
    const baseHref = baseMatch ? decodeHref(firstCapture(baseMatch)) : "";
    const localBase = baseHref && !hasNonLocalScheme(baseHref) ? baseHref : "";

    for (const reference of extractAttributeReferences(masked)) {
      const raw = reference.value.trim();
      if (raw === "") {
        skipped += 1;
        continue;
      }
      if (hasNonLocalScheme(raw) || (localBase === "" && hasNonLocalScheme(baseHref))) {
        skipped += 1;
        continue;
      }

      checked += 1;
      const { path, fragment } = splitReference(raw);
      const resolved = resolveLocalTarget(page, path, localBase);
      const found = classifyTarget(resolved, files, directories);
      const location = `${posixFromRepo(page)}:${lineNumberAt(source, reference.index)}`;

      if (!found.ok) {
        errors.push(`${location}  ${reference.attr}="${raw}"\n  ${found.reason}: ${found.target}`);
        continue;
      }

      if (fragment === null || fragment === "") {
        continue;
      }
      if (!isHtmlFile(found.target)) {
        errors.push(
          `${location}  ${reference.attr}="${raw}"\n  fragment targets a non-HTML file: ${posixFromRepo(found.target)}`
        );
        continue;
      }

      const ids = await idsFor(found.target);
      const decodedFragment = decodeFragment(fragment);
      if (!ids.has(decodedFragment)) {
        errors.push(
          `${location}  ${reference.attr}="${raw}"\n  missing fragment #${decodedFragment} in ${posixFromRepo(found.target)}`
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error(
      `Checked ${htmlPages.length} HTML pages in dist/ (${checked} local links, ${skipped} skipped).`
    );
    console.error(`${errors.length} broken internal link${errors.length === 1 ? "" : "s"}:\n`);
    console.error(errors.join("\n\n"));
    process.exitCode = 1;
    return;
  }

  console.log(
    `Checked ${htmlPages.length} HTML pages in dist/ (${checked} local links, ${skipped} skipped). OK`
  );
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
}
