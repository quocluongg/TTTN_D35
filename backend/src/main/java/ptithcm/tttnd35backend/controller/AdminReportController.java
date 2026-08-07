package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.response.*;
import ptithcm.tttnd35backend.service.IReportService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final IReportService reportService;

    @GetMapping("/revenue")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ApiResponse<List<RevenuePointResponse>> getRevenueReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "day") String groupBy
    ) {
        return ApiResponse.<List<RevenuePointResponse>>builder()
                .success(true)
                .data(reportService.getRevenueReport(from, to, groupBy))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ApiResponse<List<TopProductResponse>> getTopProducts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<List<TopProductResponse>>builder()
                .success(true)
                .data(reportService.getTopProducts(from, to, limit))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/top-customers")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ApiResponse<List<TopCustomerResponse>> getTopCustomers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<List<TopCustomerResponse>>builder()
                .success(true)
                .data(reportService.getTopCustomers(from, to, limit))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/order-status-summary")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ApiResponse<List<OrderStatusSummaryResponse>> getOrderStatusSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ApiResponse.<List<OrderStatusSummaryResponse>>builder()
                .success(true)
                .data(reportService.getOrderStatusSummary(from, to))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/inventory-low-stock")
    @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ApiResponse<List<LowStockVariantResponse>> getLowStockVariants(
            @RequestParam(defaultValue = "10") int threshold
    ) {
        return ApiResponse.<List<LowStockVariantResponse>>builder()
                .success(true)
                .data(reportService.getLowStockVariants(threshold))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
/*
 * Example cURL:
 * 1. GET /admin/reports/revenue?groupBy=month
 * curl -X GET "http://localhost:8080/admin/reports/revenue?groupBy=month" -H "Authorization: Bearer <TOKEN>"
 *
 * 2. GET /admin/reports/top-products?limit=5
 * curl -X GET "http://localhost:8080/admin/reports/top-products?limit=5" -H "Authorization: Bearer <TOKEN>"
 */
