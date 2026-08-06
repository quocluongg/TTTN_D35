-- Migration V41: Seed tin tức mẫu chất lượng cao vào bảng news
INSERT INTO news (id, title, slug, excerpt, content, thumbnail, category, is_published, published_at, view_count, created_at, updated_at)
VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'Đánh giá Asus Zenbook 14 OLED 2024: Màn 3K 120Hz, chip Intel Core Ultra 7 siêu tiết kiệm pin',
    'danh-gia-asus-zenbook-14-oled-2024',
    'Asus Zenbook 14 OLED (UX3405) đánh dấu bước tiến mới của dòng laptop mỏng nhẹ với chip Intel Core Ultra AI, màn hình OLED 120Hz rực rỡ cùng thời lượng pin ấn tượng cả ngày dài.',
    '<h2>Tổng quan thiết kế đột phá</h2><p>Asus Zenbook 14 OLED UX3405 mang phong cách thiết kế tối giản nhưng sang trọng với vỏ nhôm nguyên khối. Trọng lượng nhẹ chỉ 1.2 kg cùng độ mỏng 14.9 mm giúp chiếc máy trở thành người bạn đồng hành lý tưởng cho giới văn phòng và sáng tạo nội dung.</p><h2>Màn hình OLED 3K 120Hz sống động</h2><p>Điểm ăn tiền nhất trên chiếc Zenbook mới chính là màn hình Lumina OLED kích thước 14 inch, độ phân giải 3K (2880 x 1800) và tần số quét 120Hz. Màu sắc rực rỡ, độ tương phản tuyệt đối và chuẩn màu 100% DCI-P3 đáp ứng tốt nhu cầu đồ họa lẫn giải trí phim ảnh đỉnh cao.</p><h2>Hiệu năng vi xử lý AI Intel Core Ultra</h2><p>Được trang bị vi xử lý Intel Core Ultra 7 155H tích hợp NPU AI chuyên dụng, chiếc laptop này xử lý mượt mà mọi tác vụ từ văn phòng nặng, chỉnh sửa ảnh Lightroom/Photoshop đến export video 4K nhanh chóng.</p>',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
    'TECH',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    1580,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'a2222222-2222-2222-2222-222222222222',
    'Chương trình khuyến mãi Siêu Đại Tiệc Công Nghệ: Giảm giá tới 30% toàn bộ Laptop & Phụ kiện',
    'chuong-trinh-khuyen-mai-sieu-dai-tiec-cong-nghe',
    'ShopWise bùng nổ siêu ưu đãi lớn nhất mùa hè này! Giảm trực tiếp tới 30% cho các dòng Laptop Gaming, MacBook, bàn phím cơ và tai nghe không dây chính hãng từ ngày 10/08 đến 20/08.',
    '<h2>Chi tiết chương trình siêu khuyến mãi</h2><p>Nhằm tri ân khách hàng thân thiết, ShopWise chính thức tung ra đợt giảm giá lớn nhất năm với hàng ngàn deal sốc hấp dẫn:</p><ul><li><strong>Laptop Gaming:</strong> Giảm thẳng từ 2.000.000đ đến 5.000.000đ khi đặt mua online.</li><li><strong>Bàn phím & Chuột cơ:</strong> Mua 1 tặng 1 lót chuột cỡ lớn cùng mã voucher SHIPFREE.</li><li><strong>Voucher giảm thêm 10%:</strong> Nhập ngay mã <code>SHOPWISE10</code> khi thanh toán đơn hàng từ 1.000.000đ.</li></ul><h2>Thời gian và phạm vi áp dụng</h2><p>Chương trình áp dụng cho cả hình thức mua sắm trực tiếp tại hệ thống showroom ShopWise và đặt hàng online qua website chính thức.</p>',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
    'PROMOTION',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    2430,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'a3333333-3333-3333-3333-333333333333',
    'Hướng dẫn vệ sinh và bảo dưỡng Laptop đúng cách tại nhà giúp tăng tuổi thọ thiết bị',
    'huong-dan-ve-sinh-bao-duong-laptop-tai-nha',
    'Vệ sinh laptop định kỳ giúp máy luôn mát mẻ, hạn chế tiếng ồn quạt tản nhiệt và kéo dài tuổi thọ linh kiện. Hãy cùng ShopWise tìm hiểu các bước bảo dưỡng laptop an toàn ngay tại nhà.',
    '<h2>Dụng cụ cần chuẩn bị</h2><p>Trước khi bắt đầu, bạn cần chuẩn bị một bộ vệ sinh laptop chuyên dụng gồm: cọ mềm, bóng thổi bụi, khăn lau microfiber mịn và dung dịch vệ sinh màn hình chuyên dụng.</p><h2>Các bước thực hiện chi tiết</h2><ol><li><strong>Tắt nguồn & Ngắt sạc:</strong> Rút toàn bộ dây cáp, nguồn sạc và tắt hẳn máy để đảm bảo an toàn điện.</li><li><strong>Làm sạch bàn phím:</strong> Dùng bóng thổi bụi quét sạch mảng bám dưới khe phím, sau đó dùng cọ mềm quét nhẹ.</li><li><strong>Vệ sinh màn hình:</strong> Xịt dung dịch làm sạch lên khăn microfiber (không xịt trực tiếp lên màn hình) rồi lau nhẹ nhàng theo chiều dọc.</li></ol>',
    'https://images.unsplash.com/photo-1588702547919-26089e690ecd?w=800&auto=format&fit=crop&q=80',
    'GUIDE',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    980,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    'a4444444-4444-4444-4444-444444444444',
    'Apple ra mắt dòng MacBook Pro M4 hoàn toàn mới: Sức mạnh xử lý AI vượt trội',
    'apple-ra-mat-macbook-pro-m4-moi',
    'Apple chính thức giới thiệu thế hệ MacBook Pro trang bị chip M4, M4 Pro và M4 Max mang đến hiệu năng đồ họa cực khủng cùng khả năng xử lý trí tuệ nhân tạo Apple Intelligence mượt mà.',
    '<h2>Chipset M4 Family - Đỉnh cao công nghệ bán dẫn</h2><p>Dòng chip Apple M4 được sản xuất trên tiến trình 3nm thế hệ thứ 2, giúp gia tăng 50% hiệu năng CPU và gấp đôi khả năng xử lý đồ họa Ray Tracing so với thế hệ M2 tiền nhiệm.</p><h2>Màn hình Nano-texture chống chói</h2><p>Tùy chọn màn hình mặt kính Nano-texture mới giúp giảm thiểu hiện tượng phản xạ ánh sáng, mang lại trải nghiệm xem rõ nét ngay cả dưới nguồn sáng mạnh.</p>',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    'NEWS',
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '5 hours',
    3120,
    CURRENT_TIMESTAMP - INTERVAL '5 hours',
    CURRENT_TIMESTAMP - INTERVAL '5 hours'
)
ON CONFLICT (id) DO NOTHING;
