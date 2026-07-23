package ptithcm.tttnd35backend.config.jwt;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Chạy khi request KHÔNG có / có token không hợp lệ mà lại gọi vào endpoint
 * yêu cầu đăng nhập -> trả 401 .
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final JsonMapper jsonMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String exceptionDetail = (String) request.getAttribute("exception");
        String message;
        if ("EXPIRED_TOKEN".equals(exceptionDetail)) {
            message = "Token đã hết hạn, vui lòng đăng nhập lại";
        } else if ("TOKEN_REVOKED".equals(exceptionDetail)) {
            message = "Token đã bị thu hồi (đã đăng xuất), vui lòng đăng nhập lại";
        } else if ("MALFORMED_TOKEN".equals(exceptionDetail) || "UNSUPPORTED_TOKEN".equals(exceptionDetail)) {
            message = "Token không đúng định dạng hoặc chữ ký sai";
        } else if ("ILLEGAL_ARGUMENT_TOKEN".equals(exceptionDetail)) {
            message = "Token không hợp lệ";
        } else {
            message = "Bạn cần đăng nhập để truy cập tài nguyên này";
        }

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();

        jsonMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}
