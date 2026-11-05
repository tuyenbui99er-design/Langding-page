import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Minimal Clothing | Quần ống suông cạp cao",
  description:
    "Chọn màu, kích cỡ và đặt quần công sở Minimal Clothing. Thanh toán khi nhận hàng.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <header className="brand">
          <Link href="/" aria-label="Minimal Clothing — trang chủ">
            minimal<span>CLOTHING / EVERYDAY ESSENTIALS</span>
          </Link>
          <span className="edition">01 — CÔNG SỞ</span>
        </header>
        {children}
        <footer>MINIMAL CLOTHING · Tối giản mỗi ngày</footer>
      </body>
    </html>
  );
}
