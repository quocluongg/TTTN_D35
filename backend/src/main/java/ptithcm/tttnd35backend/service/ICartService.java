package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.CartItemQuantityRequest;
import ptithcm.tttnd35backend.dto.request.CartItemRequest;
import ptithcm.tttnd35backend.dto.response.CartResponse;

import java.util.UUID;

public interface ICartService {

    CartResponse getCart(UUID profileId);

    // Nếu variant đã có trong giỏ thì cộng dồn quantity, chưa có thì tạo mới.
    CartResponse addItem(UUID profileId, CartItemRequest request);

    CartResponse updateQuantity(UUID profileId, UUID cartItemId, CartItemQuantityRequest request);

    CartResponse removeItem(UUID profileId, UUID cartItemId);

    void clearCart(UUID profileId);
}
