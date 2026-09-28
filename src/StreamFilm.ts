// Compressed bytes are shared across rotations, never decoded frame bitmaps.
// Each orientation has one initialization plus 41/81 HEVC or 21 AVC fragments.
const cache = new Map<string, ArrayBuffer>();
const avcMime = 'video/mp4; codecs="avc1.640028"';
const hevcMime = 'video/mp4; codecs="hvc1.1.6.L120.B0"';
export function streamConstructor() {
  const host = globalThis as typeof globalThis & {
    ManagedMediaSource?: typeof MediaSource;
  };
  const constructor = host.MediaSource || host.ManagedMediaSource;
  return constructor?.isTypeSupported(avcMime) ? constructor : undefined;
}

export function mountStreamFilm(
  canvas: HTMLCanvasElement,
  source: string,
  onDraw: (frame: number) => void,
  onFailure: () => void,
) {
  const Constructor = streamConstructor()!;
  const efficient = Constructor.isTypeSupported(hevcMime);
  const mime = efficient ? hevcMime : avcMime;
  const framesPerPart = efficient
    ? source.endsWith("/landscape")
      ? 6
      : 12
    : 24;
  const lastPart = Math.floor(480 / framesPerPart);
  if (efficient) source = source.replace("/story-stream/", "/story-hevc/");
  const stream = new Constructor();
  canvas.dataset.codec = efficient ? "hevc" : "avc";
  const video = document.createElement("video");
  const context = canvas.getContext("2d", { alpha: false })!;
  video.muted = true;
  video.playsInline = true;
  video.disableRemotePlayback = true;
  video.preload = "auto";
  video.className = "story-decoder";
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  canvas.parentElement!.append(video);
  const objectURL = URL.createObjectURL(stream);
  video.src = objectURL;
  let buffer: SourceBuffer | undefined;
  let disposed = false,
    target = 0,
    shown = -1,
    pending = -1;
  let direction = 0,
    inputAt = 0,
    appending: number | null = null;
  let initialized = false;
  let seekTimer = 0;
  const ready = new Set<number>();
  const failed = new Set<number>();
  const downloads = new Map<number, AbortController>();
  const queued = new Map<number, ArrayBuffer>();
  const partOf = (frame: number) => Math.floor(frame / framesPerPart);
  const url = (part: number) =>
    `${source}/${part < 0 ? "init.mp4" : `part-${String(part).padStart(2, "0")}.m4s`}`;
  const fail = () => {
    if (!disposed) onFailure();
  };

  function append() {
    if (
      disposed ||
      !buffer ||
      buffer.updating ||
      appending !== null ||
      !queued.size
    )
      return;
    const part = [...queued.keys()].sort(
      (a, b) => Math.abs(a - partOf(target)) - Math.abs(b - partOf(target)),
    )[0];
    const bytes = queued.get(part)!;
    queued.delete(part);
    appending = part;
    try {
      buffer.appendBuffer(bytes);
    } catch {
      appending = null;
      failed.add(part);
      fail();
    }
  }
  function fetchPart(part: number) {
    if (
      disposed ||
      ready.has(part) ||
      queued.has(part) ||
      downloads.has(part) ||
      appending === part ||
      failed.has(part)
    )
      return;
    const address = url(part),
      existing = cache.get(address);
    if (existing) {
      queued.set(part, existing);
      append();
      return;
    }
    const controller = new AbortController();
    downloads.set(part, controller);
    const deadline = window.setTimeout(() => controller.abort(), 10000);
    fetch(address, { cache: "force-cache", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Film ${response.status}`);
        return response.arrayBuffer();
      })
      .then((bytes) => {
        cache.set(address, bytes);
        if (!disposed) {
          queued.set(part, bytes);
          append();
        }
      })
      .catch(() => {
        if (!disposed) {
          failed.add(part);
          if (part < 0 || part === partOf(target)) fail();
        }
      })
      .finally(() => {
        clearTimeout(deadline);
        downloads.delete(part);
        if (!disposed) {
          download();
          seek();
        }
      });
  }
  function hasFrame(frame: number) {
    if (!buffer) return false;
    const time = (frame + 2.5) / 24,
      ranges = buffer.buffered;
    for (let i = 0; i < ranges.length; i++)
      if (time >= ranges.start(i) && time < ranges.end(i)) return true;
    return false;
  }
  function download() {
    if (disposed || !initialized) return;
    const part = partOf(target);
    // ManagedMediaSource may evict its native buffer at any time. Reappend
    // retained compressed bytes rather than seeking forever into a stale range.
    if (ready.has(part) && !hasFrame(target)) ready.delete(part);
    if (downloads.size < 2) fetchPart(part);
    // Priorities are recomputed from the current scroll position; there is no
    // queue of obsolete scroll targets. Speculative prefetch starts only when
    // the requested fragment is ready, so it cannot compete with its own load.
    if (ready.has(part) && direction && downloads.size < 2) {
      const next = part + direction;
      if (next >= 0 && next <= lastPart) fetchPart(next);
    }
  }
  function availableFrame() {
    if (ready.has(partOf(target)) && hasFrame(target)) return target;
    // During live input, a completed nearby fragment can make progress instead
    // of starving until the user stops. Never replay intermediate targets after
    // stopping, and never move opposite to the user's most recent direction.
    if (!direction || performance.now() - inputAt > 100) return -1;
    const candidates = [...ready].map((part) =>
      Math.max(
        part * framesPerPart,
        Math.min(
          target,
          Math.min(480, part * framesPerPart + framesPerPart - 1),
        ),
      ),
    );
    return (
      candidates
        .filter(hasFrame)
        .filter((frame) =>
          direction > 0
            ? frame > shown && frame <= target
            : frame < shown && frame >= target,
        )
        .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0] ?? -1
    );
  }
  function seek() {
    if (disposed || pending >= 0 || video.readyState < 1) return;
    const frame = availableFrame();
    if (frame < 0 || frame === shown) return;
    pending = frame;
    clearTimeout(seekTimer);
    seekTimer = window.setTimeout(() => {
      // A seek at a buffered edge must not hold newer input hostage.
      if (!disposed && pending >= 0 && pending !== target) {
        pending = -1;
        seek();
      }
    }, 80);
    video.currentTime = (frame + 2.5) / 24;
  }
  function present() {
    if (disposed || video.seeking || pending < 0 || video.readyState < 2)
      return;
    const frame = pending;
    clearTimeout(seekTimer);
    pending = -1;
    const moving = performance.now() - inputAt <= 100;
    const toward =
      direction > 0
        ? frame > shown && frame <= target
        : direction < 0 && frame < shown && frame >= target;
    if (frame === target || (moving && toward)) {
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      context.drawImage(video, 0, 0);
      shown = frame;
      canvas.dataset.frame = String(frame);
      canvas.dataset.mediaTime = String(video.currentTime - 2 / 24);
      onDraw(frame);
    }
    seek();
  }
  function updated() {
    if (disposed) return;
    if (appending === -1) {
      initialized = true;
      stream.duration = 483 / 24;
    } else if (appending !== null) ready.add(appending);
    appending = null;
    // Flush reordered pictures at the last buffered edge. An append after EOS
    // reopens the same MediaSource; no source/decoder is replaced.
    if (
      initialized &&
      ready.size &&
      !queued.size &&
      stream.readyState === "open"
    )
      stream.endOfStream();
    append();
    download();
    // New data can satisfy a more recent target while an edge seek was waiting.
    if (pending >= 0 && pending !== target) pending = -1;
    seek();
  }
  function open() {
    if (disposed) return;
    try {
      buffer = stream.addSourceBuffer(mime);

      buffer.addEventListener("updateend", updated);
      buffer.addEventListener("error", fail);
      fetchPart(-1);
    } catch {
      fail();
    }
  }
  stream.addEventListener("sourceopen", open, { once: true });
  video.addEventListener("loadedmetadata", seek);
  video.addEventListener("loadeddata", seek);
  video.addEventListener("seeked", present);
  video.addEventListener("error", fail);
  return {
    seek(frame: number) {
      const next = Math.max(0, Math.min(480, frame));
      if (next !== target) {
        direction = Math.sign(next - target);
        inputAt = performance.now();
      }
      target = next;
      download();
      seek();
    },
    dispose() {
      disposed = true;
      clearTimeout(seekTimer);
      for (const controller of downloads.values()) controller.abort();
      queued.clear();
      stream.removeEventListener("sourceopen", open);
      buffer?.removeEventListener("updateend", updated);
      buffer?.removeEventListener("error", fail);
      video.removeEventListener("loadedmetadata", seek);
      video.removeEventListener("loadeddata", seek);
      video.removeEventListener("seeked", present);
      video.removeEventListener("error", fail);
      video.removeAttribute("src");
      video.load();
      video.remove();
      URL.revokeObjectURL(objectURL);
    },
  };
}
