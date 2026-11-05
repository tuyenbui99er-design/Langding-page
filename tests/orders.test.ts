import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pricing, validateCheckout, InputError, product } from "../lib/product";
import {
  OrderStore,
  receiptToken,
  ConflictError,
  RateLimitError,
  receiptLifetimeMs,
} from "../lib/orders";
const input = {
  productId: product.id,
  color: "Đen",
  size: "M",
  quantity: 1,
  name: "Người thử nghiệm",
  phone: "0900000000",
  address: "Địa chỉ giả lập phục vụ kiểm thử",
  notes: "",
};
test("authoritative integer pricing and order-wide shipping threshold", () => {
  assert.deepEqual(pricing(1), {
    unitPrice: 159000,
    subtotal: 159000,
    shipping: 30000,
    total: 189000,
  });
  assert.equal(pricing(2).total, 318000);
  assert.equal(pricing(3).total, 477000);
  for (const q of [0, -1, 1.5, NaN, Infinity, 21, Number.MAX_SAFE_INTEGER])
    assert.throws(() => pricing(q));
});
test("validates all variants and normalizes Vietnamese phone", () => {
  for (const color of product.colors)
    for (const size of product.sizes)
      assert.equal(validateCheckout({ ...input, color, size }).size, size);
  assert.equal(
    validateCheckout({ ...input, phone: "+84900000000" }).phone,
    "0900000000",
  );
  for (const patch of [
    { color: "fake" },
    { size: "" },
    { productId: "other" },
    { quantity: "2" },
    { quantity: 0 },
    { quantity: 21 },
    { name: "a" },
    { name: "abc\n" },
    { phone: "12345" },
    { phone: "0123456789" },
    { address: "short" },
    { notes: "x".repeat(501) },
  ])
    assert.throws(() => validateCheckout({ ...input, ...patch }), InputError);
  for (const value of [null, [], {}, true])
    assert.throws(() => validateCheckout(value), InputError);
});
test("SQLite commit, server price, idempotency, private access, persistence after reopening", () => {
  const dir = mkdtempSync(join(tmpdir(), "minimal-"));
  const path = join(dir, "orders.sqlite");
  const store = new OrderStore(path);
  const token = receiptToken();
  try {
    const validated = validateCheckout({
      ...input,
      unitPrice: 1,
      total: 1,
      shipping: 14000,
      status: "paid",
    });
    const order = store.place(validated, "same-key", token);
    assert.equal(order.total, 189000);
    assert.equal(order.status, "placed");
    assert.equal(order.payment, "COD");
    assert.equal(
      store.place(validated, "same-key", token).reference,
      order.reference,
    );
    assert.throws(
      () => store.place({ ...validated, quantity: 2 }, "same-key", token),
      ConflictError,
    );
    assert.throws(
      () => store.place(validated, "same-key", receiptToken()),
      ConflictError,
    );
    assert.equal(store.get(order.reference, receiptToken()), undefined);
    assert.equal(store.get("MC-guessed", token), undefined);
    assert.equal(
      store.get(
        order.reference,
        token,
        Date.parse(order.createdAt) + receiptLifetimeMs,
      ),
      undefined,
    );
    store.close();
    const reopened = new OrderStore(path);
    assert.deepEqual(reopened.get(order.reference, token), order);
    assert.notEqual(
      reopened.place(validated, "another-key", token).reference,
      order.reference,
    );
    reopened.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("rate limits survive reopening and reset only at expiry", () => {
  const dir = mkdtempSync(join(tmpdir(), "limits-"));
  const path = join(dir, "orders.sqlite");
  const store = new OrderStore(path);
  store.limit("submit", 2, 1000, 100);
  store.close();
  const reopened = new OrderStore(path);
  try {
    reopened.limit("submit", 2, 1000, 200);
    assert.throws(() => reopened.limit("submit", 2, 1000, 300), RateLimitError);
    reopened.limit("submit", 2, 1000, 1100);
  } finally {
    reopened.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
