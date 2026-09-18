/** Warm the same native decoders that will play; never bridge a fetch cache. */
export function prepareNativeSequence<Clip extends { video: HTMLVideoElement }>(
  clips: readonly Clip[],
  prepare: (clip: Clip) => HTMLVideoElement,
  allowed: () => boolean,
) {
  let started = false;
  let cursor = 0;
  const fullyBuffered = (video: HTMLVideoElement) =>
    Number.isFinite(video.duration) &&
    video.duration > 0 &&
    video.buffered.length === 1 &&
    video.buffered.start(0) === 0 &&
    video.buffered.end(0) >= video.duration - 0.001;

  const advance = () => {
    if (!started || !allowed()) return;
    // canplaythrough is a prediction, not download completion. Wait for the
    // complete buffered range before starting the next background transfer.
    while (cursor < clips.length) {
      const clip = clips[cursor];
      if (!fullyBuffered(clip.video) && !clip.video.error) break;
      cursor++;
      if (cursor < clips.length) prepare(clips[cursor]);
    }
  };
  const ready = () => {
    if (clips[0].video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) return;
    started = true;
    advance();
  };
  clips[0].video.addEventListener("canplaythrough", ready);
  for (const { video } of clips)
    for (const event of ["progress", "canplaythrough", "suspend", "error"])
      video.addEventListener(event, advance);

  return {
    active: () => started && cursor < clips.length && allowed(),
    resume: advance,
    reset: () => {
      started = false;
      cursor = 0;
    },
    dispose: () => {
      started = false;
      clips[0].video.removeEventListener("canplaythrough", ready);
      for (const { video } of clips)
        for (const event of ["progress", "canplaythrough", "suspend", "error"])
          video.removeEventListener(event, advance);
    },
  };
}
