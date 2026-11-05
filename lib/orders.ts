import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { type Checkout, pricing } from "./product";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export type Order = Checkout &
  ReturnType<typeof pricing> & {
    reference: string;
    status: "placed";
    payment: "COD";
    createdAt: string;
  };
export const receiptLifetimeMs = 30 * 24 * 60 * 60 * 1000;
export class ConflictError extends Error {}
export class RateLimitError extends Error {}
export class OrderStore {
  private db: DatabaseSync;
  constructor(path = process.env.DATABASE_PATH || "./data/orders.sqlite") {
    if (path !== ":memory:")
      mkdirSync(dirname(resolve(/* turbopackIgnore: true */ path)), {
        recursive: true,
        mode: 0o700,
      });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS orders (reference TEXT PRIMARY KEY, idem TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, token_hash TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);`);
  }
  close() {
    this.db.close();
  }
  limit(key: string, max: number, windowMs: number, now = Date.now()) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare("DELETE FROM limits WHERE expires <= ?").run(now);
      const row = this.db
        .prepare("SELECT count FROM limits WHERE key = ?")
        .get(key) as { count: number } | undefined;
      if (row && row.count >= max)
        throw new RateLimitError(
          "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
        );
      this.db
        .prepare(
          "INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
        )
        .run(key, now + windowMs);
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  place(input: Checkout, idempotency: string, token: string): Order {
    const fingerprint = digest(JSON.stringify(input));
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.db
        .prepare(
          "SELECT fingerprint, token_hash, payload FROM orders WHERE idem = ?",
        )
        .get(digest(idempotency)) as
        | { fingerprint: string; token_hash: string; payload: string }
        | undefined;
      if (existing) {
        if (
          existing.fingerprint !== fingerprint ||
          existing.token_hash !== digest(token)
        )
          throw new ConflictError("Yêu cầu đã dùng cho một đơn khác.");
        this.db.exec("COMMIT");
        return JSON.parse(existing.payload) as Order;
      }
      const order: Order = {
        ...input,
        ...pricing(input.quantity),
        reference: `MC-${randomUUID()}`,
        status: "placed",
        payment: "COD",
        createdAt: new Date().toISOString(),
      };
      this.db
        .prepare("INSERT INTO orders VALUES (?,?,?,?,?)")
        .run(
          order.reference,
          digest(idempotency),
          fingerprint,
          digest(token),
          JSON.stringify(order),
        );
      this.db.exec("COMMIT");
      return order;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  get(reference: string, token: string, now = Date.now()): Order | undefined {
    const row = this.db
      .prepare(
        "SELECT payload FROM orders WHERE reference = ? AND token_hash = ?",
      )
      .get(reference, digest(token)) as { payload: string } | undefined;
    if (!row) return undefined;
    const order = JSON.parse(row.payload) as Order;
    return now - Date.parse(order.createdAt) < receiptLifetimeMs
      ? order
      : undefined;
  }
}
export function receiptToken() {
  return randomBytes(32).toString("hex");
}
export const receiptCookie = (reference: string) => `mc_receipt_${reference}`;
