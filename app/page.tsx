import Shop from "./shop";
import SizeChart from "./size-chart";
import { productMedia } from "@/lib/media";
import { product } from "@/lib/product";
export default function Page() {
  return (
    <main>
      <div className="intro">
        <span>BỘ SƯU TẬP THIẾT YẾU</span>
        <p>Thanh lịch, theo cách của bạn.</p>
      </div>
      <Shop media={productMedia()} />
      <section className="details">
        <span className="eyebrow">THÔNG TIN SẢN PHẨM</span>
        <h2>
          Dáng suông. Cạp cao.
          <br />
          Dễ phối mỗi ngày.
        </h2>
        <p>
          {product.name} — {product.subtitle.toLowerCase()}. Có 6 màu và kích cỡ
          S–3XL.
        </p>
        <details>
          <summary>Chất liệu & mô tả</summary>
          <p>
            Chất liệu và hướng dẫn bảo quản đang chờ nhà bán hàng xác nhận. Chưa
            có căn cứ để công bố “vintex xuất khẩu”.
          </p>
        </details>
        <details>
          <summary>Bảng kích cỡ</summary>
          <SizeChart />
        </details>
        <details>
          <summary>Giao hàng & đổi trả</summary>
          <p>
            Phí giao hàng 30.000đ cho 1 sản phẩm; miễn phí từ 2 sản phẩm trong
            đơn. Thanh toán COD khi nhận hàng.
          </p>
          <p>
            Thời gian giao hàng, điều kiện đổi trả và bảo hành đang chờ nhà bán
            hàng xác nhận. Không áp dụng lời hứa 3 ngày/3 tháng khi chưa có
            chứng cứ.
          </p>
        </details>
        <p className="notice">
          Bản phát triển · chưa mở bán công khai. Tồn kho thực tế chưa được kết
          nối; đặt đơn không đồng nghĩa đã xác nhận còn hàng.
        </p>
      </section>
    </main>
  );
}
