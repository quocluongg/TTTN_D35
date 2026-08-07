package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.response.*;

import java.time.LocalDateTime;
import java.util.List;

public interface IReportService {

    List<RevenuePointResponse> getRevenueReport(LocalDateTime from, LocalDateTime to, String groupBy);

    List<TopProductResponse> getTopProducts(LocalDateTime from, LocalDateTime to, int limit);

    List<TopCustomerResponse> getTopCustomers(LocalDateTime from, LocalDateTime to, int limit);

    List<OrderStatusSummaryResponse> getOrderStatusSummary(LocalDateTime from, LocalDateTime to);

    List<LowStockVariantResponse> getLowStockVariants(int threshold);
}
