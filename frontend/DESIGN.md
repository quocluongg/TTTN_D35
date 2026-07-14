# SHOPWISE — Design System

> Tài liệu hệ thống thiết kế (Design System) cho dự án **SHOPWISE**. Đây là nguồn tham chiếu duy nhất cho mọi quyết định về giao diện, màu sắc, typography, spacing và component.

---

## 1. Triết lý thiết kế (Design Philosophy)

SHOPWISE theo đuổi phong cách **Architectural Minimalism** — lấy cảm hứng từ các thương hiệu thời trang cao cấp và tạp chí thiết kế đương đại.

| Nguyên tắc | Mô tả |
|---|---|
| **Flat & Borderless** | Không bo tròn góc, không shadow nặng. Dùng đường kẻ thẳng để phân tách không gian. |
| **Grid-First** | Mọi layout đều xây dựng trên lưới cột rõ ràng, tạo cảm giác có tổ chức và nhất quán. |
| **Monochrome Core** | Hệ màu chủ đạo là đen-trắng-xám. Accent color chỉ dùng khi thực sự cần thiết. |
| **Typography-Led** | Chữ lớn, font weight rõ ràng là yếu tố trang trí chủ đạo thay vì màu sắc và hình ảnh. |
| **Micro-motion** | Hover states mượt mà, transition đủ nhanh để cảm thấy nhanh nhẹn (150–300ms). |

---

## 2. Color Palette

### 2.1 Brand Colors

| Token | Light Mode | Dark Mode | Hex (Light) | Ghi chú |
|---|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | `#FFFFFF` | Nền trang chính |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | `#171717` | Màu chữ chính |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | `#1A1A1A` | Màu nhấn chính (gần đen) |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | `#737373` | Chữ phụ / placeholder |
| `--border` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` | `#EBEBEB` | Màu đường kẻ mặc định |

### 2.2 Surface Colors (dùng trong page layout)

| Tên | Màu | Tailwind class | Sử dụng |
|---|---|---|---|
| **Page Surface** | `#F2F2F2` | `bg-[#F2F2F2]` | Nền trang chính, Navbar |
| **Mid Surface** | `#C5C5C5` | `bg-[#C5C5C5]` | Hero section, Section nền xám |
| **Hard Black** | `#000000` | `bg-black` | Navbar line, Button Primary, Border |
| **Dark Page Surface** | `zinc-900` | `dark:bg-zinc-900` | Dark mode nền trang |
| **Dark Mid Surface** | `zinc-800` | `dark:bg-zinc-800` | Dark mode surface |
| **Dark Border** | `zinc-800` | `dark:border-zinc-800` | Dark mode border |

### 2.3 Accent Color

| Tên | Màu | Hex | Ghi chú |
|---|---|---|---|
| **Acid Yellow / Lime** | Xanh vàng chanh | `~#C8FF00` hoặc `#BFFF00` | Dùng sparingly — Badge nổi bật, CTA thứ cấp, trạng thái "mới" |

> ⚠️ Accent Yellow chỉ sử dụng cho các phần tử **cần sự chú ý ngay lập tức** (ví dụ: badge "New", trạng thái Active filter, highlight search). Không dùng làm màu nền section hay button thông thường.

---

## 3. Typography

### 3.1 Font Family

| Role | Font | CSS Variable | Source |
|---|---|---|---|
| **Sans-serif (UI)** | Inter | `--font-inter` / `--font-sans` | Google Fonts |
| **Monospace (code)** | Geist Mono | `--font-mono` | Vercel Geist |

### 3.2 Type Scale

| Token | Size | Weight | Tracking | Line Height | Dùng cho |
|---|---|---|---|---|---|
| **Display** | `64px+` | `500` (Medium) | `tracking-tight` | `1.05` | Logo, Hero headline lớn nhất |
| **H1** | `48px` | `500` | `tracking-tight` | `1.1` | Tiêu đề trang chính |
| **H2** | `32px` | `500` | `tracking-tight` | `1.2` | Section heading |
| **H3** | `24px` | `500` | `tracking-tight` | `1.3` | Card title, Nav item, Menu |
| **H4** | `20px` | `500` | `tracking-tight` | `1.4` | Sub-heading, Caption lớn |
| **Body** | `16px` | `400` | `normal` | `1.6` | Nội dung văn bản thông thường |
| **Small** | `14px` | `400` | `normal` | `1.5` | Label, metadata, helper text |
| **Caption** | `12px` | `400` | `normal` | `1.4` | Badge, timestamp, micro text |

### 3.3 Tailwind Classes thường dùng

```tsx
// Navigation / Menu items
className="text-[24px] font-medium tracking-tight"

// Section Promo captions
className="text-[20px] font-medium leading-snug tracking-tight"

// Body paragraph
className="text-base leading-relaxed text-muted-foreground"

// Section heading
className="text-3xl font-medium tracking-tight"
```

---

## 4. Spacing & Layout

### 4.1 Base Grid

