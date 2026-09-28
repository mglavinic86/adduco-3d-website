// Compressed media cache: at most 20 parts for each of two orientations.
// Fetch each complete part once, avoiding overlapping native HTTP range downloads.
const media = new Map<string, Promise<Blob>>();
function loadPart(url: string) {
  let request = media.get(url);
  if (!request) {
    const controller = new AbortController();
    const deadline = window.setTimeout(() => controller.abort(), 10000);
    request = fetch(url, { cache: "force-cache", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Film ${response.status}`);
        return response.blob();
      })
      .catch((error) => {
        media.delete(url);
        throw error;
      })
      .finally(() => clearTimeout(deadline));
    media.set(url, request);
  }
  return request;
}

/** One decoder, one visible canvas. Only the latest document position can draw. */
export function mountScrollFilm(
  canvas: HTMLCanvasElement,
  source: string,
  onDraw: (frame: number) => void,
  onFailure: () => void,
) {
  const context = canvas.getContext("2d", { alpha: false })!;
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.className = "story-decoder";
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  canvas.parentElement!.append(video);
  let target = 0,
    pending = -1,
    shown = -1,
    disposed = false;
  let loadedPart = -1,
    loadingPart = -1,
    failedPart = -1,
    objectURL = "";
  let timeout = 0;
  const partOf = (frame: number) => Math.min(19, Math.floor(frame / 24));
  const url = (part: number) =>
    `${source}/part-${String(part).padStart(2, "0")}.mp4`;
  const fail = () => {
    clearTimeout(timeout);
    pending = -1;
    failedPart = partOf(target);
    if (!disposed) onFailure();
  };
  const pump = () => {
    if (disposed || pending >= 0 || shown === target) return;
    const part = partOf(target);
    if (part === failedPart) return;
    if (loadedPart !== part) {
      if (loadingPart === part) return;
      loadingPart = part;
      loadPart(url(part))
        .then((blob) => {
          if (disposed || partOf(target) !== part) return;
          loadedPart = part;
          loadingPart = -1;
          if (objectURL) URL.revokeObjectURL(objectURL);
          objectURL = URL.createObjectURL(blob);
          video.src = objectURL;
          video.load();
          // One adjacent part is enough to prepare ordinary forward movement.
          if (target > 0)
            void loadPart(url(part < 19 ? part + 1 : part - 1)).catch(() => {});
        })
        .catch(() => {
          if (!disposed && partOf(target) === part) {
            loadingPart = -1;
            fail();
          }
        });
      return;
    }
    // Let the first frame decode before seeking: WebKit can delay seeked by
    // one second when a new source is sought during metadata loading.
    if (video.readyState < 2) return;
    pending = target;
    timeout = window.setTimeout(fail, 8000);
    // Midpoints avoid rounding onto the preceding frame at part boundaries.
    video.currentTime = Math.min(
      (pending - loadedPart * 24 + 0.5) / 24,
      video.duration - 0.001,
    );
  };
  const present = () => {
    if (video.seeking || pending < 0) return;
    clearTimeout(timeout);
    // loadeddata preceded seeking; seeked now provides the decoded target.
    if (disposed) return;
    if (
      pending === target &&
      loadedPart === partOf(target) &&
      video.readyState >= 2
    ) {
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      context.drawImage(video, 0, 0);
      shown = pending;
      canvas.dataset.frame = String(shown);
      canvas.dataset.mediaTime = String(loadedPart + video.currentTime);
      onDraw(shown);
    }
    pending = -1;
    pump();
  };
  video.addEventListener("loadeddata", pump);
  video.addEventListener("seeked", present);
  video.addEventListener("error", fail);
  return {
    seek(frame: number) {
      const next = Math.max(0, Math.min(480, frame));
      if (partOf(next) !== partOf(target)) failedPart = -1;
      target = next;
      pump();
      // Keep the initial visit light; prepare the next second once scrolling starts.
      if (next > 0 && loadedPart === partOf(next)) {
        const part = partOf(next);
        void loadPart(url(part < 19 ? part + 1 : part - 1)).catch(() => {});
      }
    },
    dispose() {
      disposed = true;
      clearTimeout(timeout);
      video.removeEventListener("loadeddata", pump);
      video.removeEventListener("seeked", present);
      video.removeEventListener("error", fail);
      video.removeAttribute("src");
      video.load();
      video.remove();
      if (objectURL) URL.revokeObjectURL(objectURL);
    },
  };
}
