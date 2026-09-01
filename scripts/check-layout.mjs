import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, mkdtemp, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { PAGE_TYPES } from "./check-page-metadata.mjs";

const execFileAsync = promisify(execFile);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");

const VIEWPORTS = [360, 768, 1265, 1440];
const VIEWPORT_HEIGHT = 900;
const OVERFLOW_TOLERANCE_PX = 1;
const CLIPPING_OVERFLOW = new Set(["hidden", "clip"]);

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
};

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
];

const MEASURE_JS = `(() => {
  const doc = document.documentElement;
  const body = document.body;
  const selectors = [
    ".site-header",
    ".site-header nav a",
    "h1",
    ".hero-actions .button",
    ".system-map",
    ".integrity-gate",
    ".risk-grid",
    ".equation",
    ".article-toc a",
    ".comparison",
    ".registry-grid",
    ".protocol-summary",
    "footer",
    "footer a",
  ];
  const elements = {};
  for (const sel of selectors) {
    const nodes = [...document.querySelectorAll(sel)];
    if (nodes.length === 0) {
      continue;
    }
    const boxes = nodes.map((el) => el.getBoundingClientRect());
    elements[sel] = {
      count: nodes.length,
      minLeft: Math.min(...boxes.map((box) => box.left)),
      maxRight: Math.max(...boxes.map((box) => box.right)),
      minWidth: Math.min(...boxes.map((box) => box.width)),
      minHeight: Math.min(...boxes.map((box) => box.height)),
    };
  }
  return {
    clientWidth: doc.clientWidth,
    scrollWidth: doc.scrollWidth,
    bodyScrollWidth: body.scrollWidth,
    innerWidth: window.innerWidth,
    htmlOverflowX: getComputedStyle(doc).overflowX,
    bodyOverflowX: getComputedStyle(body).overflowX,
    elements,
  };
})()`;

function publicPaths() {
  return Object.keys(PAGE_TYPES);
}

function pageOverflows(clientWidth, scrollWidth, tolerance = OVERFLOW_TOLERANCE_PX) {
  return scrollWidth > clientWidth + tolerance;
}

function overflowMessage(path, width, clientWidth, scrollWidth) {
  const extra = scrollWidth - clientWidth;
  return `${path} @ ${width}px: scrollWidth ${scrollWidth}px exceeds clientWidth ${clientWidth}px by ${extra}px`;
}

function selectorBlocks(css, selector) {
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "g");
  return [...css.matchAll(re)].map((match) => match[1]);
}

