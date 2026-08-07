package ptithcm.tttnd35backend.service.payment;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import ptithcm.tttnd35backend.dto.response.PaymentInitResponse;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.entity.PaymentTransaction;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;
import ptithcm.tttnd35backend.util.helper.VnpayUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.TreeMap;

/**
 * Test ở https://sandbox.vnpayment.vn - đăng ký merchant test (miễn phí) để lấy vnp_TmnCode +
 * vnp_HashSecret, KHÔNG dùng tài khoản ngân hàng thật. Thẻ test NCB:
 * số thẻ 9704198526191432198, tên NGUYEN VAN A, ngày phát hành 07/15, OTP 123456
 * (danh sách đầy đủ: https://sandbox.vnpayment.vn/apis/vnpay-demo/).
 */
@Component
public class VnpayPaymentStrategy implements IPaymentStrategy {

    @Value("${service.payment.vnpay.tmn-code}")
    private String tmnCode;

    @Value("${service.payment.vnpay.hash-secret}")
    private String hashSecret;

    @Value("${service.payment.vnpay.pay-url}")
    private String payUrl;

    @Value("${service.payment.vnpay.return-url}")
    private String returnUrl;

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.VNPAY;
    }

    @Override
    public PaymentInitResponse init(Order order, PaymentTransaction transaction) {
        // vnp_Amount = số tiền * 100 (VNPay không nhận số thập phân, quy ước nhân 100 cho mọi đơn vị tiền).
        BigDecimal amountX100 = order.getTotalAmount().multiply(BigDecimal.valueOf(100));

        TreeMap<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", amountX100.toBigInteger().toString());
        params.put("vnp_CurrCode", "VND");
        // vnp_TxnRef = id của PaymentTransaction - dùng để đối chiếu ngược lại đơn khi nhận IPN.
        params.put("vnp_TxnRef", transaction.getId().toString());
        params.put("vnp_OrderInfo", "Thanh toan don hang " + order.getId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", currentClientIp());
        params.put("vnp_CreateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        String paymentUrl = VnpayUtil.buildPaymentUrl(payUrl, params, hashSecret);

        return PaymentInitResponse.builder()
                .orderId(order.getId())
                .paymentMethod(PaymentMethod.VNPAY)
                .amount(order.getTotalAmount())
                .paymentUrl(paymentUrl)
                .build();
    }

    private String currentClientIp() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return "127.0.0.1";
        }
        HttpServletRequest request = attrs.getRequest();
        String ip = request.getHeader("X-Forwarded-For");
        return (ip != null && !ip.isBlank()) ? ip.split(",")[0].trim() : request.getRemoteAddr();
    }
}
