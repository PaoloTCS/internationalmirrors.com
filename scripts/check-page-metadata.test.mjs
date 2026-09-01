import assert from "node:assert/strict";
import { join } from "node:path";
import {
  PAGE_TYPES,
  SITE_ORIGIN,
  distFileFromLoc,
  extractMetadata,
  pathFromLoc,
  sitemapLocs,
  validatePage,
} from "./check-page-metadata.mjs";

assert.equal(pathFromLoc("https://internationalmirrors.com/"), "/");
assert.equal(pathFromLoc("https://internationalmirrors.com/research/"), "/research/");
assert.equal(
  pathFromLoc("https://internationalmirrors.com/protocols/im-swarm-001.html"),
  "/protocols/im-swarm-001.html"
);

assert.equal(PAGE_TYPES["/"], "website");
assert.equal(PAGE_TYPES["/research/"], "website");
assert.equal(PAGE_TYPES["/protocols/"], "website");
assert.equal(PAGE_TYPES["/responses/"], "website");
assert.equal(PAGE_TYPES["/results/"], "website");
assert.equal(PAGE_TYPES["/protocols/im-swarm-001.html"], "article");
assert.equal(PAGE_TYPES["/notes/swarmworld-2026-08-29.html"], "article");

assert.equal(distFileFromLoc(`${SITE_ORIGIN}/`, "/tmp/dist"), join("/tmp/dist", "index.html"));
assert.equal(
  distFileFromLoc(`${SITE_ORIGIN}/research/`, "/tmp/dist"),
  join("/tmp/dist", "research/index.html")
);
assert.equal(
  distFileFromLoc(`${SITE_ORIGIN}/protocols/im-swarm-001.html`, "/tmp/dist"),
  join("/tmp/dist", "protocols/im-swarm-001.html")
);

assert.deepEqual(
  sitemapLocs("<urlset><url><loc>https://internationalmirrors.com/</loc></url></urlset>"),
  ["https://internationalmirrors.com/"]
);

const okHtml = `<!doctype html>
<html>
  <head>
    <title>Example page — International Mirrors</title>
    <meta name="description" content="Unique description for the example page." />
    <meta property="og:title" content="Example page — International Mirrors" />
    <meta property="og:description" content="Unique description for the example page." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://internationalmirrors.com/" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Example page — International Mirrors" />
    <meta name="twitter:description" content="Unique description for the example page." />
  </head>
</html>`;

assert.deepEqual(validatePage(okHtml, `${SITE_ORIGIN}/`), []);

const mismatched = okHtml.replace(
  'property="og:title" content="Example page — International Mirrors"',
  'property="og:title" content="Wrong title"'
);
assert.ok(validatePage(mismatched, `${SITE_ORIGIN}/`).some((line) => /og:title/.test(line)));

const withImage = okHtml.replace(
  "</head>",
  '<meta property="og:image" content="https://example.com/card.png" /></head>'
);
assert.ok(validatePage(withImage, `${SITE_ORIGIN}/`).some((line) => /og:image/.test(line)));

const wrongType = okHtml.replace('content="website"', 'content="article"');
assert.ok(validatePage(wrongType, `${SITE_ORIGIN}/`).some((line) => /og:type/.test(line)));

const protocolHtml = okHtml
  .replaceAll("website", "article")
  .replaceAll(
    "https://internationalmirrors.com/",
    "https://internationalmirrors.com/protocols/im-swarm-001.html"
  );
assert.deepEqual(validatePage(protocolHtml, `${SITE_ORIGIN}/protocols/im-swarm-001.html`), []);

const { title, tags } = extractMetadata(okHtml);
assert.equal(title, "Example page — International Mirrors");
assert.equal(tags.description, "Unique description for the example page.");
assert.equal(tags["twitter:card"], "summary");

console.log("check-page-metadata.test.mjs: mapping, type, and consistency rules passed");
