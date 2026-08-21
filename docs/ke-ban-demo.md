# KỊCH BẢN DEMO WEBSITE SHOPWISE
### Đồ án TTTN_D35 — Hướng dẫn thuyết trình/bảo vệ đồ án

> **Mục đích:** Kịch bản đi qua toàn bộ website, từ góc nhìn khách hàng đến quản trị viên, nhấn mạnh tính năng Chatbot RAG (điểm sáng của đồ án).
> **Thời lượng dự kiến:** 12–15 phút. **Ngôn ngữ:** Tiếng Việt.
> **Cách dùng:** Mỗi mục có phần **[HÀNH ĐỘNG]** (thao tác trên màn hình) và **[LỜI NÓI]** (nội dung thuyết trình). Tổng thời gian ghi chú ở đầu từng phần.

---

## 0. CHUẨN BỊ TRƯỚC DEMO (2 phút)
- Khởi chạy cả 3 service: `frontend` (npm run dev → localhost:3000), `backend` (./gradlew bootRun → localhost:8080), `ai` (python main.py → localhost:8000).
- Mở sẵn 2 tab trình duyệt: 1 trang khách (`localhost:3000`), 1 trang admin (`localhost:3000/admin`).
- Đăng nhập sẵn 1 tài khoản khách và 1 tài khoản admin để tránh thao tác đăng nhập làm gián đoạn.
- Chuẩn bị sẵn 1 sản phẩm cụ thể (VD: laptop gaming) và 1 câu hỏi chatbot mẫu.

---

## 1. MỞ ĐẦU & TỔNG QUAN (1 phút)
**[HÀNH ĐỘNG]** Mở tab trang chủ `localhost:3000`, để màn hình tổng quan.

**[LỜI NÓI]**
> "Xin chào thầy/cô và các bạn. Em xin trình bày đồ án **ShopWise** — website bán thiết bị điện tử tích hợp chatbot tư vấn sản phẩm bằng công nghệ RAG.
> Hệ thống gồm 3 thành phần tách biệt: Frontend **Next.js 16**, Backend nghiệp vụ **Spring Boot 4**, và AI/RAG Service **FastAPI (Python)**. Dữ liệu lưu trên PostgreSQL/Supabase có bật extension pgvector.
> Em sẽ demo theo luồng: khách hàng duyệt mua hàng → dùng chatbot tư vấn → thanh toán → và cuối cùng là góc quản trị."

---

## 2. TRANG CHỦ (1.5 phút)
**[HÀNH ĐỘNG]** Cuộn trang chủ từ trên xuống: Header → Hero Banner → dải chạy chữ khuyến mãi → sản phẩm bán chạy → gợi ý theo nhu cầu → tin tức → Footer. Nhấn nút Dark/Light mode để minh họa.

**[LỜI NÓI]**
> "Đầu tiên là trang chủ. Giao diện theo thiết kế Figma, tối giản, chia lưới rõ ràng.
> - **Header** cố định: menu danh mục, ô tìm kiếm, giỏ hàng, và nút chuyển **Dark/Light mode**.
> - **Hero Banner** giới thiệu chatbot AI của chúng em.
> - Dải chạy chữ hiển thị chương trình khuyến mãi.
> - Khối **sản phẩm bán chạy** có nhãn giảm giá và đánh giá sao.
> - Khối **gợi ý theo nhu cầu** (làm việc, gaming…) cá nhân hóa trải nghiệm.
> - Cuối trang là khối **tin tức công nghệ** và **Footer** nhiều cột liên kết."

---

## 3. TÌM KIẾM & DANH MỤC SẢN PHẨM (1.5 phút)
**[HÀNH ĐỘNG]** Gõ từ khóa vào ô tìm kiếm (VD: "laptop") → Enter. Sau đó vào mục `Shop` / `Brands` để lọc theo danh mục và thương hiệu.

