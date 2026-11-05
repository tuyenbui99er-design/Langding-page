import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { productMedia } from "../lib/media";

test("only present original color assets are mapped to the corresponding variant", () => {
  const root = mkdtempSync(join(tmpdir(), "minimal-media-"));
  const directory = join(root, "public", "product");
  mkdirSync(directory, { recursive: true });
  try {
    for (const file of [
      "nau.jpg",
      "ghi.png",
      "khoi-la.webp",
      "den.jpeg",
      "video.mp4",
      "poster.jpg",
    ])
      writeFileSync(join(directory, file), "test fixture, not a product photo");
    const media = productMedia(root);
    assert.equal(media.byColor["Nâu"], "/product/nau.jpg");
    assert.equal(media.byColor["Ghi"], "/product/ghi.png");
    assert.equal(media.byColor["Khói lạ"], "/product/khoi-la.webp");
    assert.equal(media.byColor["Đen"], "/product/den.jpeg");
    assert.equal(media.byColor["Kem"], null);
    assert.equal(media.byColor["Be khói"], null);
    assert.equal(media.video, "/product/video.mp4");
    assert.equal(media.poster, "/product/poster.jpg");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
