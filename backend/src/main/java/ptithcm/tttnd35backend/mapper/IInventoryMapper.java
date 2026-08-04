package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.response.InventoryAdjustmentResponse;
import ptithcm.tttnd35backend.entity.InventoryAdjustment;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IInventoryMapper {

    @Mapping(target = "variantId", source = "variant.id")
    @Mapping(target = "variantName", source = "variant.variantName")
    @Mapping(target = "adjustedById", source = "adjustedBy.id")
    @Mapping(target = "adjustedByName", source = "adjustedBy.fullName")
    InventoryAdjustmentResponse toResponse(InventoryAdjustment entity);

    List<InventoryAdjustmentResponse> toResponseList(List<InventoryAdjustment> entities);
}