- **Max Width:** `1920px` (capped với `max-w-full`)
- **Page Padding:** `px-6 py-4` (= `24px` horizontal, `16px` vertical)
- **Column Gap:** Phân tách bằng `border` 1px thay vì `gap`

### 4.2 Navbar

| Thuộc tính | Giá trị |
|---|---|
| Height | `60px` (cố định) |
| Padding | `px-6 py-4` (16px top/bottom, 24px left/right) |
| Layout | `flex justify-between items-center` |
| Background | `#F2F2F2` / `dark: zinc-900` |
| Border | `border-b border-black` (chỉ viền dưới) |
| Position | `fixed top-0 left-0 z-50` |

### 4.3 Page Sections

| Section | Layout | Columns |
|---|---|---|
| Homepage Top Grid | `grid` | 4 cột đều nhau (`lg:grid-cols-4`) |
| Homepage Hero Split | `grid` | 2 cột 50/50 (`lg:grid-cols-2`) |
| Footer Menu Bar | `flex justify-center` | 1 hàng ngang |
| Product Grid | `grid` | 3–4 cột (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) |

### 4.4 Section Internal Padding

| Loại | Padding |
|---|---|
| Dense (Nav, toolbar) | `p-4` / `px-6 py-4` |
| Standard (Card, cell) | `p-6` — `p-8` |
| Comfortable (Hero, landing) | `p-12` — `p-24` |

---

## 5. Borders & Dividers

> **Quy tắc cốt lõi:** Chỉ dùng `border-black` (không dùng `border-gray-*` hay `border-border` cho layout chính). Màu border mềm hơn (`border-border`) chỉ dùng trong nội thất component như card, input.

| Trường hợp | Class |
|---|---|
| Section divider (Light) | `border-b border-black` |
| Section divider (Dark) | `dark:border-zinc-800` |
| Column separator | `border-r border-black dark:border-zinc-800` |
| Navbar bottom | `border-b border-border` |
| Card / internal | `border border-border/50` |

---

## 6. Components

### 6.1 Button

File: `components/ui/button.tsx`

**Nguyên tắc:** Tất cả button đều `rounded-none` (góc vuông hoàn toàn), không shadow nặng.

#### Variants

| Variant | Light Mode | Dark Mode | Dùng khi |
|---|---|---|---|
| `default` | Nền đen, chữ trắng | Nền trắng, chữ đen | CTA chính, action quan trọng nhất |
| `outline` | Border đen, chữ đen, nền trong | Border trắng, chữ trắng | CTA thứ cấp, action ít quan trọng |
| `ghost` | Không border, hover bg nhẹ | Tương tự | Icon button, action ẩn |
| `destructive` | Nền đỏ | Nền đỏ tối | Xóa, cảnh báo nguy hiểm |
| `secondary` | Nền xám nhạt | Nền xám tối | Action trung tính |
| `link` | Chữ primary + gạch chân hover | Tương tự | Navigation inline |

#### Sizes

| Size | Height | Padding | Font Size |
|---|---|---|---|
| `sm` | `32px` | `px-4` | `12px` |
| `default` | `44px` | `px-6 py-3` | `14px` |
| `lg` | `48px` | `px-8` | `16px` |
| `icon` | `36px × 36px` | — | — |

#### Ví dụ sử dụng

```tsx
// CTA chính
<Button>Shop Now</Button>

// CTA với arrow icon (link button style)
<Link href="/journal" className="bg-black text-white inline-flex items-center gap-2 px-8 py-5 rounded-none transition-colors hover:bg-neutral-900">
  Read More <ArrowUpRight className="w-5 h-5" />
</Link>

// Outline secondary
<Button variant="outline">View All</Button>

// Icon-only (theme toggle)
<Button variant="ghost" size="icon">
  <Sun className="h-5 w-5" />
</Button>
```

### 6.2 Navbar

File: `shared/components/Navbar/index.tsx`

**Cấu trúc 7 phần tử** (Desktop):

```
[Logo] [Shop] [Journal] [About] [Search] [Profile/Login] [Cart + Theme]
```

- Desktop: `hidden lg:flex`, layout `justify-between`, height cố định 60px
- Mobile: `flex lg:hidden`, logo + icon cart + hamburger menu (Sheet)
- Logo SVG fill: `fill="black"` (hardcoded, không dùng `currentColor` vì logo luôn đen)
- Menu mobile: `Sheet` từ Radix UI, slide từ phải

### 6.3 Card (Product / Promo)

```tsx
// Promo card (homepage grid)
<div className="border-b border-black flex flex-col justify-between group cursor-pointer">
  <div className="h-[280px] overflow-hidden">
    <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
  </div>
  <div className="p-6 border-t border-black flex justify-between items-start gap-4">
    <span className="text-[20px] font-medium leading-snug tracking-tight">Caption text</span>
    <ArrowUpRight className="w-6 h-6 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
  </div>
</div>
```

### 6.4 Link (Navigation)

