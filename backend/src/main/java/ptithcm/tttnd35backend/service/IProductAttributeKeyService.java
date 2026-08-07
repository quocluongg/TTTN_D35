package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.ProductAttributeKeyRequest;
import ptithcm.tttnd35backend.dto.response.ProductAttributeKeyResponse;

import java.util.List;

public interface IProductAttributeKeyService {

    List<ProductAttributeKeyResponse> getAll();

    ProductAttributeKeyResponse create(ProductAttributeKeyRequest request);

    ProductAttributeKeyResponse update(Integer id, ProductAttributeKeyRequest request);

    // Chặn xóa nếu đang có sản phẩm dùng key này (existsByAttributeKeyId).
    void delete(Integer id);
}
