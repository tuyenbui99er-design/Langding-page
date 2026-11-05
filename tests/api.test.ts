import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { POST } from "../app/api/orders/route";
import { OrderStore, receiptToken } from "../lib/orders";
const input = {
  productId: "office-pants",
  color: "Kem",
  size: "3XL",
  quantity: 1,
  name: "Người kiểm thử",
  phone: "0900000003",
  address: "Địa chỉ giả lập phục vụ kiểm thử",
  notes: "",
};
test("API validation, real storage, HttpOnly receipt, idempotency, abuse and unavailable DB", async () => {
  const dir = mkdtempSync(join(tmpdir(), "minimal-api-"));
  const originalPath = process.env.DATABASE_PATH;
  const originalOrigin = process.env.APP_ORIGIN;
  process.env.DATABASE_PATH = join(dir, "db.sqlite");
  process.env.APP_ORIGIN = "https://shop.example";
  const key = randomUUID();
  const token = receiptToken();
  const request = (
    body = JSON.stringify(input),
    extra: Record<string, string> = {},
  ) =>
    new NextRequest("https://shop.example/api/orders", {
      method: "POST",
      headers: {
        origin: "https://shop.example",
        "content-type": "application/json",
        "idempotency-key": key,
        "x-receipt-token": token,
        ...extra,
      },
      body,
    });
  try {
    assert.equal((await POST(request("{"))).status, 400);
    assert.equal(
      (await POST(request("", { origin: "https://evil.example" }))).status,
      403,
    );
    assert.equal(
      (await POST(request(JSON.stringify({ ...input, quantity: 1.5 })))).status,
      400,
    );
    assert.equal(
      (
        await POST(
          request(JSON.stringify(input), { "x-receipt-token": "guess" }),
        )
      ).status,
      400,
    );
    const response = await POST(request());
    assert.equal(response.status, 201);
    const cookie = response.headers.get("set-cookie") || "";
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=strict/i);
    const { reference } = await response.json();
    const proxied = await POST(
      new NextRequest("http://internal:3000/api/orders", {
        method: "POST",
        headers: {
          origin: "https://shop.example",
          "content-type": "application/json",
          "idempotency-key": key,
          "x-receipt-token": token,
        },
        body: JSON.stringify(input),
      }),
    );
    assert.equal(proxied.status, 201);
    assert.match(proxied.headers.get("set-cookie") || "", /Secure/i);
    const store = new OrderStore();
    assert.equal(store.get(reference, token)?.total, 189000);
    store.close();
    for (let i = 0; i < 8; i++) {
      const duplicate = await POST(request());
      assert.equal(duplicate.status, 201);
      assert.equal((await duplicate.json()).reference, reference);
    }
    assert.equal((await POST(request())).status, 429);
    process.env.DATABASE_PATH = "/dev/null/unwritable.sqlite";
    const failed = await POST(request());
    assert.equal(failed.status, 503);
    assert.equal((await failed.json()).reference, undefined);
  } finally {
    if (originalPath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = originalPath;
    if (originalOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = originalOrigin;
    rmSync(dir, { recursive: true, force: true });
  }
});
