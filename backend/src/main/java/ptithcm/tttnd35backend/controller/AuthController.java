package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.request.RegisterRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.service.IAuthService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody @Valid RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Đăng ký thành công, vui lòng kiểm tra email để lấy mã xác thực")
                .timestamp(LocalDateTime.now())
                .build());
    }
}
