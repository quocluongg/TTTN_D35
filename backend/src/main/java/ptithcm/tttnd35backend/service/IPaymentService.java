package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.response.PaymentInitResponse;

import java.util.Map;
import java.util.UUID;

public interface IPaymentService {

    // profileId null = guest order (không check ownership, orderId coi như bí mật đủ khó đoán).
    PaymentInitResponse initPayment(UUID orderId, UUID profileId);

    // Khách quay lại từ trang VNPay - CHỈ hiển thị kết quả, KHÔNG chốt thanh toán ở đây (dễ bị giả
    // mạo qua trình duyệt/replay). Việc chốt PAID chỉ diễn ra ở handleVnpayIpn (server-to-server).
    Map<String, Object> handleVnpayReturn(Map<String, String> params);

    // VNPay gọi server-to-server để xác nhận thanh toán - nguồn duy nhất đáng tin để chốt PAID.
    // Trả về đúng format {"RspCode":..,"Message":..} VNPay yêu cầu.
    Map<String, String> handleVnpayIpn(Map<String, String> params);

    void handleStripeWebhook(String payload, String signatureHeader);
}
