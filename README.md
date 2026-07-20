# 🛒 ShopWise — AI-Powered E-Commerce & RAG Chatbot Platform

> **Đồ án Thực tập Tốt nghiệp (TTTN_D35)** — Học viện Công nghệ Bưu chính Viễn thông (PTIT)  
> 💡 *Trải nghiệm mua sắm thiết bị công nghệ hiện đại với sự hỗ trợ của Trí tuệ nhân tạo (AI & RAG System).*

---

## 📌 Tổng quan Hệ thống (System Overview)

**ShopWise** là nền tảng thương mại điện tử chuyên cung cấp thiết bị công nghệ (Điện thoại, Máy tính xách tay, Phụ kiện) tích hợp **Hệ thống AI Assistant (RAG Chatbot)** giúp tư vấn, tìm kiếm sản phẩm thông minh dựa trên nhu cầu của người dùng.

Dự án được xây dựng với định hướng kiến trúc hiện đại, thiết kế giao diện tối giản (Minimalist Architectural Grid Design System) bám sát bản vẽ Figma độ nét cao, cùng hệ thống backend chuẩn Spring Boot và cơ sở dữ liệu PostgreSQL / Supabase.

---

## 🎨 Điểm nổi bật về Giao diện (Frontend Highlights)

Bản thiết kế được đồng bộ 100% từ Figma (**Node 46-3066** & **Node 9-119**):

- **7-Column Architectural Grid Navigation**: Fixed Header `60px`, hiển thị danh mục linh hoạt, tìm kiếm, giỏ hàng, Dark/Light mode toggle, và Mobile Menu Sheet.
- **Hero Banner 128px**: Thiết kế chữ tiêu đề cỡ lớn *"Tìm kiếm công nghệ tuyệt vời, có sự hỗ trợ của AI!"* cùng nút CTA *"Mua thôi"*.
- **Marquee Ticker Banner (`#C5FA1F`)**: Dải băng chạy thông báo liên tục *"Miễn phí vận chuyển cho đơn hàng trên 1 triệu"*.
- **Best Sellers Product Showcase**: Trình diễn 5 sản phẩm bán chạy nhất kèm các huy hiệu `-20%`, `Bán chạy`, đánh giá sao, và thanh điều hướng Slider.
- **Buy By Need (Mua theo nhu cầu)**: Phân loại mục đích sử dụng (*"Làm việc"*, *"Gaming"*, *"Thiết kế cho mọi nâng cấp"*).
- **Categories Grid**: Lưới danh mục 3 cột (*Điện thoại, Máy tính xách tay, Phụ kiện*).
- **Stories That Move**: Khối bài viết tin tức công nghệ cập nhật.
- **Complete Authentication Suite**:
  - **Sign In (`/login`)**: Form đăng nhập chuẩn 448px, bật/tắt hiển thị mật khẩu.
  - **Sign Up (`/signup`)**: Form đăng ký với **Password Strength Checklist** kiểm tra độ mạnh mật khẩu động (chữ thường, chữ số, ký tự đặc biệt, ít nhất 8 ký tự).
  - **Forgot Password (`/forgot-password`)**: Quy trình yêu cầu đặt lại mật khẩu qua Email.
  - **Reset Password (`/reset-password`)**: Form đặt lại mật khẩu với cơ chế kiểm tra khớp mật khẩu động.
- **Footer 7-Column Layout**: Tích hợp Đăng ký nhận tin khuyến mãi, 4 cột liên kết, các phương thức thanh toán và Logo ShopWise SVG siêu lớn.

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
- **Migrations**: Flyway SQL Migrations
- **Security**: Spring Security, JWT Authentication, RBAC (Role-Based Access Control)

### 🤖 AI & RAG Pipeline
- **Web Scraping & ETL**: Python BeautifulSoup4, Selenium
- **Data Vectorization**: Document Chunking (`documents.json`, `chunks.json`, `chunks_text.jsonl`)
- **RAG Agents**: Product Ingestion & Hybrid Search Workflow (`agents/`)

---

## 📁 Cấu trúc Thư mục (Directory Structure)

```text
TTTN_D35/
├── 📂 agents/                   # Quy trình cấu hình AI RAG Ingestion & Hybrid Search
│   ├── 01_ingest_products.json
│   └── 02_search_products.json
├── 📂 backend/                  # Mã nguồn Spring Boot Backend Service
│   ├── build.gradle
│   ├── docker-compose.yml
│   └── src/
│       ├── main/java/ptithcm/tttnd35backend/
│       └── main/resources/db/migration/
├── 📂 data/                     # Dữ liệu Crawl sản phẩm & Tài liệu Chuẩn bị RAG
│   ├── DB_Design.md
│   ├── processed/              # Chunks dữ liệu đã được xử lý làm Vector DB
│   └── raw/                    # Dữ liệu thô cào từ e-commerce
├── 📂 frontend/                 # Mã nguồn Next.js 16 Frontend App
│   ├── app/                    # App Router (/page.tsx, /login, /signup, /forgot-password, /reset-password)
│   ├── public/figma/           # Tài nguyên hình ảnh nguyên bản lấy từ Figma
│   ├── shared/                 # Core Components (Navbar, Footer, InputField) & Layouts
│   ├── hooks/                  # Custom React Hooks (useAuth, TanStack Query hooks)
│   └── services/               # API Call Services
└── README.md
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### Yêu cầu Hệ thống
- **Node.js**: `v18+` (Khuyến nghị `v20+`)
- **Package Manager**: `npm`, `pnpm` hoặc `bun`
- **JDK**: `Java 21` (Cho phần Backend)
- **Database**: PostgreSQL / Supabase Instance

---

### 1. Khởi chạy Frontend (Next.js 16)

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện phụ thuộc
npm install

# Khởi chạy server phát triển (Turbopack)
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:3000`

---

### 2. Khởi chạy Backend (Spring Boot)

```bash
# Di chuyển vào thư mục backend
cd backend

# Chạy ứng dụng với Gradle Wrapper
./gradlew bootRun
```

Backend RESTful API sẽ khởi chạy tại: `http://localhost:8080`

---

## 📸 Hình ảnh Minh họa Giao diện (Screenshots & Showcase)

| Trang Chủ (Homepage) | Đăng Nhập (Sign In) |
| :---: | :---: |
| Hero Banner & Architectural Layout Grid | Form Đăng nhập 448px chuẩn Figma |

| Đăng Ký (Sign Up) | Đặt lại Mật khẩu (Reset Password) |
| :---: | :---: |
| Password Strength Checklist tự động | Kiểm tra trùng khớp mật khẩu động |

---

## 📝 Giấy phép (License) & Tác giả

- **Dự án**: Đồ án Thực tập Tốt nghiệp PTIT (TTTN_D35)
- **Phát triển bởi**: Quốc Lương (`quocluongg`)
- **Repository**: [GitHub - quocluongg/TTTN_D35](https://github.com/quocluongg/TTTN_D35)