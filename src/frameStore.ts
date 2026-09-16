const LAST_FRAME = 576;
const PACKET_FRAMES = 12;
const RADIUS = 8;

/** Compressed packets survive reverse travel; only nearby images stay decoded. */
export function createFrameStore(changed: () => void) {
  const controller = new AbortController();
  const packets = new Map<number, Promise<ArrayBuffer>>();
  const buffers = new Map<number, ArrayBuffer>();
  const failedPackets = new Set<number>();
  const images = new Map<number, ImageBitmap>();
  const pending = new Set<number>();
  const failed = new Set<number>();
  let queue: number[] = [];
  let center = 0;
  let active = 0;
  let disposed = false;

  function packet(index: number) {
    let request = packets.get(index);
    if (!request) {
      request = fetch(
        `/assets/sequence/portrait-v1/${String(index).padStart(3, "0")}.bin`,
        {
          signal: controller.signal,
        },
      ).then(async (response) => {
        if (!response.ok) throw new Error("Frame packet unavailable");
        const buffer = await response.arrayBuffer();
        const view = new DataView(buffer);
        if (buffer.byteLength < 16 || view.getUint32(0) !== 0x41444643)
          throw new Error("Invalid frame packet");
        const count = view.getUint32(4, true);
        if (
          !count ||
          count > PACKET_FRAMES ||
          buffer.byteLength < 8 + (count + 1) * 4
        )
          throw new Error("Invalid frame count");
        return buffer;
      });
      request = request.then(
        (buffer) => {
          if (!disposed) {
            buffers.set(index, buffer);
            changed();
          }
          return buffer;
        },
        (error: unknown) => {
          if (!disposed) {
            failedPackets.add(index);
            changed();
          }
          throw error;
        },
      );
      packets.set(index, request);
    }
    return request;
  }

  async function decode(frame: number, buffer: ArrayBuffer) {
    if (disposed) return;
    const view = new DataView(buffer);
    const count = view.getUint32(4, true);
    const local = frame % PACKET_FRAMES;
    const header = 8 + (count + 1) * 4;
    if (local >= count) throw new Error("Missing frame");
    const start = header + view.getUint32(8 + local * 4, true);
    const end = header + view.getUint32(12 + local * 4, true);
    if (start < header || end <= start || end > buffer.byteLength)
      throw new Error("Invalid frame bounds");
    const image = await createImageBitmap(
      new Blob([new Uint8Array(buffer, start, end - start)], {
        type: "image/webp",
      }),
    );
    if (disposed || Math.abs(frame - center) > RADIUS) image.close();
    else images.set(frame, image);
  }

  function pump() {
    while (!disposed && active < 2 && queue.length) {
      const frame = queue.shift()!;
      const index = Math.floor(frame / PACKET_FRAMES);
      const buffer = buffers.get(index);
      if (!buffer) {
        // Network waits never occupy image-decode slots. Reversing into a
        // cached packet must remain possible while a future packet is delayed.
        void packet(index).catch(() => {});
        continue;
      }
      active++;
      pending.add(frame);
      void decode(frame, buffer)
        .catch(() => {
          if (!disposed) failed.add(frame);
        })
        .finally(() => {
          active--;
          pending.delete(frame);
          if (!disposed) {
            changed();
            pump();
          }
        });
    }
  }

  return {
    get: (frame: number) => images.get(frame),
    failed: (frame: number) =>
      failed.has(frame) || failedPackets.has(Math.floor(frame / PACKET_FRAMES)),
    prepare(frame: number, direction: number) {
      center = frame;
      for (const [index, image] of images) {
        if (Math.abs(index - center) > RADIUS) {
          image.close();
          images.delete(index);
        }
      }
      const order = [frame];
      for (let offset = 1; offset <= RADIUS; offset++)
        order.push(frame + direction * offset, frame - direction * offset);
      queue = order.filter(
        (index) =>
          index >= 0 &&
          index <= LAST_FRAME &&
          !images.has(index) &&
          !pending.has(index) &&
          !failed.has(index),
      );
      pump();
      // Fetch the next packets before their images enter the decode window.
      // Keep startup focused on the first packet until its first image is ready.
      if (images.has(frame)) {
        const current = Math.floor(frame / PACKET_FRAMES);
        for (const offset of [direction, direction * 2, -direction]) {
          const next = current + offset;
          if (next >= 0 && next <= Math.floor(LAST_FRAME / PACKET_FRAMES))
            void packet(next).catch(() => {});
        }
      }
    },
    dispose() {
      disposed = true;
      controller.abort();
      for (const image of images.values()) image.close();
      images.clear();
      packets.clear();
      buffers.clear();
      queue = [];
    },
  };
}
