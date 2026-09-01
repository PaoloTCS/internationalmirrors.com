import assert from "node:assert/strict";
import { relative, resolve } from "node:path";
import { dist, resolveLocalTarget } from "./check-internal-links.mjs";

const researchPage = resolve(dist, "research/index.html");
const notesPage = resolve(dist, "notes/swarmworld-2026-08-29.html");
const nestedPage = resolve(dist, "archive/spy-simulation/index.html");
const homePage = resolve(dist, "index.html");

function assertInsideDist(filePath) {
  const rel = relative(dist, filePath);
  assert.ok(
    rel === "" || (!rel.startsWith("..") && !rel.startsWith("/")),
    `${filePath} escaped dist/`
  );
}

function assertFile(result, expected, fragment = null) {
  assert.equal(result.type, "ok", JSON.stringify(result));
  assert.equal(result.filePath, expected);
  assert.equal(result.fragment, fragment);
  assertInsideDist(result.filePath);
}

// 1. No base element: resolve against the current page URL.
assertFile(resolveLocalTarget(researchPage, "../index.html"), resolve(dist, "index.html"));
assertFile(resolveLocalTarget(researchPage, "index.html"), researchPage);
assertFile(resolveLocalTarget(researchPage, "#main"), researchPage, "main");
assertFile(resolveLocalTarget(researchPage, "../styles.css"), resolve(dist, "styles.css"));

// 2. <base href="/"> is the site root, not the filesystem root.
{
  const result = resolveLocalTarget(researchPage, "index.html", "/");
  assertFile(result, resolve(dist, "index.html"));
  assert.notEqual(result.filePath, "/index.html");
}
assertFile(
  resolveLocalTarget(researchPage, "research/index.html", "/"),
  resolve(dist, "research/index.html")
);
assertFile(
  resolveLocalTarget(researchPage, "/protocols/index.html", "/"),
  resolve(dist, "protocols/index.html")
);

// 3. <base href="/research/"> (and /subdirectory/) stay inside dist/.
{
  const result = resolveLocalTarget(notesPage, "index.html", "/research/");
  assertFile(result, resolve(dist, "research/index.html"));
  assert.notEqual(result.filePath, "/research/index.html");
}
assertFile(
  resolveLocalTarget(notesPage, "index.html", "/subdirectory/"),
  resolve(dist, "subdirectory/index.html")
);

// 4. Relative base path, resolved against the document URL first.
assertFile(
  resolveLocalTarget(notesPage, "index.html", "../research/"),
  resolve(dist, "research/index.html")
);
assertFile(resolveLocalTarget(researchPage, "index.html", "../"), resolve(dist, "index.html"));

// 5. Base URL naming an HTML document uses that file as the base URL.
assertFile(
  resolveLocalTarget(notesPage, "im-swarm-001.html", "/protocols/index.html"),
  resolve(dist, "protocols/im-swarm-001.html")
);
assertFile(
  resolveLocalTarget(notesPage, "../styles.css", "/research/index.html"),
  resolve(dist, "styles.css")
);
assertFile(resolveLocalTarget(notesPage, "#main", "/research/index.html"), researchPage, "main");

// 6. Fragment-only links follow the effective base, not the current page.
assertFile(
  resolveLocalTarget(notesPage, "#section", "/research/"),
  resolve(dist, "research"),
  "section"
);
assertFile(resolveLocalTarget(notesPage, "#section", "/"), dist, "section");
assert.notEqual(resolveLocalTarget(notesPage, "#section", "/research/").filePath, notesPage);

// 7. Genuinely external base URLs skip relative and root-relative hrefs.
assert.equal(resolveLocalTarget(researchPage, "index.html", "https://example.com/").type, "skip");
assert.equal(resolveLocalTarget(researchPage, "/index.html", "https://example.com/").type, "skip");
assert.equal(resolveLocalTarget(researchPage, "#main", "https://example.com/docs/").type, "skip");
assert.equal(resolveLocalTarget(researchPage, "https://example.com/x").type, "skip");
assert.equal(resolveLocalTarget(researchPage, "mailto:test@example.com").type, "skip");
assert.equal(resolveLocalTarget(researchPage, "tel:+15551212").type, "skip");
assert.equal(resolveLocalTarget(researchPage, "//cdn.example/lib.js").type, "skip");

// 8. Attempts to walk above the site root stay mapped inside dist/, never to the filesystem root.
{
  const result = resolveLocalTarget(nestedPage, "../../../../outside.html");
  assertFile(result, resolve(dist, "outside.html"));
  assert.notEqual(result.filePath, "/outside.html");
}
assertFile(resolveLocalTarget(homePage, "/../outside.html"), resolve(dist, "outside.html"));
assertFile(
  resolveLocalTarget(researchPage, "%2e%2e/%2e%2e/outside.html"),
  resolve(dist, "outside.html")
);
assertFile(
  resolveLocalTarget(researchPage, "index.html", "/../../../"),
  resolve(dist, "index.html")
);
assertFile(resolveLocalTarget(researchPage, ".", "/../../../"), dist);

console.log("check-internal-links.test.mjs: 8 base-URL cases passed");
