package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.CartItemQuantityRequest;
import ptithcm.tttnd35backend.dto.request.CartItemRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.CartResponse;
import ptithcm.tttnd35backend.service.ICartService;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final ICartService cartService;

    @GetMapping
    public ApiResponse<CartResponse> getCart(Authentication authentication) {
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .data(cartService.getCart(currentProfileId(authentication)))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addItem(Authentication authentication, @RequestBody @Valid CartItemRequest request) {
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .message("Đã thêm vào giỏ hàng")
                .data(cartService.addItem(currentProfileId(authentication), request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/items/{id}")
    public ApiResponse<CartResponse> updateQuantity(
            Authentication authentication, @PathVariable UUID id, @RequestBody @Valid CartItemQuantityRequest request) {
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .message("Đã cập nhật số lượng")
                .data(cartService.updateQuantity(currentProfileId(authentication), id, request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/items/{id}")
    public ApiResponse<CartResponse> removeItem(Authentication authentication, @PathVariable UUID id) {
        return ApiResponse.<CartResponse>builder()
                .success(true)
                .message("Đã xóa khỏi giỏ hàng")
                .data(cartService.removeItem(currentProfileId(authentication), id))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping
    public ApiResponse<?> clearCart(Authentication authentication) {
        cartService.clearCart(currentProfileId(authentication));
        return ApiResponse.builder()
                .success(true)
                .message("Đã xóa toàn bộ giỏ hàng")
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getProfile().getId();
    }
}
