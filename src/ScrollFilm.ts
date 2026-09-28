import { mountScrollFilm as mountNativeFilm } from "./NativeScrollFilm";
import { mountStreamFilm, streamConstructor } from "./StreamFilm";

export function mountScrollFilm(
  canvas: HTMLCanvasElement,
  source: string,
  onDraw: (frame: number) => void,
  onFailure: () => void,
) {
  return streamConstructor()
    ? mountStreamFilm(
        canvas,
        source.replace("/story-hd/", "/story-stream/"),
        onDraw,
        onFailure,
      )
    : mountNativeFilm(canvas, source, onDraw, onFailure);
}
