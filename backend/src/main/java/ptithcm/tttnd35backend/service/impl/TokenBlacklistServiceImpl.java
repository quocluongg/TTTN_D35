package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import ptithcm.tttnd35backend.service.ITokenBlacklistService;

import java.time.Duration;

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
        redisTemplate.opsForValue().set(KEY_PREFIX + jti, "1", Duration.ofSeconds(remainingTtlSeconds));
    }

    @Override
    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + jti));
    }
}
