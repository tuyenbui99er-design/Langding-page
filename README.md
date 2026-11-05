# Minimal Clothing

Ứng dụng thương mại mobile-first: Next.js 16 App Router, React 19, TypeScript, CSS thuần và SQLite lưu đơn COD thật. CSS thuần giữ nền tảng nhỏ, không cần thư viện UI hoặc pipeline Tailwind cho một trang sản phẩm. Chưa triển khai production.

## Chạy trong môi trường đám mây / local

Yêu cầu **Node.js 24.x**, npm và ổ đĩa ghi được. SQLite tích hợp của Node, không cần tài khoản DB hay khóa API để phát triển. Dùng checkout hiện có; môi trường mỗi task đã cô lập, không tạo worktree nếu chưa được yêu cầu.

```sh
cd /workspace/Langding-page
npm ci --no-audit --no-fund
npm run dev -- --port 3000
```

Ứng dụng mặc định lưu DB vào `data/orders.sqlite` (được Git bỏ qua). `DATABASE_PATH` có thể đặt sang một đường dẫn tuyệt đối trên ổ đĩa bền vững. `.env.example` chỉ chứa cấu hình mẫu, không chứa bí mật. Dùng dữ liệu giả lập khi kiểm thử, không dùng thông tin người mua thật trong môi trường onboarding.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

- Unit/API: tính giá 1/2/3 sản phẩm, biên số lượng 1–20, đủ màu/size, thông tin người nhận, giá giả từ client, ghi DB, mở lại DB, gửi trùng, quyền xem đơn, hết hạn 30 ngày, rate limit, lỗi lưu trữ.
- E2E: Chromium hệ thống tại `/usr/bin/chromium`. Đặt `CHROMIUM_PATH` nếu khác, hoặc cài Chromium theo hướng dẫn Playwright khi máy chưa có. Các test khởi động build trên port 3100; dừng server chiếm port này trước khi chạy.
- DB E2E riêng theo từng lần chạy tại `/tmp/minimal-e2e-<uuid>.sqlite`; unit tests tự dọn dữ liệu tạm. Không đụng DB phát triển.
- E2E kiểm chứng 320/360/390/430px, không tràn ngang, chọn biến thể, tổng tiền, COD, tải lại đơn, quyền truy cập và thử lại sau mất phản hồi mạng.
- Playwright dựng server từ build: chạy lại build khi mã thay đổi.

Chạy bản build **cục bộ**, không phải lệnh deploy:

```sh
APP_ORIGIN=http://localhost:3000 npm run start -- --port 3000
```

`APP_ORIGIN` bắt buộc với bản build và phải trùng origin thực tế; thiếu cấu hình thì API từ chối lưu đơn (503). Development tự đối chiếu origin với host yêu cầu. Dùng HTTPS khi ra khỏi loopback để cookie Secure và Web Crypto hoạt động đúng.

## Luồng mua hàng và bảo vệ dữ liệu

- Sản phẩm 159.000đ, giá so sánh 229.000đ. Phí khách trả: 30.000đ cho 1 sản phẩm, miễn phí từ 2 sản phẩm. 1 = 189.000đ; 2 = 318.000đ. Không dùng chi phí nội bộ 14.000đ.
- `POST /api/orders`: chọn sản phẩm/màu/size hợp lệ, số lượng nguyên 1–20, tên, điện thoại Việt Nam, địa chỉ chi tiết; ghi chú tùy chọn. Giá và trạng thái do server tính/quyết định, bỏ qua giá client.
- SQLite WAL, transaction `BEGIN IMMEDIATE`, idempotency key duy nhất cùng fingerprint; trả thành công sau COMMIT. UI khóa gửi song song; lưu key, token và hash nội dung tạm trong sessionStorage để có thể thử lại cùng nội dung sau khi tải lại cùng tab trong 24 giờ. Không lưu thông tin người mua dạng rõ ở đây; xóa bản tạm sau phản hồi thành công. Đổi nội dung tạo yêu cầu mới. Đóng tab, đổi thiết bị, chặn sessionStorage hoặc thử lại sau 24 giờ không duy trì yêu cầu đang dở; chưa có giỏ hàng đồng bộ.
- Receipt: token ngẫu nhiên 256-bit, server chỉ lưu hash, cookie HttpOnly/SameSite=Strict theo đường dẫn đơn; Secure khi HTTPS. Không có token trong URL. Mã đơn không đủ để xem dữ liệu. Quyền xem hết hạn sau 30 ngày, có kiểm tra tại server. Mất cookie/chuyển trình duyệt chưa có quy trình khôi phục; OTP và quản trị thuộc P1.
- API chỉ nhận JSON cùng origin, giới hạn body 8 KiB, rate limit bền vững toàn hệ thống 120 lượt/phút và mỗi điện thoại 10 lượt/giờ (kể cả retry). Không tin header IP tùy ý. Đây là bảo vệ cơ bản; cần lớp chống bot tại hạ tầng trước khi mở bán.
- COD mới chỉ là **đã đặt / chưa thanh toán**. Không có thanh toán online, thông báo gửi khách hoặc Purchase event giả.
- DB chứa thông tin cá nhân: không public DB, không commit/snapshot dữ liệu khách thật. Chính sách lưu giữ/xóa, backup mã hóa, phân quyền vận hành và khôi phục cần được chủ shop thống nhất trước production. Hết quyền xem không đồng nghĩa xóa dữ liệu đơn.

