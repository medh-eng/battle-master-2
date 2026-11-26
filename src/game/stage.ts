import { landscape } from "./art.ts";
const el = document.querySelector<HTMLElement>("#stage")!;
export async function stage() {
  const painting = landscape();
  el.append(painting);
  // Static scene: render once per resize, with the canvas painting as a GPU-free fallback.
  try {
    const { Application, Sprite, Texture } = await import("pixi.js");
    const app = new Application();
    await app.init({
      autoStart: false,
      preference: "webgl",
      antialias: false,
      resolution: 1,
      hello: false,
    });
    const sprite = new Sprite(Texture.from(painting));
    app.stage.addChild(sprite);
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      app.renderer.resize(w, h);
      const scale = Math.max(w / painting.width, h / painting.height);
      sprite.scale.set(scale);
      sprite.position.set(
        (w - painting.width * scale) / 2,
        (h - painting.height * scale) / 2,
      );
      app.render();
    };
    resize();
    el.replaceChildren(app.canvas);
    new ResizeObserver(resize).observe(el);
  } catch {
    /* Keep the already visible CPU-rendered scene. */
  }
}