**[LỜI NÓI]**
> "Khách hàng có thể tìm kiếm nhanh qua ô tìm kiếm ở header. Kết quả trả về theo tên, danh mục, thương hiệu.
> Trang **Shop** cho phép lọc theo danh mục, hãng, mức giá, và sắp xếp — đây là dữ liệu thực được phục vụ từ Backend Spring Boot qua REST API `/api/v1`."

---

## 4. CHI TIẾT SẢN PHẨM (1 phút)
**[HÀNH ĐỘNG]** Click vào 1 sản phẩm → trang chi tiết: ảnh, biến thể, thông số, đánh giá, nút "Thêm vào giỏ".

**[LỜI NÓI]**
> "Trang chi tiết hiển thị đầy đủ: hình ảnh, các **biến thể** (màu/sửa cấu hình), **thông số kỹ thuật**, đánh giá từ người dùng, và tồn kho. Mọi thông tin này được lấy từ PostgreSQL qua JPA/Hibernate, đảm bảo tính nhất quán dữ liệu."

---

## 5. ⭐ CHATBOT TƯ VẤN RAG — ĐIỂM NHẤN (3 phút)
**[HÀNH ĐỘNG]** Mở widget chat (hoặc trang `/ai`), gõ câu hỏi: *"Laptop gaming dưới 20 triệu có model nào?"*. Chờ phản hồi + product card. Sau đó gõ câu ngoài phạm vi: *"Hôm nay thời tiết thế nào?"* để minh họa off-topic gate.

**[LỜI NÓI]**
> "Đây là tính năng cốt lõi — **Chatbot tư vấn RAG**. Khác với chatbot thông thường dùng kiến thức có sẵn của LLM (dễ bịa thông số), chatbot của em:
> 1. Dùng **PhoBERT** để nhận diện ý định và trích thực thể (tên hãng, mức giá…).
> 2. Thực hiện **Hybrid Search**: kết hợp tìm theo vector (BGE-M3) và theo từ khóa (BM25) trên pgvector.
> 3. Qua **Reranker + MMR** lọc kết quả, rồi sinh câu trả lời bằng **Gemini** dựa *chỉ* trên dữ liệu sản phẩm thật.
> 4. Có **Off-topic gate**: nếu hỏi ngoài phạm vi điện tử, hệ thống từ chối thay vì bịa.
> Như thầy/cô thấy, câu trả lời đi kèm **product card** có thể click ngay vào mua. Câu hỏi thời tiết vừa rồi được hệ thống nhận diện ngoài phạm vi và từ chối — minh chứng cho tính an toàn."

---

## 6. ĐĂNG KÝ / ĐĂNG NHẬP (1 phút)
**[HÀNH ĐỘNG]** (nếu chưa đăng nhập) Mở `/signup` để chỉ độ mạnh mật khẩu real-time; `/login` (hỗ trợ Google OAuth2); `/forgot-password` và `/reset-password`.

**[LỜI NÓI]**
> "Về xác thực: hỗ trợ đăng ký với **kiểm tra độ mạnh mật khẩu theo thời gian thực**, đăng nhập bằng JWT (access token + refresh token cookie) và **OAuth2 Google**. Quên mật khẩu được xử lý qua OTP email (Gmail SMTP) với bước đặt lại có kiểm tra khớp mật khẩu động."

---

## 7. GIỎ HÀNG & THANH TOÁN (1.5 phút)
**[HÀNH ĐỘNG]** Thêm sản phẩm vào giỏ → `/cart` → `/checkout` (nhập địa chỉ, chọn VNPay/Stripe) → `/payment` → `/orders` xem lịch sử.

**[LỜI NÓI]**
> "Khách thêm sản phẩm vào giỏ, qua trang **Checkout** nhập địa chỉ và áp dụng **Voucher**. Hệ thống tích hợp **VNPay** và **Stripe** cho thanh toán.
> Đơn hàng được xử lý trong transaction chặt chẽ ở Backend, có **RBAC** phân quyền, và lưu toàn bộ qua JPA. Trang **Orders** giúp khách theo dõi lịch sử và trạng thái đơn."

