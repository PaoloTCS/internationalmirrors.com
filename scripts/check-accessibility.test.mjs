import assert from "node:assert/strict";
import {
  contrastRatio,
  headingErrors,
  headingLevels,
  landmarkErrors,
  parseRootColors,
} from "./check-accessibility.mjs";

assert.ok(contrastRatio("#10231f", "#f2f0e9") >= 4.5);
assert.ok(contrastRatio("#a7483c", "#f2f0e9") >= 4.5);
assert.ok(contrastRatio("#a7483c", "#e7e3d8") >= 4.5);
assert.ok(contrastRatio("#7a7f76", "#f2f0e9") >= 3);
assert.ok(contrastRatio("#e05d3f", "#f2f0e9") < 4.5);

assert.deepEqual(headingLevels("<h1>A</h1><h2>B</h2><h3>C</h3>"), [1, 2, 3]);
assert.deepEqual(headingErrors([1, 2, 3], "/"), []);
assert.ok(headingErrors([1, 3], "/").some((line) => /skip/.test(line)));
assert.ok(headingErrors([2], "/").some((line) => /h1/.test(line)));
assert.ok(headingErrors([1, 1], "/").some((line) => /exactly one h1/.test(line)));

const page = `<a class="skip-link" href="#main">Skip</a>
<header><nav aria-label="Primary navigation"></nav></header>
<main id="main"><section><h1>Title</h1></section></main>
<footer></footer>`;
assert.deepEqual(landmarkErrors(page, "/"), []);
assert.ok(landmarkErrors("<main><h1>X</h1></main>", "/").length > 0);

const vars = parseRootColors(":root { --ink: #10231f; --paper: #f2f0e9; }");
assert.equal(vars.ink, "#10231f");
assert.equal(vars.paper, "#f2f0e9");

console.log("check-accessibility.test.mjs: contrast, heading, and landmark rules passed");
