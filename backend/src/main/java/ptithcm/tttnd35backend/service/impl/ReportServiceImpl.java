package ptithcm.tttnd35backend.service.impl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.response.*;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.repository.IOrderItemRepository;
import ptithcm.tttnd35backend.repository.IOrderRepository;
import ptithcm.tttnd35backend.repository.IProductVariantRepository;
import ptithcm.tttnd35backend.service.IReportService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements IReportService {

    private final IOrderRepository orderRepository;
    private final IOrderItemRepository orderItemRepository;
    private final IProductVariantRepository variantRepository;

    @PersistenceContext
    private final EntityManager entityManager;

    @Override
    public List<RevenuePointResponse> getRevenueReport(LocalDateTime from, LocalDateTime to, String groupBy) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("Thời gian bắt đầu 'from' không được sau 'to'");
        }

        String dateFormat = "month".equalsIgnoreCase(groupBy) ? "YYYY-MM" : "YYYY-MM-DD";

        String sql = """
                SELECT TO_CHAR(created_at, '%s') AS period,
                       COALESCE(SUM(total_amount), 0) AS total_amount,
                       COUNT(id) AS order_count
                FROM orders
                WHERE (status = 'COMPLETED' OR payment_status = 'PAID')
                  AND status <> 'CANCELLED'
                  AND (:from IS NULL OR created_at >= :from)
                  AND (:to IS NULL OR created_at <= :to)
                GROUP BY TO_CHAR(created_at, '%s')
                ORDER BY period ASC
                """.formatted(dateFormat, dateFormat);

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("from", from);
        query.setParameter("to", to);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<RevenuePointResponse> result = new ArrayList<>();

        for (Object[] row : rows) {
            String period = (String) row[0];
            BigDecimal totalAmount = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            long count = row[2] != null ? ((Number) row[2]).longValue() : 0L;

            result.add(RevenuePointResponse.builder()
                    .period(period)
                    .totalAmount(totalAmount)
                    .orderCount(count)
                    .build());
        }

        return result;
    }

    @Override
    public List<TopProductResponse> getTopProducts(LocalDateTime from, LocalDateTime to, int limit) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("Thời gian bắt đầu 'from' không được sau 'to'");
        }
        int maxLimit = limit > 0 ? limit : 10;
        return orderItemRepository.findTopProducts(from, to, PageRequest.of(0, maxLimit));
    }

    @Override
    public List<TopCustomerResponse> getTopCustomers(LocalDateTime from, LocalDateTime to, int limit) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("Thời gian bắt đầu 'from' không được sau 'to'");
        }
        int maxLimit = limit > 0 ? limit : 10;
        return orderRepository.findTopCustomers(from, to, PageRequest.of(0, maxLimit));
    }

    @Override
    public List<OrderStatusSummaryResponse> getOrderStatusSummary(LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("Thời gian bắt đầu 'from' không được sau 'to'");
        }
        return orderRepository.countOrdersByStatus(from, to);
    }

    @Override
    public List<LowStockVariantResponse> getLowStockVariants(int threshold) {
        int targetThreshold = threshold > 0 ? threshold : 10;
        return variantRepository.findLowStockVariants(targetThreshold);
    }
}
