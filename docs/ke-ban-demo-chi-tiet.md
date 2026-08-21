# KỊCH BẢN DEMO CHI TIẾT — SHOPWISE (Từng câu, step by step)
### Đồ án TTTN_D35 — Dùng để đọc trực tiếp khi thuyết trình/bảo vệ

> Mỗi bước gồm: **[Thao tác]** (làm gì trên màn hình) và **[Nói]** (câu đọc nguyên văn). Từ in **đậm** là chỗ cần nhấn giọng.

---

## PHẦN 0 — CHUẨN BỊ (làm trước khi bắt đầu, không tính giờ)

**[Thao tác]** Mở terminal, khởi chạy Frontend:
- `cd frontend` rồi `npm run dev`

**[Thao tác]** Khởi chạy Backend:
- `cd backend` → `docker-compose up -d` → `./gradlew bootRun`

**[Thao tác]** Khởi chạy AI Service:
- `cd ai` → `venv\Scripts\activate` → `python main.py`

**[Thao tác]** Mở 2 tab trình duyệt: Tab 1 `http://localhost:3000` (trang khách), Tab 2 `http://localhost:3000/admin` (trang admin, đã đăng nhập sẵn).

**[Thao tác]** Chuẩn bị sẵn 2 câu hỏi chatbot: "Laptop gaming dưới 20 triệu?" và "Thời tiết hôm nay thế nào?".

---

## PHẦN 1 — MỞ ĐẦU (01:00)

**[Thao tác]** Đưa Tab 1 lên màn hình, để nguyên trang chủ.
**[Nói]** "Kính thưa thầy cô và các bạn, em xin trình bày đồ án **ShopWise** — một website bán thiết bị điện tử tích hợp **chatbot tư vấn sản phẩm bằng công nghệ RAG**."

**[Thao tác]** Chỉ tay vào màn hình, không thao tác thêm.
**[Nói]** "Hệ thống của em gồm ba thành phần tách biệt hoàn toàn: **Frontend** xây dựng bằng Next.js 16, **Backend nghiệp vụ** bằng Spring Boot 4, và **AI Service** bằng FastAPI — Python. Dữ liệu được lưu chung trên PostgreSQL của Supabase, đã bật extension pgvector để lưu vector embedding."

**[Thao tác]** Chỉ vào từng vùng màn hình.
**[Nói]** "Em sẽ demo theo đúng luồng thực tế: khách hàng duyệt hàng, dùng chatbot tư vấn, đặt hàng thanh toán, và cuối cùng là góc quản trị viên. Bắt đầu nhé."

---

## PHẦN 2 — TRANG CHỦ (01:30)

**[Thao tác]** Đưa chuột lên Header, di nhẹ từ trái sang phải.
**[Nói]** "Đầu tiên là trang chủ. Như thầy cô thấy, giao diện làm theo bản thiết kế Figma, hướng tối giản, chia lưới rõ ràng."

**[Thao tác]** Click vào nút Dark/Light mode góc trên bên phải.
**[Nói]** "Header được cố định, gồm menu danh mục, ô tìm kiếm, giỏ hàng, và nút chuyển **chế độ tối / sáng** — mình bấm đây để thấy giao diện đổi ngay lập tức."

**[Thao tác]** Cuộn xuống từ từ: Hero Banner → dải chữ chạy → sản phẩm bán chạy.
**[Nói]** "Bên dưới là Hero Banner giới thiệu chatbot AI của nhóm. Tiếp theo là dải chữ chạy hiển thị chương trình khuyến mãi. Khối sản phẩm bán chạy có nhãn giảm giá và hệ thống đánh giá sao."

**[Thao tác]** Cuộn tiếp đến khối gợi ý theo nhu cầu, tin tức, rồi Footer.
**[Nói]** "Khối gợi ý theo nhu cầu — như làm việc, gaming — giúp cá nhân hóa trải nghiệm. Cuối trang là tin tức công nghệ và Footer nhiều cột liên kết, hỗ trợ các phương thức thanh toán."

---

## PHẦN 3 — TÌM KIẾM & DANH MỤC (01:30)

**[Thao tác]** Click ô tìm kiếm, gõ "laptop", nhấn Enter.
**[Nói]** "Khách hàng có thể tìm kiếm nhanh qua ô tìm kiếm ở header. Em thử gõ từ khóa 'laptop' và Enter."

