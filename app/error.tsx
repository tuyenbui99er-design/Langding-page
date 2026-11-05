"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="receipt">
      <h1>Chưa thể tải nội dung.</h1>
      <p>
        Vui lòng thử lại sau. Nếu vừa đặt hàng, giữ nguyên trình duyệt để bảo
        toàn quyền xem đơn.
      </p>
      <button onClick={reset}>Thử lại</button>
    </main>
  );
}
