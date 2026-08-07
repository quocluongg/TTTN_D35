package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.AddressRequest;
import ptithcm.tttnd35backend.dto.response.AddressResponse;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.service.IAddressService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()") // Sổ địa chỉ luôn gắn với 1 tài khoản cụ thể, không có endpoint public
public class AddressController {

    private final IAddressService addressService;

    @GetMapping
    public ApiResponse<List<AddressResponse>> getMyAddresses(Authentication authentication) {
        return ApiResponse.<List<AddressResponse>>builder()
                .success(true)
                .data(addressService.getMyAddresses(currentProfileId(authentication)))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping
    public ApiResponse<AddressResponse> create(
            Authentication authentication,
            @RequestBody @Valid AddressRequest request) {

        AddressResponse response = addressService.create(currentProfileId(authentication), request);
        return ApiResponse.<AddressResponse>builder()
                .success(true)
                .message("Thêm địa chỉ thành công")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<AddressResponse> update(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody @Valid AddressRequest request) {

        AddressResponse response = addressService.update(currentProfileId(authentication), id, request);
        return ApiResponse.<AddressResponse>builder()
                .success(true)
                .message("Cập nhật địa chỉ thành công")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/{id}/default")
    public ApiResponse<AddressResponse> setDefault(Authentication authentication, @PathVariable UUID id) {
        AddressResponse response = addressService.setDefault(currentProfileId(authentication), id);
        return ApiResponse.<AddressResponse>builder()
                .success(true)
                .message("Đã đặt làm địa chỉ mặc định")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(Authentication authentication, @PathVariable UUID id) {
        addressService.delete(currentProfileId(authentication), id);
        return ApiResponse.builder()
                .success(true)
                .message("Xóa địa chỉ thành công")
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getProfile().getId();
    }
}