function layoutStyleErrors(css) {
  const errors = [];
  const htmlBlock = css.match(/(?:^|\n)html\s*\{([^}]*)\}/);
  const bodyBlock = css.match(/(?:^|\n)body\s*\{([^}]*)\}/);
  for (const [name, block] of [
    ["html", htmlBlock],
    ["body", bodyBlock],
  ]) {
    if (block && /overflow(?:-x)?\s*:\s*(hidden|clip)/i.test(block[1])) {
      errors.push(
        `styles.css: ${name} overflow clipping would hide overflow and clip focus outlines`
      );
    }
  }

  if (/(^|\n)\s+nav\s*\{/.test(css)) {
    errors.push(
      "styles.css: unscoped nav { rule; use .site-header nav so article TOCs are not restyled"
    );
  }

  const gateBlocks = selectorBlocks(css, "\\.integrity-gate");
  if (gateBlocks.some((block) => /right\s*:\s*-/.test(block))) {
    errors.push(
      "styles.css: .integrity-gate uses a negative right offset that can overflow the viewport"
    );
  }
  if (gateBlocks.some((block) => /translateX\(\s*\d+%/.test(block))) {
    errors.push("styles.css: .integrity-gate percentage translateX can hang past the page gutter");
  }

  const mapBlocks = selectorBlocks(css, "\\.system-map");
  if (!mapBlocks.some((block) => /margin-right\s*:/.test(block))) {
    errors.push(
      "styles.css: .system-map must reserve horizontal space for the overlapping integrity gate"
    );
  }

  return errors;
}

function measurementErrors(path, viewport, measurement) {
  const errors = [];
  const loc = `${path} @ ${viewport}px`;
  if (
    Math.abs(measurement.innerWidth - viewport) > 1 &&
    Math.abs(measurement.clientWidth - viewport) > 1
  ) {
    errors.push(
      `${loc}: viewport did not apply (innerWidth ${measurement.innerWidth}, clientWidth ${measurement.clientWidth})`
    );
  }
  if (CLIPPING_OVERFLOW.has(measurement.htmlOverflowX)) {
    errors.push(
      `${loc}: html overflow-x is ${measurement.htmlOverflowX}; that clips focus outlines`
    );
  }
  if (CLIPPING_OVERFLOW.has(measurement.bodyOverflowX)) {
    errors.push(
      `${loc}: body overflow-x is ${measurement.bodyOverflowX}; that clips focus outlines`
    );
  }
  if (pageOverflows(measurement.clientWidth, measurement.scrollWidth)) {
    errors.push(overflowMessage(path, viewport, measurement.clientWidth, measurement.scrollWidth));
  }
  if (pageOverflows(measurement.innerWidth, measurement.bodyScrollWidth)) {
    errors.push(
      `${path} @ ${viewport}px: body.scrollWidth ${measurement.bodyScrollWidth}px exceeds innerWidth ${measurement.innerWidth}px`
    );
  }
  for (const [sel, info] of Object.entries(measurement.elements ?? {})) {
    if (info.maxRight > measurement.clientWidth + OVERFLOW_TOLERANCE_PX) {
      errors.push(
        `${loc}: ${sel} extends to ${Math.round(info.maxRight)}px beyond clientWidth ${measurement.clientWidth}px`
      );
    }
    if (
      (sel.includes("nav a") || sel.includes("button") || sel === "footer a") &&
      info.minWidth < 8
    ) {
      errors.push(`${loc}: ${sel} is not reachable (width ${info.minWidth}px)`);
    }
  }
  return errors;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findChrome(env = process.env) {
  if (env.CHROME_PATH && (await pathExists(env.CHROME_PATH))) {
    return env.CHROME_PATH;
  }
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate.includes(sep)) {
      if (await pathExists(candidate)) {
        return candidate;
      }
      continue;
    }
    try {
      const { stdout } = await execFileAsync("which", [candidate]);
      const found = stdout.trim();
      if (found) {
        return found;
      }
    } catch {
      /* continue */
    }
  }
  return null;
}

function safeDistFile(urlPath) {
  let pathname = decodeURIComponent(String(urlPath).split("?")[0]);
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }
  if (pathname === "") {
    pathname = "/index.html";
  }
  const abs = resolve(dist, `.${pathname}`);
  const rel = relative(dist, abs);
  if (rel.startsWith("..") || rel.startsWith(sep)) {
    return null;
  }
  return abs;
}

