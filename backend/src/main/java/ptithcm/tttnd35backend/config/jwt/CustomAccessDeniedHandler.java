package ptithcm.tttnd35backend.config.jwt;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Chạy khi request ĐÃ đăng nhập hợp lệ nhưng không đủ quyền (thiếu role/permission) 403.
 * Khác với JwtAuthenticationEntryPoint (401 - chưa đăng nhập/token sai).
 */
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final JsonMapper jsonMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .success(false)
                .message("Bạn không có quyền thực hiện thao tác này")
                .timestamp(LocalDateTime.now())
                .build();

        jsonMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}
