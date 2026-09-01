import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const SITE_ORIGIN = "https://internal-link-check.invalid";

const URL_ATTRIBUTES = new Set(["action", "cite", "data", "formaction", "href", "poster", "src"]);
const SRCSET_ATTRIBUTES = new Set(["srcset"]);
const HTML_EXTENSIONS = new Set([".html", ".htm"]);

const ATTRIBUTE_PATTERN =
  /\s(?:href|src|srcset|poster|action|cite|data|formaction|ping)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const STYLE_URL_PATTERN = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)"']+))\s*\)/gi;
const ID_PATTERN = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const ANCHOR_NAME_PATTERN = /<(?:a|area)\b[^>]*\sname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const BASE_HREF_PATTERN = /<base\b[^>]*\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const BASE_TAG_PATTERN = /<base\b[^>]*>/gi;

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

function firstCapture(match) {
  return match[1] ?? match[2] ?? match[3] ?? "";
}

function extractBaseHref(html) {
  const match = html.match(BASE_HREF_PATTERN);
  return match ? decodeEntities(firstCapture(match).trim()) : "";
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

function documentUrlFor(pageFile) {
  const rel = posixFromDist(pageFile);
  const pathname = rel === "." ? "/" : `/${rel}`;
  return new URL(pathname, SITE_ORIGIN);
}

function mapPathnameToDist(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }
  const relativePath = decoded.replace(/^\/+/, "");
  const candidate = relativePath === "" ? dist : resolve(dist, relativePath);
  if (!isInsideDist(candidate)) {
    return { ok: false, reason: "escapes dist/", target: posixFromRepo(candidate) };
  }
  return { ok: true, filePath: candidate };
}

/**
 * Resolve an href against the page URL and optional local <base href> using
 * browser URL semantics, then map the pathname into dist/.
 *
 * External hrefs and genuinely external base URLs are skipped. Root-relative
 * bases such as "/" and "/research/" are same-origin site paths, not filesystem
 * roots.
 */
function resolveLocalTarget(pageFile, href, baseHref = "") {
  const trimmedHref = decodeEntities(href.trim());
  if (trimmedHref === "") {
    return { type: "skip", reason: "empty" };
  }

  const documentUrl = documentUrlFor(pageFile);
  const siteOrigin = new URL(SITE_ORIGIN).origin;
  let baseUrl = documentUrl;

  if (baseHref) {
    try {
      baseUrl = new URL(decodeEntities(baseHref.trim()), documentUrl);
    } catch {
      return { type: "error", reason: "invalid base URL", target: baseHref };
    }
  }

  if (baseUrl.origin !== siteOrigin) {
    return { type: "skip", reason: "external-base" };
  }

  let resolved;
  try {
    resolved = new URL(trimmedHref, baseUrl);
  } catch {
    return { type: "error", reason: "invalid URL", target: trimmedHref };
  }

  if (resolved.origin !== siteOrigin) {
    return { type: "skip", reason: "external" };
  }

  const mapped = mapPathnameToDist(resolved.pathname);
  if (!mapped.ok) {
    return { type: "error", reason: mapped.reason, target: mapped.target };
  }

  const hash = resolved.hash.startsWith("#") ? resolved.hash.slice(1) : resolved.hash;
  return {
    type: "ok",
    filePath: mapped.filePath,
    fragment: hash === "" ? null : decodeFragment(hash),
  };
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
    const baseHref = extractBaseHref(masked);
    const forLinks = masked.replace(BASE_TAG_PATTERN, maskKeepNewlines);

    for (const reference of extractAttributeReferences(forLinks)) {
      const raw = reference.value.trim();
      const resolved = resolveLocalTarget(page, raw, baseHref);
      const location = `${posixFromRepo(page)}:${lineNumberAt(source, reference.index)}`;

      if (resolved.type === "skip") {
        skipped += 1;
        continue;
      }

      checked += 1;
      if (resolved.type === "error") {
        errors.push(
          `${location}  ${reference.attr}="${raw}"\n  ${resolved.reason}: ${resolved.target}`
        );
        continue;
      }

      const found = classifyTarget(resolved.filePath, files, directories);
      if (!found.ok) {
        errors.push(`${location}  ${reference.attr}="${raw}"\n  ${found.reason}: ${found.target}`);
        continue;
      }

      if (resolved.fragment === null || resolved.fragment === "") {
        continue;
      }
      if (!isHtmlFile(found.target)) {
        errors.push(
          `${location}  ${reference.attr}="${raw}"\n  fragment targets a non-HTML file: ${posixFromRepo(found.target)}`
        );
        continue;
      }

      const ids = await idsFor(found.target);
      if (!ids.has(resolved.fragment)) {
        errors.push(
          `${location}  ${reference.attr}="${raw}"\n  missing fragment #${resolved.fragment} in ${posixFromRepo(found.target)}`
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

export { dist, resolveLocalTarget, SITE_ORIGIN };
