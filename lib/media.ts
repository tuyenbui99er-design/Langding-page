import { existsSync } from "node:fs";
import { join } from "node:path";
import { product } from "./product";
// Only render real, approved files supplied by the shop. No remote stock photos.
const colorFiles = {
  Đen: "den",
  Ghi: "ghi",
  Kem: "kem",
  "Khói lạ": "khoi-la",
  "Be khói": "be-khoi",
  Nâu: "nau",
} as const satisfies Record<(typeof product.colors)[number], string>;
export function productMedia(root = process.cwd()) {
  const available = (base: string, extensions: readonly string[]) => {
    for (const extension of extensions) {
      const file = `${base}.${extension}`;
      if (existsSync(join(root, "public", "product", file)))
        return `/product/${file}`;
    }
    return null;
  };
  const image = (base: string) =>
    available(base, ["webp", "jpg", "jpeg", "png"]);
  return {
    byColor: Object.fromEntries(
      product.colors.map((color) => [color, image(colorFiles[color])]),
    ) as Record<(typeof product.colors)[number], string | null>,
    main: image("main"),
    detail: image("detail"),
    video: available("video", ["mp4"]),
    poster: image("poster"),
  };
}
export type ProductMedia = ReturnType<typeof productMedia>;
