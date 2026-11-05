import Link from "next/link";
export default function NotFound() {
  return (
    <main className="receipt">
      <h1>Không tìm thấy trang.</h1>
      <p>
        Nếu đây là đơn hàng, hãy dùng trình duyệt đã đặt đơn với khóa truy cập
        còn hiệu lực.
      </p>
      <Link href="/">Về trang sản phẩm</Link>
    </main>
  );
}
