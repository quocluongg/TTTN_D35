package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.response.ProductResponse;

import java.util.List;

public interface IProductService {
    List<ProductResponse> getProducts(
            String category,
            List<String> useCases,
            Long maxPrice,
            String sortBy
    );

    List<String> getAllCategoryNames();
}
