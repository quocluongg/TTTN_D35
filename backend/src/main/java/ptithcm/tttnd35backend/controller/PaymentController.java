package ptithcm.tttnd35backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.PaymentInitResponse;
import ptithcm.tttnd35backend.service.IPaymentService;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final IPaymentService paymentService;

    // Gọi sau khi tạo Order thành công để lấy paymentUrl (VNPay) / clientSecret (Stripe).
    // Cho phép cả khách vãng lai gọi (Authentication có thể null) vì Order guest không gắn user.
    @PostMapping("/{orderId}/init")
    public ApiResponse<PaymentInitResponse> init(Authentication authentication, @PathVariable UUID orderId) {
        UUID profileId = (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal)
                ? principal.getProfile().getId() : null;
        return ApiResponse.<PaymentInitResponse>builder()
                .success(true)
                .data(paymentService.initPayment(orderId, profileId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Trình duyệt khách được VNPay redirect về đây sau khi thanh toán - chỉ để hiển thị kết quả cho khách xem,
    // KHÔNG dùng để chốt đơn (xem giải trình trong PaymentServiceImpl.handleVnpayReturn).
    @GetMapping("/vnpay/return")
    public ApiResponse<Map<String, Object>> vnpayReturn(HttpServletRequest request) {
        Map<String, String> params = extractParams(request);
        return ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .data(paymentService.handleVnpayReturn(params))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // VNPay gọi server-to-server (không phải trình duyệt khách) - PHẢI trả đúng format {"RspCode","Message"}
    // theo tài liệu VNPay, không được bọc trong ApiResponse như các API khác.
    @GetMapping("/vnpay/ipn")
    public Map<String, String> vnpayIpn(HttpServletRequest request) {
        return paymentService.handleVnpayIpn(extractParams(request));
    }

    // Stripe gọi server-to-server. Bắt buộc đọc RAW body (không parse JSON qua @RequestBody) vì chữ ký
    // Stripe-Signature được tính trên chuỗi byte gốc - parse rồi build lại JSON sẽ làm sai lệch, verify luôn fail.
    @PostMapping("/stripe/webhook")
    public void stripeWebhook(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String payload = new String(request.getInputStream().readAllBytes());
        String signature = request.getHeader("Stripe-Signature");
        paymentService.handleStripeWebhook(payload, signature);
        response.setStatus(200);
    }

    private Map<String, String> extractParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return params;
    }
}
