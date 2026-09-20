/** Capability predictions are a conservative gate, not a device smoothness guarantee. */
export type ScrollCodec = "av1" | "hevc" | "h264";
const types = {
  av1: 'video/mp4; codecs="av01.0.08M.08"',
  hevc: 'video/mp4; codecs="hvc1.1.6.L120.B0"',
};
export async function selectScrollCodec(
  portrait: boolean,
): Promise<ScrollCodec> {
  if (!navigator.mediaCapabilities?.decodingInfo) return "h264";
  // Repeated real-frame tests expose stalled AV1 seeks in WebKit despite a
  // positive decodingInfo result. Prefer its tested HEVC path, then H.264.
  const webKit =
    /AppleWebKit/.test(navigator.userAgent) &&
    !/(Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent);
  const probe = async (codec: "av1" | "hevc") => {
    try {
      const info = await navigator.mediaCapabilities.decodingInfo({
        type: "file",
        video: {
          contentType: types[codec],
          width: portrait ? 900 : 1920,
          height: portrait ? 1600 : 1080,
          bitrate: codec === "av1" ? 6_600_000 : 9_000_000,
          framerate: 24,
        },
      });
      return info.supported && info.smooth && info.powerEfficient;
    } catch {
      return false;
    }
  };
  let timer: number | undefined;
  try {
    return await Promise.race([
      Promise.all([
        webKit ? Promise.resolve(false) : probe("av1"),
        probe("hevc"),
      ]).then(([av1, hevc]): ScrollCodec =>
        av1 ? "av1" : hevc ? "hevc" : "h264",
      ),
      new Promise<ScrollCodec>((resolve) => {
        timer = window.setTimeout(() => resolve("h264"), 200);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
