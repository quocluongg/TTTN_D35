package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.ProductAttributeKeyRequest;
import ptithcm.tttnd35backend.dto.response.ProductAttributeKeyResponse;
import ptithcm.tttnd35backend.entity.ProductAttributeKey;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.ProductAttributeKeyMapper;
import ptithcm.tttnd35backend.repository.IProductAttributeKeyRepository;
import ptithcm.tttnd35backend.repository.IProductSpecificationRepository;
import ptithcm.tttnd35backend.service.IProductAttributeKeyService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductAttributeKeyServiceImpl implements IProductAttributeKeyService {

    private final IProductAttributeKeyRepository attributeKeyRepository;
    private final IProductSpecificationRepository specificationRepository;
    private final ProductAttributeKeyMapper attributeKeyMapper;

    @Override
    public List<ProductAttributeKeyResponse> getAll() {
        return attributeKeyMapper.toResponseList(attributeKeyRepository.findAllByOrderBySortOrderAscNameAsc());
    }

    @Override
    @Transactional
    public ProductAttributeKeyResponse create(ProductAttributeKeyRequest request) {
        if (attributeKeyRepository.existsByName(request.getName())) {
            throw new BadRequestException("Tên key đã tồn tại: " + request.getName());
        }
        ProductAttributeKey key = attributeKeyMapper.toEntity(request);
        return attributeKeyMapper.toResponse(attributeKeyRepository.save(key));
    }

    @Override
    @Transactional
    public ProductAttributeKeyResponse update(Integer id, ProductAttributeKeyRequest request) {
        ProductAttributeKey key = attributeKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy attribute key"));

        if (!key.getName().equals(request.getName()) && attributeKeyRepository.existsByName(request.getName())) {
            throw new BadRequestException("Tên key đã tồn tại: " + request.getName());
        }

        attributeKeyMapper.updateEntityFromRequest(request, key);
        try {
            return attributeKeyMapper.toResponse(attributeKeyRepository.save(key));
        } catch (DataIntegrityViolationException e) {
            throw new BadRequestException("Tên key đã tồn tại: " + request.getName());
        }
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        ProductAttributeKey key = attributeKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy attribute key"));

        if (specificationRepository.existsByAttributeKeyId(id)) {
            throw new BadRequestException("Đang có sản phẩm dùng thông số này, không thể xóa key");
        }

        attributeKeyRepository.delete(key);
    }
}
