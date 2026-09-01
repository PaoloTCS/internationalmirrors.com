import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import {
  applyArchiveNoindex,
  countEffectiveNoindex,
  hasEffectiveNoindex,
  dist,
  root,
  walkHtml,
} from "./build.mjs";

function posixFrom(base, absPath) {
  return relative(base, absPath).split("\\").join("/");
}

function robotsDisallowRules(robotsText) {
  const rules = [];
  for (const line of robotsText.split(/\r?\n/)) {
    const trimmed = line.replace(/#.*$/, "").trim();
    const match = trimmed.match(/^disallow:\s*(\S*)/i);
    if (match) {
      rules.push(match[1]);
    }
  }
  return rules;
}

function disallowBlocks(rules, path) {
  return rules.some((rule) => rule !== "" && path.startsWith(rule));
}

const sourceArchive = resolve(root, "archive");
const builtArchive = resolve(dist, "archive");

try {
  await stat(builtArchive);
} catch {
  throw new Error("dist/archive was not found. Run `npm run build` before this test.");
}

const sourceStatus = execFileSync("git", ["status", "--porcelain", "--", "archive"], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(sourceStatus.trim(), "", "source archive/ must be unmodified");

execFileSync("git", ["diff", "--exit-code", "--", "archive"], { cwd: root });

const sourcePages = await walkHtml(sourceArchive);
const builtPages = await walkHtml(builtArchive);
assert.equal(builtPages.length, sourcePages.length, "built archive HTML count must match source");
assert.ok(builtPages.length > 0, "expected archive HTML pages");

let sourceAlreadyNoindex = 0;
let sourceMissingNoindex = 0;

for (const sourcePage of sourcePages) {
  const rel = posixFrom(sourceArchive, sourcePage);
  const builtPage = resolve(builtArchive, rel);
  const sourceHtml = await readFile(sourcePage, "utf8");
  const builtHtml = await readFile(builtPage, "utf8");
  const sourceCount = countEffectiveNoindex(sourceHtml);
  const builtCount = countEffectiveNoindex(builtHtml);

  assert.ok(hasEffectiveNoindex(builtHtml), `${rel} is missing an effective noindex in dist/`);
  assert.equal(
    builtCount,
    sourceCount === 0 ? 1 : sourceCount,
    `${rel} must not duplicate noindex (source ${sourceCount}, dist ${builtCount})`
  );

  if (sourceCount > 0) {
    sourceAlreadyNoindex += 1;
    assert.equal(builtHtml, sourceHtml, `${rel} already had noindex and must be copied unchanged`);
  } else {
    sourceMissingNoindex += 1;
    assert.notEqual(builtHtml, sourceHtml, `${rel} should receive noindex only in dist/`);
    assert.equal(
      hasEffectiveNoindex(sourceHtml),
      false,
      `${rel} source must remain without noindex`
    );
  }
}

assert.ok(sourceAlreadyNoindex >= 1, "expected at least one source page with noindex");
assert.ok(sourceMissingNoindex >= 1, "expected source spy-simulation pages without noindex");

const publicHome = await readFile(resolve(dist, "index.html"), "utf8");
const publicResearch = await readFile(resolve(dist, "research/index.html"), "utf8");
assert.equal(hasEffectiveNoindex(publicHome), false, "public home must remain indexable");
assert.equal(
  hasEffectiveNoindex(publicResearch),
  false,
  "public research page must remain indexable"
);

const beforeSecondPass = await Promise.all(
  builtPages.map(async (page) => [page, await readFile(page, "utf8")])
);
const secondPass = await applyArchiveNoindex(builtArchive);
assert.equal(secondPass.injected, 0, "second noindex pass must be idempotent");
for (const [page, before] of beforeSecondPass) {
  assert.equal(await readFile(page, "utf8"), before);
}

const robots = await readFile(resolve(dist, "robots.txt"), "utf8");
const rules = robotsDisallowRules(robots);
assert.equal(disallowBlocks(rules, "/archive"), false, "robots.txt must not Disallow /archive");
assert.equal(disallowBlocks(rules, "/archive/"), false);
assert.equal(disallowBlocks(rules, "/archive/spy-simulation/index.html"), false);
assert.match(robots, /^sitemap:\s*https:\/\/internationalmirrors\.com\/sitemap\.xml/im);

const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
assert.doesNotMatch(sitemap, /internationalmirrors\.com\/archive/);
assert.match(sitemap, /https:\/\/internationalmirrors\.com\/notes\/swarmworld-2026-08-29\.html/);

console.log(
  `check-archive-indexing.test.mjs: ${builtPages.length} archive pages, ${sourceAlreadyNoindex} source noindex preserved, ${sourceMissingNoindex} dist-only injections`
);