---

## 8. TÀI KHOẢN & TIỆN ÍCH KHÁC (1 phút)
**[HÀNH ĐỘNG]** Truy cập `/account`, `/warranty-check` (tra cứu bảo hành), `/news`, `/contact`, `/chinh-sach`.

**[LỜI NÓI]**
> "Khách hàng quản lý hồ sơ tại `/account`. Hệ thống còn có tra cứu **bảo hành** (Warranty), **tin tức**, **liên hệ** và các **chính sách**. Tất cả đều được phục vụ bởi các module tương ứng ở Backend."

---

## 9. GÓC QUẢN TRỊ (ADMIN) (2 phút)
**[HÀNH ĐỘNG]** Chuyển sang tab `/admin`. Duyệt nhanh: Dashboard, Products, Categories, Brands, Orders, Promotions (Voucher/Campaign), Users/Roles (RBAC), News, Warranties, Inventory, Reports, Audit Logs, CMS, Settings.

**[LỜI NÓI]**
> "Chuyển sang góc **quản trị viên**. Backend triển khai **RBAC** (Role–Permission): admin có giao diện riêng quản lý:
> - **Sản phẩm, Danh mục, Thương hiệu** (Catalog)
> - **Đơn hàng, Khuyến mãi, Voucher, Chiến dịch**
> - **Người dùng & Phân quyền** (Users/Roles)
> - **Kho (Inventory), Báo cáo (Reports), Audit Log** vận hành
> - **CMS** quản lý banner/trang chủ và **Cài đặt** hệ thống.
> Mọi thao tác quản trị đều ghi log để kiểm toán."

---

## 10. QUẢN TRỊ AI (AI MANAGEMENT) (1.5 phút)
**[HÀNH ĐỘNG]** Trong admin vào `/admin/ai-management` và `/admin/chat`: xem thống kê hội thoại, quản lý sản phẩm/chunk, đồng bộ dữ liệu RAG.

**[LỜI NÓI]**
> "Điểm đặc biệt: admin có thể quản lý chính AI service. Tại **AI Management**, admin xem **thống kê hội thoại**, quản lý **product chunks** đã được embedding, và **đồng bộ dữ liệu** lên pgvector. Tại **Chat**, admin có thể theo dõi/log các cuộc hội thoại để tối ưu chatbot.
> Toàn bộ pipeline RAG này chạy trên FastAPI độc lập, giao tiếp với Frontend qua REST `/chat`."

---

## 11. KẾT THÚC & Q&A (1 phút)
**[HÀNH ĐỘNG]** Quay lại trang chủ, để màn hình tổng quan.

**[LỜI NÓI]**
> "Tóm lại, ShopWise là website thương mại điện tử hoàn chỉnh với kiến trúc 3 lớp độc lập, tích hợp **chatbot RAG an toàn và chính xác** nhờ Hybrid Search + off-topic gate.
> Cảm ơn thầy/cô và các bạn đã lắng nghe. Em xin sẵn sàng nhận câu hỏi."

---

## PHỤ LỤC: CÂU HỎI CHATBOT MẪU (dự phòng)
| Câu hỏi | Mục đích demo |
| --- | --- |
| "Laptop gaming dưới 20 triệu?" | Hybrid search + product card |
| "iPhone 15 và 16 khác nhau gì?" | So sánh thực thể |
| "Tai nghe Bluetooth nào tốt nhất?" | Gợi ý theo nhu cầu |
| "Hôm nay thời tiết thế nào?" | Off-topic gate (từ chối) |
| "Giảm giá bao nhiêu cho sinh viên?" | Ngoài phạm vi dữ liệu (từ chối/làm rõ) |

## LƯU Ý KHI DEMO
- Nếu AI service chậm: chạy sẵn 1–2 câu hỏi trước để cache kết quả.
- Nếu mạng/Supabase lag: chuẩn bị bản ghi hình dự phòng của luồng chatbot.
- Luôn giữ token admin còn hạn để không bị ngắt bởi login.
