import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
let server: Server;
let origin: string;
let movieRequests: string[];
let movieBytes: Map<string, number>;
let workerUnavailable = false;
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://localhost");
    const file = path.resolve(
      "dist",
      "." + (url.pathname === "/" ? "/index.html" : url.pathname),
    );
    try {
      if (workerUnavailable && url.pathname === "/media-delivery-worker.js")
        throw new Error("Unavailable worker");
      await stat(file);
      const types: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".mp4": "video/mp4",
        ".webp": "image/webp",
        ".woff2": "font/woff2",
      };
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] ?? "application/octet-stream",
      );
      if (url.pathname === "/") {
        res.end(
          (await readFile(file, "utf8")).replace(
            "<html ",
            '<html data-range-delivery="true" ',
          ),
        );
        return;
      }
      const stream = createReadStream(file);
      if (file.endsWith(".mp4")) {
        movieRequests.push(url.pathname);
        stream.on("data", (chunk) => {
          movieBytes.set(
            url.pathname,
            (movieBytes.get(url.pathname) ?? 0) + chunk.length,
          );
        });
      }
      // Reproduce Sites: ignore Range and send a chunked 200 without length.
      stream.pipe(res);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((r) => server.close(() => r()));
});
for (const width of [390, 1440])
  test(`no-range hosting presents and reverses every movie at ${width} with one upstream request per movie`, async ({
    page,
  }) => {
    movieRequests = [];
    movieBytes = new Map();
    workerUnavailable = false;
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(origin);
    const v = page.locator("video").first();
    await expect
      .poll(() => v.evaluate((v: HTMLVideoElement) => v.readyState))
      .toBe(4);
    const times = await page.evaluate(async () => {
      const films = [...document.querySelectorAll("video")];
      const h = document.querySelector<HTMLElement>(".chapter")!.clientHeight;
      const result = [];
      for (const i of [0, 1, 2, 1, 0])
        for (const p of [0.3, 0.8, 0.2]) {
          const v = films[i];
          result.push(
            await new Promise<number>((resolve) => {
              const watch: VideoFrameRequestCallback = (_, m) =>
                Math.abs(m.mediaTime / 8 - p) < 0.015
                  ? resolve(m.mediaTime)
                  : v.requestVideoFrameCallback(watch);
              v.requestVideoFrameCallback(watch);
              scrollTo(0, ([0.3, 3.2, 6.1][i] + 2.1 * p) * h);
            }),
          );
        }
      return result;
    });
    expect(times[0]).toBeGreaterThan(2);
    expect(times[1]).toBeGreaterThan(6);
    expect(times[2]).toBeLessThan(2);
    const selected = await v.evaluate(
      (v: HTMLVideoElement) => new URL(v.currentSrc).pathname,
    );
    const size = (await stat(path.join("public", selected))).size;
    await expect.poll(() => movieBytes.get(selected)).toBe(size);
    const ranges = await page.evaluate(async (url) => {
      const results = [];
      for (const range of [
        "bytes=100-119",
        "bytes=-16",
        "bytes=999999999-",
        "bytes=0-1,5-6",
      ]) {
        const response = await fetch(url, { headers: { Range: range } });
        results.push({
          status: response.status,
          range: response.headers.get("Content-Range"),
          bytes: [...new Uint8Array(await response.arrayBuffer())],
        });
      }
      return results;
    }, selected);
    const source = await readFile(path.join("public", selected));
    expect(ranges[0]).toEqual({
      status: 206,
      range: `bytes 100-119/${size}`,
      bytes: [...source.subarray(100, 120)],
    });
    expect(ranges[1]).toEqual({
      status: 206,
      range: `bytes ${size - 16}-${size - 1}/${size}`,
      bytes: [...source.subarray(-16)],
    });
    expect(ranges[2].status).toBe(416);
    expect(ranges[3].status).toBe(416);
    for (const movie of new Set(movieRequests)) {
      expect(movieRequests.filter((url) => url === movie)).toHaveLength(1);
      await expect
        .poll(() => movieBytes.get(movie))
        .toBe((await stat(path.join("public", movie))).size);
    }
    await page
      .getByRole("link", { name: "Razgovarajmo o vašem projektu", exact: true })
      .first()
      .click();
    await expect(page.locator("#kontakt")).toBeInViewport();
  });

test("unavailable delivery worker keeps artwork, captions and contact without movie downloads", async ({
  page,
}) => {
  workerUnavailable = true;
  movieRequests = [];
  movieBytes = new Map();
  await page.goto(origin);
  await page
    .getByRole("link", { name: "3 — Visokogradnja", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Gradimo u visinu." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Razgovarajmo o vašem projektu", exact: true })
    .first()
    .click();
  await expect(page.locator("#kontakt")).toBeInViewport();
  expect(movieRequests).toEqual([]);
});
