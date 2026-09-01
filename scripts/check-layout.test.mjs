import assert from "node:assert/strict";
import {
  VIEWPORTS,
  layoutStyleErrors,
  measurementErrors,
  overflowMessage,
  pageOverflows,
  publicPaths,
} from "./check-layout.mjs";

assert.deepEqual(VIEWPORTS, [360, 768, 1265, 1440]);
assert.deepEqual(publicPaths(), [
  "/",
  "/research/",
  "/protocols/",
  "/protocols/im-swarm-001.html",
  "/responses/",
  "/results/",
  "/notes/swarmworld-2026-08-29.html",
]);

assert.equal(pageOverflows(1265, 1265), false);
assert.equal(pageOverflows(1265, 1266), false);
assert.equal(pageOverflows(1265, 1328), true);
assert.match(overflowMessage("/", 1265, 1265, 1328), /63px/);

const hanging = `
html { scroll-behavior: smooth; }
body { margin: 0; }
.system-map { position: relative; padding: 16px; }
.integrity-gate { position: absolute; right: -22px; transform: translateX(36%); }
@media (width <= 900px) {
  nav { flex-wrap: wrap; }
}
`;
const hangErrors = layoutStyleErrors(hanging);
assert.ok(hangErrors.some((line) => /negative right/.test(line)));
assert.ok(hangErrors.some((line) => /percentage translateX/.test(line)));
assert.ok(hangErrors.some((line) => /reserve horizontal space/.test(line)));
assert.ok(hangErrors.some((line) => /unscoped nav/.test(line)));

const clipping =
  "html { overflow-x: hidden; }\nbody { margin: 0; }\n.system-map { margin-right: 32px; }\n";
assert.ok(layoutStyleErrors(clipping).some((line) => /html overflow clipping/.test(line)));

const ok = `
html { scroll-behavior: smooth; }
body { margin: 0; }
.system-map { position: relative; margin-right: 32px; }
.integrity-gate { position: absolute; right: 0; transform: translateX(32px); }
.site-header nav { display: flex; }
@media (width <= 900px) {
  .site-header nav { flex-wrap: wrap; }
}
`;
assert.deepEqual(layoutStyleErrors(ok), []);

const overflowMeasure = measurementErrors("/", 1265, {
  clientWidth: 1265,
  scrollWidth: 1328,
  bodyScrollWidth: 1328,
  innerWidth: 1265,
  htmlOverflowX: "visible",
  bodyOverflowX: "visible",
  elements: {
    ".integrity-gate": { count: 1, minLeft: 980, maxRight: 1328, minWidth: 240, minHeight: 62 },
  },
});
assert.ok(overflowMeasure.some((line) => /63px/.test(line)));
assert.ok(overflowMeasure.some((line) => /\.integrity-gate extends/.test(line)));

const clippedMeasure = measurementErrors("/", 360, {
  clientWidth: 360,
  scrollWidth: 360,
  bodyScrollWidth: 360,
  innerWidth: 360,
  htmlOverflowX: "hidden",
  bodyOverflowX: "visible",
  elements: {},
});
assert.ok(clippedMeasure.some((line) => /clips focus outlines/.test(line)));

console.log("check-layout.test.mjs: viewport list, CSS guards, and overflow rules passed");
