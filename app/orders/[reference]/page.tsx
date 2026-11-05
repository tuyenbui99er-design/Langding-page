import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { OrderStore, receiptCookie } from "@/lib/orders";
import { money, product } from "@/lib/product";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Đơn hàng | Minimal Clothing",
  robots: { index: false, follow: false },
};
export default async function Receipt({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  if (!/^MC-[a-f0-9-]{36}$/.test(reference)) notFound();
  const jar = await cookies();
  const token = jar.get(receiptCookie(reference))?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) notFound();
  const store = new OrderStore();
  const order = (() => {
    try {
      return store.get(reference, token);
    } finally {
      store.close();
    }
  })();
  if (!order) notFound();
  return (
    <main className="receipt">
      <span className="eyebrow">ĐƠN HÀNG ĐÃ ĐƯỢC LƯU</span>
      <h1>Cảm ơn bạn.</h1>
      <p>Đã đặt hàng · COD · Chưa thanh toán</p>
      <p className="reference">{order.reference}</p>
      <h2>{product.name}</h2>
      <p>
        {order.color} / {order.size} · Số lượng {order.quantity}
      </p>
      <dl className="totals">
        <div>
          <dt>Tạm tính</dt>
          <dd>{money(order.subtotal)}</dd>
        </div>
        <div>
          <dt>Phí giao hàng</dt>
          <dd>{money(order.shipping)}</dd>
        </div>
        <div className="grand">
          <dt>Thanh toán khi nhận</dt>
          <dd>{money(order.total)}</dd>
        </div>
      </dl>
      <h2>Thông tin nhận hàng</h2>
      <p>{order.name}</p>
      <p>{order.phone}</p>
      <p>{order.address}</p>
      {order.notes && <p>Ghi chú: {order.notes}</p>}
      <p className="notice">
        Trang này chỉ mở được trong trình duyệt đã đặt hàng nhờ khóa truy cập
        riêng, có hiệu lực 30 ngày. Giữ trình duyệt này để xem lại đơn; mã đơn
        riêng lẻ không cấp quyền xem thông tin. Tồn kho và thời gian giao đang
        chờ xác nhận.
      </p>
      <Link className="text-link" href="/">
        Tiếp tục xem sản phẩm ↗
      </Link>
    </main>
  );
}
