package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.request.StatusRequest;
import ptithcm.tttnd35backend.dto.request.VoucherRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.VoucherResponse;
import ptithcm.tttnd35backend.service.IVoucherService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/vouchers")
@RequiredArgsConstructor
public class AdminVoucherController {

    private final IVoucherService voucherService;

    @GetMapping
    @PreAuthorize("hasAuthority('VOUCHER_UPDATE')")
    public ApiResponse<List<VoucherResponse>> getAll() {
        return ApiResponse.<List<VoucherResponse>>builder()
                .success(true)
                .data(voucherService.getAll())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('VOUCHER_UPDATE')")
    public ApiResponse<VoucherResponse> getById(@PathVariable UUID id) {
        return ApiResponse.<VoucherResponse>builder()
                .success(true)
                .data(voucherService.getById(id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('VOUCHER_CREATE')")
    public ApiResponse<VoucherResponse> create(@RequestBody @Valid VoucherRequest request) {
        return ApiResponse.<VoucherResponse>builder()
                .success(true)
                .message("Tạo voucher thành công")
                .data(voucherService.create(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('VOUCHER_UPDATE')")
    public ApiResponse<VoucherResponse> update(@PathVariable UUID id, @RequestBody @Valid VoucherRequest request) {
        return ApiResponse.<VoucherResponse>builder()
                .success(true)
                .message("Cập nhật voucher thành công")
                .data(voucherService.update(id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('VOUCHER_DELETE')")
    public ApiResponse<VoucherResponse> setStatus(@PathVariable UUID id, @RequestBody @Valid StatusRequest request) {
        VoucherResponse response = voucherService.setActive(id, request.getIsActive());
        return ApiResponse.<VoucherResponse>builder()
                .success(true)
                .message(request.getIsActive() ? "Đã khôi phục voucher" : "Đã ẩn voucher")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