```tsx
// Standard nav link
<Link href="/shop" className="text-foreground hover:text-foreground/80 transition-colors">
  Shop
</Link>

// Menu list link (homepage, sidebar)
<Link href="/shop" className="block text-[24px] font-medium hover:underline tracking-tight">
  Shop All
</Link>
```

---

## 7. Icons

- **Library:** [Lucide React](https://lucide.dev/)
- **Standard size:** `w-5 h-5` (`20px`)
- **Large (promo arrow):** `w-6 h-6` (`24px`)
- **Key icons dùng trong dự án:**

| Icon | Import | Dùng ở |
|---|---|---|
| `ArrowUpRight` | `lucide-react` | Promo card link, CTA button |
| `Menu` | `lucide-react` | Mobile hamburger |
| `ShoppingBag` | `lucide-react` | Cart icon mobile |
| `Search` | `lucide-react` | Search button |
| `Sun` / `Moon` | `lucide-react` | Theme toggle |
| `User` | `lucide-react` | Profile dropdown |
| `LogOut` | `lucide-react` | Logout |

---

## 8. Motion & Interaction

### 8.1 Hover States

| Element | Effect |
|---|---|
| Promo card image | `scale-105` trong 500ms |
| ArrowUpRight icon | `translate-x-1 -translate-y-1` trong 300ms |
| Nav link | `opacity` fade hoặc `text-foreground/80` |
| Menu link | `underline` |
| Button | `bg-black/90` (slightly lighter) |

### 8.2 Transitions

```tsx
// Image scale
className="transition-transform duration-500 group-hover:scale-105"

// Arrow icon motion
className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"

// Color/theme
className="transition-colors duration-300"

// General fast transition
className="transition-all duration-150"
```

---

## 9. Responsive Breakpoints

Sử dụng hệ thống breakpoint chuẩn của Tailwind CSS:

| Breakpoint | Size | Strategy |
|---|---|---|
| `sm` | `640px` | Điều chỉnh padding, font size nhỏ |
| `md` | `768px` | 2-column grid, sidebar xuất hiện |
| `lg` | `1024px` | Desktop layout đầy đủ, Navbar desktop |
| `xl` | `1280px` | Grid mở rộng 4 cột |
| `2xl` | `1536px` | Max layout, padding tăng |

**Mobile-first approach:**
- Mobile: Layout stack dọc, padding `p-4`–`p-8`
- Desktop (`lg:`): Grid ngang, padding `p-12`–`p-24`
- Navbar: `hidden lg:flex` (desktop) / `flex lg:hidden` (mobile)

---

## 10. File Structure (Design-related)

```
frontend/
├── app/
│   ├── globals.css         # CSS variables, Tailwind config, global styles
│   ├── layout.tsx          # Root layout (font, theme provider)
│   └── page.tsx            # Homepage
│
├── components/
│   └── ui/                 # Shadcn/UI base components
│       ├── button.tsx      # ⭐ Customized — rounded-none, monochrome
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── sheet.tsx       # Mobile drawer/menu
│       └── ...
│
├── shared/
│   ├── components/
│   │   ├── Navbar/         # ⭐ Customized — 7-column flex layout
│   │   ├── Footer/
│   │   ├── InputField/
│   │   └── PasswordField/
│   └── layouts/
│       └── PublicLayout/   # Wraps Navbar + main + Footer
│
└── DESIGN.md               # 📌 Tài liệu này
```

---

## 11. Naming Conventions

| Loại | Convention | Ví dụ |
|---|---|---|
| Component files | PascalCase, trong folder cùng tên | `Navbar/index.tsx` |
| CSS custom properties | kebab-case | `--color-background` |
| Tailwind classes | Không đặt tên, dùng inline | `className="..."` |
| Page files | `page.tsx` (Next.js App Router) | `app/shop/page.tsx` |
| Layout files | `layout.tsx` | `app/layout.tsx` |

---

## 12. Do & Don't

### ✅ Do
- Dùng `rounded-none` cho tất cả button và input chính
- Phân tách section bằng `border-b border-black`
- Dùng `text-[24px] font-medium tracking-tight` cho menu/navigation text
- Dùng `group` + `group-hover:` để tạo hover effect tổng thể cho card
- Luôn test cả Light và Dark mode trước khi commit

### ❌ Don't
- **Đừng** dùng `rounded-lg` hay `rounded-full` cho button chính
- **Đừng** thêm `shadow-xl` hay `drop-shadow` vào layout element
- **Đừng** dùng màu brand primary (xanh/tím/đỏ) cho UI chính — chỉ monochrome
- **Đừng** dùng viền dọc (`border-r`) trong Navbar
- **Đừng** dùng font size nhỏ hơn `14px` cho text tương tác (a11y)
- **Đừng** dùng Accent Yellow (`#C8FF00`) cho nền section lớn

---

*Cập nhật lần cuối: 2026-07-14 | Phiên bản: 1.0*
