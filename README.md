# 🛒 ShopWise — AI-Powered E-Commerce & RAG Chatbot Platform

> **Đồ án Thực tập Tốt nghiệp (TTTN_D35)** — Học viện Công nghệ Bưu chính Viễn thông (PTIT)  
> 💡 *Trải nghiệm mua sắm thiết bị công nghệ hiện đại với sự hỗ trợ của Trí tuệ nhân tạo (AI & RAG System) cùng Hệ thống Quản trị Vận hành Chuyên nghiệp.*

---

## 📌 Tổng quan Hệ thống (System Overview)

**ShopWise** là nền tảng thương mại điện tử chuyên cung cấp thiết bị công nghệ (Điện thoại, Máy tính xách tay, Phụ kiện) tích hợp:
1. **Hệ thống AI Assistant (RAG Chatbot)**: Tư vấn, tìm kiếm sản phẩm thông minh dựa trên kiến thức được vector hóa.
2. **Cơ chế Phân quyền chi tiết (RBAC Matrix)**: Phân quyền theo mã Permission thay vì hardcode Role, hỗ trợ gán quyền động cho `ADMIN`, `MANAGER`, `STAFF`, `CUSTOMER`.
3. **Cổng Quản trị & Vận hành (Admin & Staff Portal - `/admin`)**: Quản lý Người dùng, Vai trò, Sản phẩm, Tồn kho, Đơn hàng, Khuyến mãi, Bảo hành, Bài viết, Trợ lý AI, Cấu hình hệ thống và Nhật ký thao tác (Audit Log).

Dự án được xây dựng với kiến trúc hiện đại, tuân thủ nguyên tắc thiết kế tối giản (Minimalist Architectural Grid Design System) bám sát bản vẽ Figma, cùng hệ thống backend Spring Boot 3 và cơ sở dữ liệu PostgreSQL / Supabase.

---

## 🎨 Điểm nổi bật về Giao diện & Vận hành

### 🛍️ Client Portal (Khách hàng)
- **7-Column Architectural Grid Navigation**: Fixed Header `60px`, hiển thị danh mục linh hoạt, tìm kiếm, giỏ hàng, Dark/Light mode toggle, và Mobile Menu Sheet.
- **Hero Banner 128px**: Thiết kế chữ tiêu đề cỡ lớn *"Tìm kiếm công nghệ tuyệt vời, có sự hỗ trợ của AI!"* cùng nút CTA *"Mua thôi"*.
- **Marquee Ticker Banner (`#C5FA1F`)**: Dải băng chạy thông báo liên tục *"Miễn phí vận chuyển cho đơn hàng trên 1 triệu"*.
- **Best Sellers & Categories Grid**: Hiển thị sản phẩm bán chạy kèm huy hiệu chiết khấu, đánh giá và bộ lọc nhu cầu (*Làm việc, Gaming, Đồ họa*).
- **RAG Chatbot Widget**: Giao diện chat AI trực tiếp trên trang chủ với phản hồi trích dẫn nguồn (Sources) và đánh giá phản hồi (Thumbs Up / Thumbs Down).
- **Complete Authentication Suite**: Sign In, Sign Up với Password Strength Checklist, Forgot Password, Reset Password.