**[Thao tác]** Đợi trang kết quả, chỉ vào kết quả.
**[Nói]** "Kết quả trả về theo tên, danh mục và thương hiệu — đây là dữ liệu thực được Backend Spring Boot phục vụ qua REST API `/api/v1`."

**[Thao tác]** Mở menu "Shop" hoặc "Brands", chọn lọc theo hãng / mức giá.
**[Nói]** "Hoặc vào trang Shop để lọc theo danh mục, hãng, mức giá và sắp xếp. Toàn bộ đều gọi API có phân trang, đảm bảo mượt ngay cả khi có nhiều sản phẩm."

---

## PHẦN 4 — CHI TIẾT SẢN PHẨM (01:00)

**[Thao tác]** Click vào một sản phẩm laptop → vào trang chi tiết.
**[Nói]** "Click vào một sản phẩm, ta đến trang chi tiết."

**[Thao tác]** Chỉ vào ảnh, chọn một biến thể, cuộn đến thông số và đánh giá.
**[Nói]** "Tại đây hiển thị ảnh, các **biến thể** cấu hình, bảng **thông số kỹ thuật**, đánh giá người dùng và tồn kho. Mọi thông tin lấy từ PostgreSQL qua JPA/Hibernate nên luôn nhất quán."

---

## PHẦN 5 — CHATBOT RAG (03:00) — ĐIỂM NHẤN

**[Thao tác]** Mở widget chat góc dưới bên phải (hoặc truy cập `/ai`).
**[Nói]** "Và đây là tính năng cốt lõi của đồ án — **chatbot tư vấn RAG**. Khác với chatbot bình thường dùng kiến thức có sẵn của mô hình — rất dễ bịa thông số — chatbot của em truy xuất dữ liệu thật rồi mới sinh câu trả lời."

**[Thao tác]** Gõ: "Laptop gaming dưới 20 triệu?" → gửi. Chờ phản hồi.
**[Nói]** "Em thử hỏi: 'Laptop gaming dưới 20 triệu?'. Hệ thống xử lý như sau: bước một, dùng **PhoBERT** nhận diện ý định và trích thực thể — ở đây là 'gaming' và 'dưới 20 triệu'."

**[Thao tác]** Chỉ vào phần product card xuất hiện.
**[Nói]** "Bước hai, thực hiện **Hybrid Search**: kết hợp tìm theo vector BGE-M3 và theo từ khóa BM25 trên pgvector. Bước ba, qua **reranker và MMR** lọc kết quả, rồi bước bốn, sinh câu trả lời bằng **Gemini** dựa *chỉ* trên dữ liệu đã lọc. Kết quả trả về cả câu trả lời và **product card** có thể mua ngay."

**[Thao tác]** Gõ câu: "Thời tiết hôm nay thế nào?" → gửi.
**[Nói]** "Điểm quan trọng: chatbot có **off-topic gate**. Em hỏi câu ngoài phạm vi: 'Thời tiết hôm nay thế nào?'. Hệ thống nhận diện đây không phải sản phẩm điện tử và **từ chối trả lời** thay vì để mô hình tự bịa. Đây là cơ chế đảm bảo an toàn và tin cậy."

---

## PHẦN 6 — ĐĂNG KÝ / ĐĂNG NHẬP (01:00)

**[Thao tác]** Mở `/signup`, gõ một mật khẩu yếu rồi một mật khẩu mạnh để thấy thanh độ mạnh đổi màu.
**[Nói]** "Về xác thực, trang đăng ký có **kiểm tra độ mạnh mật khẩu theo thời gian thực** — thanh này đổi màu ngay khi mình gõ."

**[Thao tác]** Mở `/login`, chỉ vào nút Google.
**[Nói]** "Đăng nhập dùng **JWT** — access token kèm refresh token dạng cookie — và hỗ trợ **OAuth2 Google**. Quên mật khẩu được xử lý qua OTP email Gmail SMTP, với bước đặt lại có kiểm tra khớp mật khẩu động."

---

## PHẦN 7 — GIỎ HÀNG & THANH TOÁN (01:30)

**[Thao tác]** Quay lại trang chi tiết, bấm "Thêm vào giỏ" → mở `/cart`.
**[Nói]** "Khách chọn sản phẩm và bấm **Thêm vào giỏ**. Tại trang giỏ hàng, có thể đổi số lượng, chọn biến thể."

