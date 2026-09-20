/* global self, fetch, ReadableStream, Response, URL */
// Only these immutable cinematic files use the range adapter. Page content,
// forms, navigation and all other assets remain entirely browser/network-owned.
const REVISION = "20260920-scroll-a";
const MEDIA_SIZES = {
  "/assets/scroll/landscape-av1.mp4": 6620349,
  "/assets/scroll/landscape-h264.mp4": 9871107,
  "/assets/scroll/landscape-hevc.mp4": 8855012,
  "/assets/scroll/portrait-av1.mp4": 5846920,
  "/assets/scroll/portrait-h264.mp4": 7956893,
  "/assets/scroll/portrait-hevc.mp4": 6990223,
  "/assets/scroll/segment-2/landscape-av1.mp4": 7884767,
  "/assets/scroll/segment-2/landscape-h264.mp4": 11419917,
  "/assets/scroll/segment-2/landscape-hevc.mp4": 9723495,
  "/assets/scroll/segment-2/portrait-av1.mp4": 5465829,
  "/assets/scroll/segment-2/portrait-h264.mp4": 7450468,
  "/assets/scroll/segment-2/portrait-hevc.mp4": 6673569,
  "/assets/scroll/segment-3/landscape-av1.mp4": 6400386,
  "/assets/scroll/segment-3/landscape-h264.mp4": 9074669,
  "/assets/scroll/segment-3/landscape-hevc.mp4": 7436208,
  "/assets/scroll/segment-3/portrait-av1.mp4": 5135380,
  "/assets/scroll/segment-3/portrait-h264.mp4": 6979531,
  "/assets/scroll/segment-3/portrait-hevc.mp4": 5579738,
};
const retained = new Map();
const transfers = new Map();
const MEMORY_LIMIT = 48 * 1024 * 1024;
self.addEventListener("install", (event) =>
  event.waitUntil(self.skipWaiting()),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

function openMovie(url, size) {
  let entry = retained.get(url);
  if (entry) {
    retained.delete(url);
    retained.set(url, entry);
    return entry;
  }
  // Never evict an in-flight response. Completed least-recently-used bytes can
  // be obtained again from the browser HTTP cache if the orientation changes.
  let bytes = [...retained.values()].reduce((n, item) => n + item.size, size);
  for (const [key, item] of retained) {
    if (bytes <= MEMORY_LIMIT) break;
    if (item.done) {
      retained.delete(key);
      bytes -= item.size;
    }
  }
  entry = {
    size,
    chunks: [],
    received: 0,
    done: false,
    error: null,
    waiters: new Set(),
  };
  retained.set(url, entry);
  const transfer = transfers.get(url) ?? {
    requests: 0,
    bytes: 0,
    complete: false,
  };
  transfer.requests += 1;
  transfer.complete = false;
  transfers.set(url, transfer);
  const notify = () => {
    for (const resume of entry.waiters) resume();
    entry.waiters.clear();
  };
  entry.finished = (async () => {
    try {
      const upstream = new URL(url);
      upstream.searchParams.set("media-revision", REVISION);
      const response = await fetch(upstream.href, { cache: "force-cache" });
      if (!response.ok || !response.body) throw new Error("Movie unavailable");
      const reader = response.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (entry.received + value.length > size) {
          await reader.cancel();
          throw new Error("Unexpected movie size");
        }
        entry.chunks.push({ start: entry.received, bytes: value });
        entry.received += value.length;
        transfer.bytes += value.length;
        notify();
      }
      if (entry.received !== size) throw new Error("Incomplete movie");
      entry.done = true;
      transfer.complete = true;
    } catch (error) {
      entry.error = error;
      retained.delete(url);
    } finally {
      notify();
    }
  })();
  return entry;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const size = url.origin === self.location.origin && MEDIA_SIZES[url.pathname];
  if (!size || request.method !== "GET") return;
  const range = request.headers.get("Range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0,
    end = size - 1;
  if (range) {
    if (!match || (!match[1] && !match[2])) {
      event.respondWith(
        new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        }),
      );
      return;
    }
    start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    end =
      match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
    if (
      start >= size ||
      start > end ||
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end)
    ) {
      event.respondWith(
        new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        }),
      );
      return;
    }
  }
  const entry = openMovie(
    new URL(url.pathname, self.location.origin).href,
    size,
  );
  event.waitUntil(entry.finished);
  let offset = start,
    cancelled = false,
    resume;
  const body = new ReadableStream({
    async pull(controller) {
      while (
        !cancelled &&
        offset >= entry.received &&
        !entry.done &&
        !entry.error
      )
        await new Promise((resolve) => {
          resume = resolve;
          entry.waiters.add(resolve);
        });
      if (cancelled) return;
      if (entry.error) {
        controller.error(entry.error);
        return;
      }
      const chunk = entry.chunks.find(
        (c) => offset >= c.start && offset < c.start + c.bytes.length,
      );
      if (!chunk) {
        controller.error(new Error("Incomplete range"));
        return;
      }
      const count = Math.min(
        end - offset + 1,
        chunk.bytes.length - (offset - chunk.start),
      );
      controller.enqueue(
        chunk.bytes.slice(offset - chunk.start, offset - chunk.start + count),
      );
      offset += count;
      if (offset > end) controller.close();
    },
    cancel() {
      cancelled = true;
      if (resume) {
        entry.waiters.delete(resume);
        resume();
      }
    },
  });
  const headers = {
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "Content-Length": String(end - start + 1),
  };
  if (range) headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  event.respondWith(new Response(body, { status: range ? 206 : 200, headers }));
});

// Read-only delivery evidence, queried by browser QA. No visitor data is stored.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "adduco-media-status" || !event.ports[0]) return;
  event.ports[0].postMessage(
    [...transfers].map(([url, value]) => ({ url, ...value })),
  );
});
