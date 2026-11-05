import { existsSync } from "node:fs";
import { join } from "node:path";
// Only render real, approved files supplied by the shop. No remote stock photos.
export function productMedia() {
  const available = (file: string) =>
    existsSync(join(process.cwd(), "public", "product", file))
      ? `/product/${file}`
      : null;
  return {
    main: available("main.webp"),
    detail: available("detail.webp"),
    video: available("video.mp4"),
    poster: available("poster.webp"),
  };
}
export type ProductMedia = ReturnType<typeof productMedia>;
