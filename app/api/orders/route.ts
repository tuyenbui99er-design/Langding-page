import { NextRequest, NextResponse } from "next/server";
import { validateCheckout, InputError } from "@/lib/product";
import {
  ConflictError,
  RateLimitError,
  OrderStore,
  receiptCookie,
} from "@/lib/orders";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected =
    process.env.APP_ORIGIN ||
    (process.env.NODE_ENV === "development"
      ? `${request.nextUrl.protocol}//${request.headers.get("host")}`
      : null);
  if (!expected)
    return NextResponse.json(
      { error: "Môi trường chưa được cấu hình origin." },
      { status: 503 },
    );
  if (origin !== expected)
    return NextResponse.json(
      { error: "Nguồn yêu cầu không hợp lệ." },
      { status: 403 },
    );
  const key = request.headers.get("idempotency-key") || "";
  const token = request.headers.get("x-receipt-token") || "";
  if (!/^[a-f0-9-]{36}$/.test(key) || !/^[a-f0-9]{64}$/.test(token))
    return NextResponse.json(
      { error: "Mã yêu cầu không hợp lệ." },
      { status: 400 },
    );
  let store: OrderStore | undefined;
  try {
    store = new OrderStore();
    // Global durable circuit breaker; do not trust arbitrary forwarded-IP headers.
    store.limit("submission-global", 120, 60_000);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new InputError("Định dạng dữ liệu không hợp lệ.");
    if (Number(request.headers.get("content-length")) > 8192)
      throw new InputError("Yêu cầu quá lớn.");
    const reader = request.body?.getReader();
    if (!reader) throw new InputError("Thiếu dữ liệu.");
    let body = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) {
        await reader.cancel();
        throw new InputError("Yêu cầu quá lớn.");
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    let raw: unknown;
    try {
      raw = JSON.parse(body);
    } catch {
      throw new InputError("Dữ liệu JSON không hợp lệ.");
    }
    const input = validateCheckout(raw);
    store.limit(`phone:${input.phone}`, 10, 60 * 60_000);
    const order = store.place(input, key, token);
    const response = NextResponse.json(
      { reference: order.reference },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(receiptCookie(order.reference), token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "strict",
      path: `/orders/${order.reference}`,
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    const status =
      error instanceof InputError
        ? 400
        : error instanceof ConflictError
          ? 409
          : error instanceof RateLimitError
            ? 429
            : 503;
    return NextResponse.json(
      {
        error:
          status === 503
            ? "Chưa thể lưu đơn hàng. Vui lòng thử lại với cùng yêu cầu."
            : (error as Error).message,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          ...(status === 429 ? { "Retry-After": "3600" } : {}),
        },
      },
    );
  } finally {
    store?.close();
  }
}
