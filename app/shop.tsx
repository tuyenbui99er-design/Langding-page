"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import type { ProductMedia } from "@/lib/media";
import { useRouter } from "next/navigation";
import { product, pricing, money } from "@/lib/product";
const swatches = [
  "#252422",
  "#999994",
  "#e5dfcf",
  "#7f807a",
  "#b4a18a",
  "#735648",
];
const pendingKey = "minimal.pending-order.v1";
type PendingAttempt = {
  key: string;
  token: string;
  fingerprint: string;
  createdAt: number;
};
async function fingerprint(payload: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
function readPending(): PendingAttempt | null {
  try {
    const item = window.sessionStorage.getItem(pendingKey);
    if (!item) return null;
    const parsed: unknown = JSON.parse(item);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Record<string, unknown>;
    if (
      typeof candidate.key === "string" &&
      /^[a-f0-9-]{36}$/.test(candidate.key) &&
      typeof candidate.token === "string" &&
      /^[a-f0-9]{64}$/.test(candidate.token) &&
      typeof candidate.fingerprint === "string" &&
      /^[a-f0-9]{64}$/.test(candidate.fingerprint) &&
      typeof candidate.createdAt === "number" &&
      candidate.createdAt <= Date.now() &&
      candidate.createdAt > Date.now() - 24 * 60 * 60 * 1000
    ) {
      return candidate as PendingAttempt;
    }
  } catch {
    // Storage may be disabled. Same-page retries still use the React ref.
  }
  return null;
}
function savePending(attempt: PendingAttempt | null) {
  try {
    if (attempt)
      window.sessionStorage.setItem(pendingKey, JSON.stringify(attempt));
    else window.sessionStorage.removeItem(pendingKey);
  } catch {
    // Storage is optional; the API still enforces idempotency for a stable key.
  }
}
export default function Shop({ media }: { media: ProductMedia }) {
  const router = useRouter();
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [gallery, setGallery] = useState(0);
  const [failedMedia, setFailedMedia] = useState<number[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const attempt = useRef<PendingAttempt | null>(null);
  const totals = pricing(quantity);
  const image =
    gallery === 0 ? media.main : gallery === 1 ? media.detail : null;
  const mediaFailed = failedMedia.includes(gallery);
  const markMediaFailed = () =>
    setFailedMedia((previous) =>
      previous.includes(gallery) ? previous : [...previous, gallery],
    );
  function buy() {
    if (!color || !size) {
      setError("Vui lòng chọn màu và kích cỡ trước khi đặt hàng.");
      document
        .getElementById("variants")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setError("");
    setCheckout(true);
    setTimeout(() => document.getElementById("buyer-name")?.focus(), 0);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = JSON.stringify({
      productId: product.id,
      color,
      size,
      quantity,
      name: form.get("name"),
      phone: form.get("phone"),
      address: form.get("address"),
      notes: form.get("notes"),
    });
    try {
      const payloadFingerprint = await fingerprint(payload);
      const previous = attempt.current || readPending();
      if (previous?.fingerprint === payloadFingerprint) {
        attempt.current = previous;
      } else {
        attempt.current = {
          key: crypto.randomUUID(),
          token: Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) =>
            v.toString(16).padStart(2, "0"),
          ).join(""),
          fingerprint: payloadFingerprint,
          createdAt: Date.now(),
        };
        savePending(attempt.current);
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attempt.current.key,
          "X-Receipt-Token": attempt.current.token,
        },
        body: payload,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Không thể lưu đơn hàng.");
      savePending(null);
      attempt.current = null;
      router.push(`/orders/${encodeURIComponent(result.reference)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kết nối bị gián đoạn. Vui lòng thử lại.",
      );
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <section className="media" aria-label="Thư viện sản phẩm">
        {gallery === 2 && media.video && media.poster && !mediaFailed ? (
          <video
            className="real-media"
            controls
            preload="none"
            poster={media.poster}
            aria-label="Video sản phẩm"
            onError={markMediaFailed}
          >
            <source
              src={media.video}
              type="video/mp4"
              onError={markMediaFailed}
            />
            Trình duyệt không hỗ trợ video. Vui lòng xem ảnh sản phẩm.
          </video>
        ) : image && !mediaFailed ? (
          <div className="image-wrap">
            <Image
              src={image}
              alt={`${product.name} — ${gallery === 0 ? "toàn cảnh" : "chi tiết"}`}
              fill
              sizes="(max-width: 520px) 100vw, 496px"
              loading={gallery === 0 ? "eager" : "lazy"}
              onError={markMediaFailed}
            />
          </div>
        ) : (
          <div
            className="placeholder"
            role="img"
            aria-label="Chưa có ảnh sản phẩm thật"
          >
            <span className="media-index">0{gallery + 1} / 03</span>
            <div className="media-copy">
              <span>MINIMAL / ESSENTIAL NO. 01</span>
              <p>
                {
                  [
                    "Không gian cho\nđiều tối giản.",
                    "Góc nhìn\nchi tiết.",
                    "Chuyển động\nmỗi ngày.",
                  ][gallery]
                }
              </p>
              <small>
                {mediaFailed
                  ? "KHÔNG TẢI ĐƯỢC TÀI NGUYÊN"
                  : gallery === 2
                    ? "VIDEO SẢN PHẨM ĐANG CHỜ CUNG CẤP"
                    : "ẢNH SẢN PHẨM ĐANG CHỜ CUNG CẤP"}
              </small>
            </div>
            <span className="vertical">FORM / FUNCTION / EVERYDAY</span>
          </div>
        )}
        <div className="gallery-tabs">
          {["Ảnh chính", "Chi tiết", "Video"].map((label, i) => (
            <button
              key={label}
              type="button"
              aria-pressed={gallery === i}
              onClick={() => setGallery(i)}
            >
              {label}
              <span>0{i + 1}</span>
            </button>
          ))}
        </div>
        <p className="media-note">
          {mediaFailed
            ? "Không tải được tệp sản phẩm. Vui lòng thử lại sau."
            : !image && !(gallery === 2 && media.video && media.poster)
              ? "Khung minh họa bố cục, không phải hình ảnh sản phẩm. Đang chờ tài nguyên được nhà bán hàng xác nhận."
              : "Hình ảnh / video do nhà bán hàng cung cấp."}
        </p>
      </section>
      <section className="product">
        <span className="eyebrow">MINIMAL CLOTHING — WOMENSWEAR</span>
        <h1>{product.name}</h1>
        <p className="subtitle">{product.subtitle}</p>
        <div className="price">
          <strong>{money(product.price)}</strong>
          <del>{money(product.compareAt)}</del>
          <span>GIÁ ƯU ĐÃI</span>
        </div>
        <p className="shipping">Miễn phí vận chuyển khi mua từ 2 sản phẩm</p>
        <div id="variants">
          <fieldset disabled={busy}>
            <legend>
              Màu sắc <span>{color || "Chọn màu của bạn"}</span>
            </legend>
            <div className="colors">
              {product.colors.map((c, i) => (
                <button
                  type="button"
                  key={c}
                  aria-pressed={c === color}
                  onClick={() => setColor(c)}
                >
                  <i style={{ background: swatches[i] }} />
                  {c}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={busy}>
            <legend>
              Kích cỡ <span>Chọn kích cỡ</span>
            </legend>
            <div className="sizes">
              {product.sizes.map((s) => (
                <button
                  type="button"
                  aria-pressed={size === s}
                  key={s}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="quantity">
            <label htmlFor="quantity">Số lượng</label>
            <div>
              <button
                type="button"
                disabled={busy || quantity <= 1}
                aria-label="Giảm số lượng"
                onClick={() => setQuantity(quantity - 1)}
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max="20"
                value={quantity}
                disabled={busy}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 1 && n <= 20) setQuantity(n);
                }}
              />
              <button
                type="button"
                disabled={busy || quantity >= 20}
                aria-label="Tăng số lượng"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
        <dl className="totals" aria-live="polite">
          <div>
            <dt>Tạm tính</dt>
            <dd>{money(totals.subtotal)}</dd>
          </div>
          <div>
            <dt>Phí giao hàng</dt>
            <dd>{money(totals.shipping)}</dd>
          </div>
          <div className="grand">
            <dt>Tổng thanh toán</dt>
            <dd>{money(totals.total)}</dd>
          </div>
        </dl>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {checkout && (
          <section className="checkout" aria-labelledby="checkout-title">
            <span className="eyebrow">HOÀN TẤT ĐƠN HÀNG</span>
            <h2 id="checkout-title">Gửi đến bạn.</h2>
            <p>
              {color} / {size} · {quantity} sản phẩm
            </p>
            <form onSubmit={submit}>
              <fieldset disabled={busy}>
                <label htmlFor="buyer-name">Họ và tên</label>
                <input
                  id="buyer-name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                />
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  maxLength={16}
                />
                <label htmlFor="address">Địa chỉ nhận hàng đầy đủ</label>
                <input
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                  required
                  minLength={15}
                  maxLength={300}
                />
                <label htmlFor="notes">Ghi chú (không bắt buộc)</label>
                <textarea id="notes" name="notes" maxLength={500} />
                <p className="notice">
                  COD · Thanh toán {money(totals.total)} khi nhận hàng. Đơn mới
                  ở trạng thái đã đặt, chưa thanh toán. Thông tin được lưu để xử
                  lý đơn; không nhập dữ liệu thật khi đang thử nghiệm.
                </p>
                <button className="primary" type="submit">
                  {busy
                    ? "Đang lưu đơn…"
                    : `Đặt hàng COD · ${money(totals.total)}`}
                </button>
              </fieldset>
            </form>
          </section>
        )}
      </section>
      <div className="purchase-bar">
        <div>
          <small>{quantity} sản phẩm · COD</small>
          <strong>{money(totals.total)}</strong>
        </div>
        <button className="primary" type="button" onClick={buy} disabled={busy}>
          {checkout ? "Thông tin nhận hàng" : "Mua ngay"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </>
  );
}
