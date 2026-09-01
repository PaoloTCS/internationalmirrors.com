import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const SITE_ORIGIN = "https://internationalmirrors.com";

const PAGE_TYPES = {
  "/": "website",
  "/research/": "website",
  "/protocols/": "website",
  "/protocols/im-swarm-001.html": "article",
  "/responses/": "website",
  "/results/": "website",
  "/notes/swarmworld-2026-08-29.html": "article",
};

const REQUIRED_META = [
  "description",
  "og:title",
  "og:description",
  "og:type",
  "og:url",
  "twitter:card",
  "twitter:title",
  "twitter:description",
];

const FORBIDDEN_META = [
  "og:image",
  "og:image:url",
  "og:image:secure_url",
  "twitter:image",
  "twitter:image:src",
];

function metaAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
}

function collapse(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractMetadata(html) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? collapse(titleMatch[1]) : "";
  const tags = {};
  const duplicates = [];
  const re = /<meta\b[\s\S]*?>/gi;
  let match;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const key = (metaAttribute(tag, "property") || metaAttribute(tag, "name")).toLowerCase();
    if (!key) {
      continue;
    }
    const content = collapse(metaAttribute(tag, "content"));
    if (Object.hasOwn(tags, key)) {
      duplicates.push(key);
    }
    tags[key] = content;
  }
  return { title, tags, duplicates };
}

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => collapse(match[1]));
}

function distFileFromLoc(loc, distDir = dist) {
  const url = new URL(loc);
  let pathname = url.pathname;
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  } else if (pathname === "") {
    pathname = "/index.html";
  }
  return join(distDir, pathname.replace(/^\/+/, ""));
}

function pathFromLoc(loc) {
  const url = new URL(loc);
  return url.pathname === "" ? "/" : url.pathname;
}

function validatePage(html, loc) {
  const errors = [];
  const path = pathFromLoc(loc);
  const expectedType = PAGE_TYPES[path];
  const { title, tags, duplicates } = extractMetadata(html);

  if (!expectedType) {
    errors.push(`${loc}: not in the public sitemap set`);
    return errors;
  }
  if (duplicates.length > 0) {
    errors.push(`${loc}: duplicate meta (${[...new Set(duplicates)].join(", ")})`);
  }
  if (!title) {
    errors.push(`${loc}: missing <title>`);
  }

  for (const name of REQUIRED_META) {
    if (!tags[name]) {
      errors.push(`${loc}: missing ${name}`);
    }
  }
  for (const name of FORBIDDEN_META) {
    if (tags[name]) {
      errors.push(`${loc}: unexpected ${name} (${tags[name]})`);
    }
  }

  if (title && tags["og:title"] && title !== tags["og:title"]) {
    errors.push(`${loc}: og:title does not match title`);
  }
  if (title && tags["twitter:title"] && title !== tags["twitter:title"]) {
    errors.push(`${loc}: twitter:title does not match title`);
  }
  if (tags.description && tags["og:description"] && tags.description !== tags["og:description"]) {
    errors.push(`${loc}: og:description does not match description`);
  }
  if (
    tags.description &&
    tags["twitter:description"] &&
    tags.description !== tags["twitter:description"]
  ) {
    errors.push(`${loc}: twitter:description does not match description`);
  }
  if (tags["og:type"] && tags["og:type"] !== expectedType) {
    errors.push(`${loc}: og:type is "${tags["og:type"]}", expected "${expectedType}"`);
  }
  if (tags["og:url"] && tags["og:url"] !== loc) {
    errors.push(`${loc}: og:url is "${tags["og:url"]}"`);
  }
  if (tags["twitter:card"] && tags["twitter:card"] !== "summary") {
    errors.push(`${loc}: twitter:card is "${tags["twitter:card"]}", expected "summary"`);
  }
  if (new URL(loc).origin !== SITE_ORIGIN) {
    errors.push(`${loc}: origin is not ${SITE_ORIGIN}`);
  }

  return errors;
}

async function main() {
  try {
    await stat(join(dist, "sitemap.xml"));
  } catch {
    console.error(
      "error: dist/sitemap.xml was not found. Run `npm run build` before checking metadata."
    );
    process.exitCode = 1;
    return;
  }

  const xml = await readFile(join(dist, "sitemap.xml"), "utf8");
  const locs = sitemapLocs(xml);
  const expectedLocs = Object.keys(PAGE_TYPES).map((path) => SITE_ORIGIN + path);
  const missing = expectedLocs.filter((loc) => !locs.includes(loc));
  const extra = locs.filter((loc) => !expectedLocs.includes(loc));
  const errors = [];

  if (missing.length > 0) {
    errors.push(`sitemap missing: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    errors.push(`sitemap extra: ${extra.join(", ")}`);
  }

  const titles = new Map();
  const descriptions = new Map();

  for (const loc of expectedLocs) {
    const file = distFileFromLoc(loc);
    let html;
    try {
      html = await readFile(file, "utf8");
    } catch {
      errors.push(`${loc}: built file missing (${file})`);
      continue;
    }
    errors.push(...validatePage(html, loc));
    const { title, tags } = extractMetadata(html);
    if (title) {
      if (titles.has(title)) {
        errors.push(`${loc}: title duplicates ${titles.get(title)}`);
      } else {
        titles.set(title, loc);
      }
    }
    if (tags.description) {
      if (descriptions.has(tags.description)) {
        errors.push(`${loc}: description duplicates ${descriptions.get(tags.description)}`);
      } else {
        descriptions.set(tags.description, loc);
      }
    }
  }

  if (errors.length > 0) {
    console.error(
      `Checked ${expectedLocs.length} sitemap pages. ${errors.length} metadata error(s):\n`
    );
    console.error(errors.map((line) => `- ${line}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`Checked ${expectedLocs.length} sitemap pages. Metadata OK`);
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
  PAGE_TYPES,
  SITE_ORIGIN,
  distFileFromLoc,
  extractMetadata,
  pathFromLoc,
  sitemapLocs,
  validatePage,
};
