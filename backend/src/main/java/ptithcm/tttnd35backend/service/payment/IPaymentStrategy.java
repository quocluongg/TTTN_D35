package ptithcm.tttnd35backend.service.payment;

import ptithcm.tttnd35backend.dto.response.PaymentInitResponse;
import ptithcm.tttnd35backend.entity.Order;
import ptithcm.tttnd35backend.entity.PaymentTransaction;
import ptithcm.tttnd35backend.util.enums.PaymentMethod;

// Mỗi cổng thanh toán implement 1 bản - PaymentServiceImpl chọn strategy theo Order.paymentMethod.
public interface IPaymentStrategy {

    PaymentMethod getMethod();

    // Khởi tạo giao dịch phía cổng thanh toán. Trả về URL (VNPay) hoặc clientSecret (Stripe) cho FE.
    // Được phép cập nhật transaction.providerTransactionId nếu cổng trả về id ngay lúc khởi tạo.
    PaymentInitResponse init(Order order, PaymentTransaction transaction);
}
