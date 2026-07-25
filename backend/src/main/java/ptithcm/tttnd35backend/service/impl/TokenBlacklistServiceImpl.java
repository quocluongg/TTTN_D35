package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import ptithcm.tttnd35backend.service.ITokenBlacklistService;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistServiceImpl implements ITokenBlacklistService {

    private static final String KEY_PREFIX = "auth:blacklist:jti:";

    private final StringRedisTemplate redisTemplate;

    @Override
    public void blacklist(String jti, long remainingTtlSeconds) {
        if (remainingTtlSeconds <= 0) {
            return; // token đã hết hạn hoặc sắp hết ngay -> không cần lưu, tự nó đã vô giá trị
        }
        try {
            redisTemplate.opsForValue().set(KEY_PREFIX + jti, "1", Duration.ofSeconds(remainingTtlSeconds));
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để lưu blacklist jti={}: {}", jti, e.getMessage());
        }
    }

    @Override
    public boolean isBlacklisted(String jti) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + jti));
        } catch (Exception e) {
            log.warn("Không thể kết nối Redis để kiểm tra blacklist jti={}: {}", jti, e.getMessage());
            return false;
        }
    }
}
