import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PAGE_TYPES, SITE_ORIGIN } from "./check-page-metadata.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const TEXT_PAIRS = [
  ["ink", "paper", 4.5],
  ["ink-soft", "paper", 4.5],
  ["ink-soft", "paper-deep", 4.5],
  ["white", "ink", 4.5],
  ["ink", "signal", 4.5],
  ["ink-soft", "signal", 4.5],
  ["alert", "paper", 4.5],
  ["alert", "paper-deep", 4.5],
];

const UI_PAIRS = [
  ["line", "paper", 3],
  ["line", "paper-deep", 3],
  ["ink", "paper", 3],
];

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function expandHex(hex) {
  const raw = hex.replace("#", "");
  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((ch) => ch + ch)
      .join("")}`;
  }
  return `#${raw.toLowerCase()}`;
}

function relativeLuminance(hex) {
  const n = expandHex(hex).slice(1);
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function parseRootColors(css) {
  const block = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!block) {
    return {};
  }
  const vars = {};
  const re = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let match;
  while ((match = re.exec(block[1]))) {
    vars[match[1]] = expandHex(match[2]);
  }
  return vars;
}

function sourceFileFromPath(path) {
  if (path === "/") {
    return join(root, "index.html");
  }
  const rel = path.replace(/^\//, "");
  if (rel.endsWith("/")) {
    return join(root, rel, "index.html");
  }
  return join(root, rel);
}

function maskKeepNewlines(block) {
  return block.replace(/[^\n]/g, " ");
}

function maskIgnoredRegions(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, maskKeepNewlines)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, maskKeepNewlines)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, maskKeepNewlines);
}

function headingLevels(html) {
  const masked = maskIgnoredRegions(html);
  const levels = [];
  const re = /<h([1-6])\b/gi;
  let match;
  while ((match = re.exec(masked))) {
    levels.push(Number(match[1]));
  }
  return levels;
}

function headingErrors(levels, loc) {
  const errors = [];
  if (levels.length === 0) {
    errors.push(`${loc}: no headings found`);
    return errors;
  }
  if (levels[0] !== 1) {
    errors.push(`${loc}: first heading is h${levels[0]}, expected h1`);
  }
  if (levels.filter((level) => level === 1).length !== 1) {
    errors.push(`${loc}: expected exactly one h1`);
  }
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] > levels[i - 1] + 1) {
      errors.push(`${loc}: heading skip h${levels[i - 1]} to h${levels[i]}`);
    }
  }
  return errors;
}

function countTag(html, tag) {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) ?? []).length;
}

function namedNavCount(html) {
  const re = /<nav\b([^>]*)>/gi;
  let count = 0;
  let match;
  while ((match = re.exec(html))) {
    const attrs = match[1];
    if (/\baria-label\s*=/i.test(attrs) || /\baria-labelledby\s*=/i.test(attrs)) {
      count += 1;
    }
  }
  return count;
}

function landmarkErrors(html, loc) {
  const errors = [];
  if (countTag(html, "header") < 1) {
    errors.push(`${loc}: missing header landmark`);
  }
  if (namedNavCount(html) < 1) {
    errors.push(`${loc}: missing named nav landmark`);
  }
  if (!/<main\b[^>]*\bid\s*=\s*(["'])main\1/i.test(html)) {
    errors.push(`${loc}: missing <main id="main">`);
  }
  if (countTag(html, "footer") < 1) {
    errors.push(`${loc}: missing footer landmark`);
  }
  if (countTag(html, "section") + countTag(html, "article") < 1) {
    errors.push(`${loc}: missing section or article landmark`);
  }
  if (!/<a\b[^>]*class=(["'])[^"']*\bskip-link\b[^"']*\1[^>]*href=(["'])#main\2/i.test(html)) {
    const skip = /class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#main["']/i.test(html);
    if (!skip) {
      errors.push(`${loc}: missing skip link to #main`);
    }
  }
  return errors;
}

function styleErrors(css) {
  const errors = [];
  if (!/:focus-visible/.test(css)) {
    errors.push("styles.css: missing :focus-visible rules");
  }
  if (!/a:focus-visible[\s\S]*outline\s*:/.test(css)) {
    errors.push("styles.css: a:focus-visible must set an outline");
  }
  if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css)) {
    errors.push("styles.css: missing prefers-reduced-motion query");
  }
  const reduced = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)$/);
  if (reduced && !/scroll-behavior\s*:\s*auto/.test(reduced[1])) {
    errors.push("styles.css: reduced-motion must restore scroll-behavior: auto");
  }
  if (reduced && !/animation-duration/.test(reduced[1])) {
    errors.push("styles.css: reduced-motion must limit animation-duration");
  }
  if (/outline\s*:\s*none/.test(css) && !/:focus-visible[\s\S]*outline\s*:\s*2px/.test(css)) {
    errors.push("styles.css: outline: none without a visible :focus-visible replacement");
  }

  const vars = parseRootColors(css);
  for (const [fg, bg, min] of TEXT_PAIRS) {
    if (!vars[fg] || !vars[bg]) {
      errors.push(`styles.css: missing color variable --${vars[fg] ? bg : fg}`);
      continue;
    }
    const ratio = contrastRatio(vars[fg], vars[bg]);
    if (ratio < min) {
      errors.push(
        `styles.css: --${fg} on --${bg} contrast ${ratio.toFixed(2)}:1 is below ${min}:1`
      );
    }
  }
  for (const [fg, bg, min] of UI_PAIRS) {
    if (!vars[fg] || !vars[bg]) {
      continue;
    }
    const ratio = contrastRatio(vars[fg], vars[bg]);
    if (ratio < min) {
      errors.push(
        `styles.css: --${fg} on --${bg} UI contrast ${ratio.toFixed(2)}:1 is below ${min}:1`
      );
    }
  }

  const thesisMuted = css.match(
    /\.thesis p:not\(\.section-label\)\s*\{[\s\S]*?color:\s*(#[0-9a-fA-F]{3,8})/
  );
  if (thesisMuted && vars.ink) {
    const ratio = contrastRatio(thesisMuted[1], vars.ink);
    if (ratio < 4.5) {
      errors.push(
        `styles.css: thesis body text on ink contrast ${ratio.toFixed(2)}:1 is below 4.5:1`
      );
    }
  }

  return errors;
}

async function main() {
  const css = await readFile(join(root, "styles.css"), "utf8");
  const errors = [...styleErrors(css)];
  const paths = Object.keys(PAGE_TYPES);

  for (const path of paths) {
    const loc = SITE_ORIGIN + path;
    const file = sourceFileFromPath(path);
    const html = await readFile(file, "utf8");
    errors.push(...headingErrors(headingLevels(html), loc));
    errors.push(...landmarkErrors(html, loc));
  }

  if (errors.length > 0) {
    console.error(
      `Checked ${paths.length} public pages. ${errors.length} accessibility error(s):\n`
    );
    console.error(errors.map((line) => `- ${line}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`Checked ${paths.length} public pages plus styles.css. Accessibility OK`);
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
  contrastRatio,
  headingErrors,
  headingLevels,
  landmarkErrors,
  parseRootColors,
  sourceFileFromPath,
  styleErrors,
};