### 🛡️ Admin & Staff Portal (`/admin/*`)
- **Tổng quan Vận hành (`/admin`)**: Dashboard theo dõi doanh thu, đơn hàng, khách hàng mới, sản phẩm bán chạy và cảnh báo tồn kho thấp.
- **Quản lý Người dùng (`/admin/users`)**: Tìm kiếm, xem danh sách, xác thực email và thực hiện khóa/mở khóa tài khoản kèm lý do.
- **Vai trò & Phân quyền (`/admin/roles`)**: Ma trận phân quyền động, quản lý System Roles (`ADMIN`, `MANAGER`, `STAFF`, `CUSTOMER`).
- **Tồn kho & Kiểm kê (`/admin/inventory`)**: Điều chỉnh tăng/giảm tồn kho trực tiếp và ghi lại nhật ký chuyển dịch kho (`inventory_movements`).
- **Quy trình Đơn hàng (`/admin/orders`)**: State machine quản lý trạng thái đơn (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `DELIVERED`, `CANCELLED`, `REFUNDED`), tự động hoàn tồn kho khi hủy đơn.
- **Khuyến mãi (`/admin/promotions`)**: Quản lý mã giảm giá (Phần trăm / Cố định), thời gian hiệu lực và hạn ngạch sử dụng.
- **Bảo hành (`/admin/warranties`)**: Quản lý phiếu bảo hành tự động tạo khi hoàn tất đơn hàng và nhật ký sửa chữa.
- **Trợ lý AI RAG (`/admin/rag`)**: Thống kê hiệu năng Provider, danh sách câu hỏi low-confidence cần nạp thêm kiến thức.
- **Báo cáo Người dùng & Kinh doanh (`/admin/reports/*`)**: Báo cáo doanh thu thuần (Net Revenue), AOV, Top khách hàng VIP và **Xuất file CSV**.
- **Cấu hình Hệ thống (`/admin/system-config`)**: Thay đổi tham số vận hành runtime không cần restart ứng dụng.
- **Nhật ký Hoạt động (`/admin/audit-logs`)**: Audit Trail ghi lại mọi thao tác của quản trị viên và nhân viên.

---

## 🤖 Kiến trúc RAG Provider Architecture

Hệ thống RAG được thiết kế theo giao diện Provider Abstraction (`RagAssistantProvider`), cho phép chuyển đổi dễ dàng giữa môi trường Test/Dev và Production real-world chatbot:

- **Mock Provider (Mặc định khi dev)**:
  - Cấu hình trong `.env`: `RAG_PROVIDER=mock`
  - Giả lập phản hồi nhanh kèm độ tin cậy và nguồn trích dẫn sản phẩm từ cơ sở dữ liệu local.

- **HTTP/gRPC Provider (Khi nối RAG Server thật)**:
  - Cấu hình trong `.env`: `RAG_PROVIDER=http`
  - `RAG_HTTP_BASE_URL=http://localhost:8000/api/v1/rag`
  - Tự động gọi REST/HTTP API của RAG microservice bên ngoài để sinh câu trả lời real-time.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

### 💻 Frontend
- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System, Radix UI Primitives
- **Icons**: Lucide React
- **Data Fetching & State**: TanStack React Query v5, Axios, React Hook Form, Zod

### ⚙️ Backend
- **Framework**: Java 21, Spring Boot 3.x (Gradle)
- **Database**: PostgreSQL / Supabase
- **Migrations**: Flyway SQL Migrations (V1 đến V7)
- **Security**: Spring Security, JWT Authentication, Permission-based RBAC

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### Yêu cầu Hệ thống
- **Node.js**: `v18+` (Khuyến nghị `v20+`)
- **JDK**: `Java 21`
- **Database**: PostgreSQL / Supabase Instance

---

### 1. Khởi chạy Backend (Spring Boot)

```bash
cd backend

# Chạy Flyway migrations & Start backend service
./gradlew bootRun
```

- RESTful API Root: `http://localhost:8080/api/v1`
- Swagger UI Documentations: `http://localhost:8080/api/v1/swagger-ui.html`

#### Chạy Unit & Integration Tests:
```bash
./gradlew test
```

---

### 2. Khởi chạy Frontend (Next.js 16)

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi chạy dev server (Turbopack)
npm run dev

# Kiểm tra build production (Static & Dynamic Pages Optimization)
npm run build
```

- Web Portal: `http://localhost:3000`
- Admin Portal: `http://localhost:3000/admin`

---

## 📝 Giấy phép & Tác giả

- **Dự án**: Đồ án Thực tập Tốt nghiệp PTIT (TTTN_D35)
- **Tác giả**: Quốc Lương (`quocluongg`)
- **Repository**: [GitHub - quocluongg/TTTN_D35](https://github.com/quocluongg/TTTN_D35)