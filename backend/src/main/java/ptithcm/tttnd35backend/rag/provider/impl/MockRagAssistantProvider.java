package ptithcm.tttnd35backend.rag.provider.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import ptithcm.tttnd35backend.rag.dto.*;
import ptithcm.tttnd35backend.rag.provider.RagAssistantProvider;
import ptithcm.tttnd35backend.repository.IProductRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(name = "rag.provider", havingValue = "mock", matchIfMissing = true)
@RequiredArgsConstructor
public class MockRagAssistantProvider implements RagAssistantProvider {

    private final IProductRepository productRepository;

    @Override
    public RagAnswerResponse answer(RagQueryRequest request, RagContext context) {
        String msg = request.getMessage() != null ? request.getMessage().toLowerCase() : "";
        List<RagSourceDto> sources = new ArrayList<>();

        String answer;
        BigDecimal confidence;

        if (msg.contains("laptop") || msg.contains("máy tính") || msg.contains("macbook")) {
            answer = "ShopWise hiện đang cung cấp nhiều dòng Laptop chính hãng bao gồm MacBook Air/Pro, Dell XPS, ASUS ZenBook với chế độ bảo hành 12-24 tháng và trả góp 0%. Bạn có thể xem chi tiết mục sản phẩm Laptop trên hệ thống!";
            confidence = new BigDecimal("0.9500");
            sources.add(RagSourceDto.builder()
                    .productId("cat-laptop")
                    .title("Danh mục Laptop ShopWise")
                    .url("/shop?category=laptop")
                    .snippet("Danh mục laptop chính hãng với các dòng MacBook, ASUS, Dell")
                    .build());
        } else if (msg.contains("bảo hành") || msg.contains("sửa chữa")) {
            answer = "Quy trình bảo hành tại ShopWise rất dễ dàng: mỗi sản phẩm sau khi giao hàng thành công sẽ được kích hoạt Thẻ bảo hành điện tử. Quý khách chỉ cần tra cứu theo mã đơn hàng hoặc số điện thoại trong mục Tài khoản -> Bảo hành.";
            confidence = new BigDecimal("0.9200");
            sources.add(RagSourceDto.builder()
                    .productId("policy-warranty")
                    .title("Chính sách bảo hành ShopWise")
                    .url("/news/chinh-sach-bao-hanh")
                    .snippet("Chế độ bảo hành điện tử chính hãng từ 12 đến 36 tháng.")
                    .build());
        } else if (msg.contains("giao hàng") || msg.contains("vận chuyển") || msg.contains("phí ship")) {
            answer = "ShopWise giao hàng toàn quốc. Miễn phí vận chuyển cho đơn hàng từ 1.000.000 VNĐ. Phí vận chuyển tiêu chuẩn cho các đơn khác là 30.000 VNĐ.";
            confidence = new BigDecimal("0.9800");
            sources.add(RagSourceDto.builder()
                    .productId("policy-shipping")
                    .title("Chính sách giao hàng")
                    .url("/news/chinh-sach-giao-hang")
                    .snippet("Giao hàng hỏa tốc trong 24h tại TP.HCM và Hà Nội.")
                    .build());
        } else {
            answer = "Cảm ơn bạn đã đặt câu hỏi cho Trợ lý AI ShopWise! Chúng tôi cung cấp các sản phẩm thiết bị công nghệ chính hãng, linh kiện và phụ kiện cao cấp. Bạn cần tư vấn về sản phẩm hoặc dịch vụ nào cụ thể?";
            confidence = new BigDecimal("0.7500");
        }

        return RagAnswerResponse.builder()
                .answer(answer)
                .confidence(confidence)
                .sources(sources)
                .suggestedProducts(new ArrayList<>())
                .provider("mock")
                .build();
    }

    @Override
    public HealthStatus health() {
        return HealthStatus.builder()
                .healthy(true)
                .providerName("MockRagAssistantProvider")
                .details("Mock Provider is running normally with dynamic context lookup.")
                .build();
    }
}
