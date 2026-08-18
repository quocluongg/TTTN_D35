-- Seed 1 tài khoản ADMIN và 1 tài khoản STAFF để test/demo
-- Mật khẩu đã băm bằng BCrypt (10 rounds), khớp với BCryptPasswordEncoder mặc định của Spring Security.
--   admin@ttshop.vn / Admin@123
--   staff@ttshop.vn / Staff@123
-- LƯU Ý: đây là tài khoản demo cho đồ án, đổi mật khẩu hoặc xoá seed này trước khi triển khai thật.

INSERT INTO profiles (email, password_hash, auth_provider, role_id, full_name, email_verified, is_active,
                       email_notif, push_notif, system_notif)
SELECT 'admin@ttshop.vn',
       '$2b$10$bqNarYOEFz6VPWZeq5fIeuTjXJdSPIrycLzcIeoS06OQoYIKxKcoW',
       'LOCAL',
       r.id,
       'Quản trị viên hệ thống',
       true,
       true,
       true,
       true,
       true
FROM roles r
WHERE r.name = 'ADMIN'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@ttshop.vn');

INSERT INTO profiles (email, password_hash, auth_provider, role_id, full_name, email_verified, is_active,
                       email_notif, push_notif, system_notif)
SELECT 'staff@ttshop.vn',
       '$2b$10$ySUAuz5ciofgGXjduk0lcuzBzK0W2RljNSkEaG7RXlIr0ZapcM5HO',
       'LOCAL',
       r.id,
       'Nhân viên vận hành',
       true,
       true,
       true,
       true,
       true
FROM roles r
WHERE r.name = 'STAFF'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'staff@ttshop.vn');
