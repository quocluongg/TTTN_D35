-- Tách "đã xác thực email" (email_verified) ra khỏi "tài khoản có bị khóa hay không" (is_active).
-- Lý do: 2 khái niệm nghiệp vụ độc lập, gộp chung sẽ đá nhau khi admin khóa/mở khóa 1 acc đã verify.
alter table profiles
    add column email_verified boolean not null default false;