## Tài nguyên và thông tin còn thiếu

Người bán đã gửi ảnh sáu màu trong hội thoại; tệp gốc chưa có trong workspace nên chưa thể đưa chính các ảnh đó vào build. Thư viện tiếp tục hiển thị **khung chờ được ghi nhãn rõ**, không có ảnh stock, review hay số bán giả. Khi các tệp gốc có thể truy cập, đặt vào:

```text
public/product/den.jpg       # Đen
public/product/ghi.jpg       # Ghi
public/product/kem.jpg       # Kem
public/product/khoi-la.jpg   # Khói lạ
public/product/be-khoi.jpg   # Be khói
public/product/nau.jpg       # Nâu
public/product/detail.webp   # ảnh chi tiết, nếu có
public/product/video.mp4     # video thật, nếu có
public/product/poster.webp   # poster video, nếu có
```

Mỗi ảnh màu cũng có thể là `.webp`, `.jpeg` hoặc `.png` với cùng tên gốc. Trang sẽ hiện ảnh màu đang chọn; nếu màu đó thiếu tệp, hiện khung chờ, không lấy ảnh màu khác thay thế. Build lại sau khi thêm tài nguyên. Ảnh dùng Next Image responsive; ảnh chi tiết tải lazy. Video chỉ hiển thị khi có cả video và poster, có controls, `preload=none`, không autoplay. Chưa kiểm chứng nội dung media thật vì chưa được cung cấp.

Chờ xác nhận chất liệu, số đo từng size, tồn kho, thời gian giao, điều kiện đổi trả/bảo hành. Không suy đoán bảng cân nặng từng size. Những phần chưa có chứng cứ được ghi rõ trên trang; không công bố “vintex xuất khẩu”, 68.000 lượt bán, 4,9 sao, đổi 3 ngày hoặc bảo hành 3 tháng.

Trang sản phẩm có nội dung HTML SSR và metadata cơ bản. `noindex` chủ động trong bản phát triển. Canonical, sitemap, structured data, tracking và audit hiệu năng thuộc P1, cần domain/dữ liệu thật trước khi bật.

## Điều kiện trước production (chưa thực hiện)

Cần duyệt code, hoàn tất tài nguyên/chính sách, domain HTTPS và APP_ORIGIN, ổ đĩa bền vững cùng backup/khôi phục, kế hoạch quản lý dữ liệu và xác nhận vận hành. SQLite hiện phù hợp một instance có volume bền vững; không dùng DB local trên serverless ephemeral hoặc chia nhiều replica không đồng bộ. Chưa có quản trị staff/OTP, thanh toán online hay tích hợp giao vận. Không chạy deploy hoặc mở bán khi chưa được phép.

## Hướng dẫn dự án

`AGENTS.md` là hợp đồng kỹ thuật; `GOALS.md` là yêu cầu kinh doanh; `TASKS.md` là backlog; `PLANS.md` ghi kế hoạch và kết quả thực chạy. Làm việc trên branch riêng và tạo PR để duyệt trước khi merge.