function startStaticServer() {
  const server = createServer(async (req, res) => {
    const file = safeDistFile(new URL(req.url ?? "/", "http://127.0.0.1").pathname);
    if (!file) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    try {
      const info = await stat(file);
      const target = info.isDirectory() ? join(file, "index.html") : file;
      const type = MIME[extname(target).toLowerCase()] ?? "application/octet-stream";
      res.writeHead(200, { "content-type": type });
      createReadStream(target).pipe(res);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function waitForDevtools(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buf = "";
    let settled = false;
    const done = (error, url) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      child.stderr?.off("data", onData);
      child.stdout?.off("data", onData);
      child.off("exit", onExit);
      if (error) {
        reject(error);
      } else {
        resolve(url);
      }
    };
    const onData = (chunk) => {
      buf += chunk.toString();
      const match = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        done(null, match[1]);
      }
    };
    const onExit = (code) => {
      done(new Error(`Chrome exited ${code} before DevTools was ready\n${buf}`));
    };
    const timer = setTimeout(() => {
      done(new Error(`Chrome did not expose DevTools within ${timeoutMs}ms\n${buf}`));
    }, timeoutMs);
    child.stderr.on("data", onData);
    child.stdout.on("data", onData);
    child.once("exit", onExit);
  });
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.events = new Map();
  }

  async open() {
    if (this.ws.readyState === WebSocket.OPEN) {
      return;
    }
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", () => reject(new Error("CDP WebSocket error")), {
        once: true,
      });
    });
    this.ws.addEventListener("message", (event) => this.onMessage(event.data));
  }

  onMessage(data) {
    const msg = JSON.parse(data);
    if (msg.id) {
      const pending = this.pending.get(msg.id);
      if (!pending) {
        return;
      }
      this.pending.delete(msg.id);
      if (msg.error) {
        pending.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      } else {
        pending.resolve(msg.result);
      }
      return;
    }
    if (msg.method) {
      const key = msg.sessionId ? `${msg.sessionId}:${msg.method}` : msg.method;
      const waiters = this.events.get(key);
      if (waiters && waiters.length > 0) {
        waiters.shift()(msg.params);
      }
    }
  }

  send(method, params = {}, sessionId) {
    const id = ++this.nextId;
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  wait(method, sessionId, timeoutMs = 15000) {
    const key = sessionId ? `${sessionId}:${method}` : method;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const list = this.events.get(key) ?? [];
        this.events.set(
          key,
          list.filter((item) => item !== entry)
        );
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const entry = (params) => {
        clearTimeout(timer);
        resolve(params);
      };
      const list = this.events.get(key) ?? [];
      list.push(entry);
      this.events.set(key, list);
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}

async function measurePage(cdp, origin, path, width) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  try {
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      {
        width,
        height: VIEWPORT_HEIGHT,
        deviceScaleFactor: 1,
        mobile: false,
      },
      sessionId
    );
    const loaded = cdp.wait("Page.loadEventFired", sessionId);
    await cdp.send("Page.navigate", { url: origin + path }, sessionId);
    await loaded;
    await cdp.send(
      "Runtime.evaluate",
      {
        expression:
          "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
        awaitPromise: true,
      },
      sessionId
    );
    const { result } = await cdp.send(
      "Runtime.evaluate",
      { expression: MEASURE_JS, returnByValue: true },
      sessionId
    );
    return result.value;
  } finally {
    await cdp.send("Target.closeTarget", { targetId }).catch(() => {});
  }
}

async function ensureDist() {
  try {
    await stat(join(dist, "index.html"));
    await stat(join(dist, "styles.css"));
  } catch {
    console.error("error: dist/ was not found. Run `npm run build` before checking layout.");
    process.exitCode = 1;
    return false;
  }
  return true;
}

async function main() {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile(join(root, "styles.css"), "utf8");
  const errors = [...layoutStyleErrors(css)];
  const paths = publicPaths();

  if (!(await ensureDist())) {
    return;
  }

  const chrome = await findChrome();
  if (!chrome) {
    console.error(
      "error: Chrome/Chromium was not found. Set CHROME_PATH or install Chrome to run overflow checks."
    );
    process.exitCode = 1;
    return;
  }

  const { server, port } = await startStaticServer();
  const origin = `http://127.0.0.1:${port}`;
  const profile = await mkdtemp(join(tmpdir(), "im-layout-"));
  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--mute-audio",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      `--user-data-dir=${profile}`,
      "--remote-debugging-port=0",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  let cdp;
  try {
    const wsUrl = await waitForDevtools(child, 20000);
    cdp = new Cdp(wsUrl);
    await cdp.open();
    for (const path of paths) {
      for (const width of VIEWPORTS) {
        const measurement = await measurePage(cdp, origin, path, width);
        errors.push(...measurementErrors(path, width, measurement));
        const extra = measurement.scrollWidth - measurement.clientWidth;
        console.log(
          `${path} @ ${width}px: clientWidth ${measurement.clientWidth} scrollWidth ${measurement.scrollWidth} extra ${extra}px`
        );
      }
    }
  } finally {
    cdp?.close();
    child.kill("SIGTERM");
    server.close();
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }

  if (errors.length > 0) {
    console.error(
      `Checked ${paths.length} sitemap pages at ${VIEWPORTS.join("/")}px. ${errors.length} layout error(s):\n`
    );
    console.error(errors.map((line) => `- ${line}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(
    `Checked ${paths.length} sitemap pages at ${VIEWPORTS.join("/")}px. Layout overflow OK`
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
  OVERFLOW_TOLERANCE_PX,
  VIEWPORTS,
  findChrome,
  layoutStyleErrors,
  measurementErrors,
  overflowMessage,
  pageOverflows,
  publicPaths,
};
