package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.request.VoucherValidateRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.VoucherValidateResponse;
import ptithcm.tttnd35backend.service.IVoucherService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final IVoucherService voucherService;

    // Yêu cầu đăng nhập (mặc định catch-all authenticated() của SecurityConfig, không cần whitelist) -
    // vì check max_usage_per_user (giai đoạn 5) sẽ cần biết ai đang hỏi.
    @PostMapping("/validate")
    public ApiResponse<VoucherValidateResponse> validate(@RequestBody @Valid VoucherValidateRequest request) {
        return ApiResponse.<VoucherValidateResponse>builder()
                .success(true)
                .data(voucherService.validate(request))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