**[Thao tác]** Bấm thanh toán → `/checkout`, nhập địa chỉ, nhập mã voucher.
**[Nói]** "Ở bước Checkout, khách nhập địa chỉ và có thể áp dụng **Voucher**. Hệ thống tích hợp **VNPay** và **Stripe**."

**[Thao tác]** Chọn phương thức → `/payment` → hoàn tất → mở `/orders`.
**[Nói]** "Đơn hàng được xử lý trong transaction chặt chẽ ở Backend, có **RBAC** phân quyền, và lưu qua JPA. Trang Orders giúp khách theo dõi lịch sử và trạng thái đơn."

---

## PHẦN 8 — TÀI KHOẢN & TIỆN ÍCH (01:00)

**[Thao tác]** Mở `/account`, `/warranty-check`, `/news`, `/contact`, `/chinh-sach`.
**[Nói]** "Khách quản lý hồ sơ tại `/account`. Hệ thống còn có tra cứu **bảo hành**, **tin tức**, **liên hệ** và các **chính sách** — đều được phục vụ bởi các module tương ứng ở Backend."

---

## PHẦN 9 — GÓC QUẢN TRỊ ADMIN (02:00)

**[Thao tác]** Chuyển sang Tab 2 `/admin`, để Dashboard.
**[Nói]** "Chuyển sang góc **quản trị viên**. Backend triển khai **RBAC** — Role và Permission — nên admin có giao diện riêng."

**[Thao tác]** Duyệt nhanh: Products, Categories, Brands, Orders, Promotions, Users/Roles.
**[Nói]** "Admin quản lý **sản phẩm, danh mục, thương hiệu**; **đơn hàng, khuyến mãi, voucher, chiến dịch**; và **người dùng, phân quyền**."

**[Thao tác]** Chỉ vào Inventory, Reports, Audit Logs, CMS, Settings.
**[Nói]** "Ngoài ra còn quản lý **kho, báo cáo, audit log** vận hành, **CMS** banner/trang chủ và **cài đặt** hệ thống. Mọi thao tác đều ghi log kiểm toán."

---

## PHẦN 10 — QUẢN TRỊ AI (01:30)

**[Thao tác]** Trong admin vào `/admin/ai-management` và `/admin/chat`.
**[Nói]** "Điểm đặc biệt: admin quản lý được chính AI service. Tại **AI Management**, xem **thống kê hội thoại**, quản lý **product chunks** đã embedding, và **đồng bộ dữ liệu** lên pgvector."

**[Thao tác]** Chỉ vào màn hình log hội thoại.
**[Nói]** "Tại **Chat**, admin theo dõi log các cuộc hội thoại để tối ưu chatbot. Toàn bộ pipeline RAG chạy trên FastAPI độc lập, giao tiếp với Frontend qua REST `/chat`."

---

## PHẦN 11 — KẾT THÚC & Q&A (01:00)

**[Thao tác]** Quay lại Tab 1 trang chủ, để màn hình tổng quan.
**[Nói]** "Tóm lại, ShopWise là website thương mại điện tử hoàn chỉnh với kiến trúc ba lớp độc lập, tích hợp **chatbot RAG an toàn và chính xác** nhờ Hybrid Search cộng off-topic gate. Cảm ơn thầy cô và các bạn đã lắng nghe. Em xin sẵn sàng nhận câu hỏi."

---

## PHỤ LỤC A — CÂU HỎI CHATBOT MẪU

| Câu hỏi | Mục đích demo |
| --- | --- |
| "Laptop gaming dưới 20 triệu?" | Hybrid search + product card |
| "iPhone 15 và 16 khác nhau gì?" | So sánh thực thể |
| "Tai nghe Bluetooth nào tốt nhất?" | Gợi ý theo nhu cầu |
| "Thời tiết hôm nay thế nào?" | Off-topic gate (từ chối) |
| "Giảm giá bao nhiêu cho sinh viên?" | Ngoài dữ liệu (từ chối/làm rõ) |

## PHỤ LỤC B — LƯU Ý KHI DEMO

- Nếu AI Service chậm: chạy sẵn 1–2 câu hỏi trước để cache kết quả.
- Nếu mạng / Supabase lag: chuẩn bị bản ghi hình dự phòng của luồng chatbot.
- Luôn giữ token admin còn hạn để không bị ngắt bởi login.
- Tổng thời lượng lý tưởng: 14–16 phút (chưa tính Q&A).
