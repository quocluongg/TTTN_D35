package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ptithcm.tttnd35backend.dto.request.WarrantyCardRequest;
import ptithcm.tttnd35backend.dto.response.WarrantyCardResponse;
import ptithcm.tttnd35backend.dto.response.WarrantyHistoryResponse;
import ptithcm.tttnd35backend.entity.WarrantyCard;
import ptithcm.tttnd35backend.entity.WarrantyHistory;

import java.util.List;

@Mapper(componentModel = "spring")
public interface IWarrantyMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "orderItem", ignore = true)
    @Mapping(target = "expiryDate", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    WarrantyCard toEntity(WarrantyCardRequest request);

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "orderItemId", source = "orderItem.id")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.fullName")
    @Mapping(target = "histories", ignore = true)
    WarrantyCardResponse toResponse(WarrantyCard entity);

    List<WarrantyCardResponse> toResponseList(List<WarrantyCard> entities);

    @Mapping(target = "warrantyCardId", source = "warrantyCard.id")
    @Mapping(target = "handledById", source = "handledBy.id")
    @Mapping(target = "handledByName", source = "handledBy.fullName")
    WarrantyHistoryResponse toHistoryResponse(WarrantyHistory history);

    List<WarrantyHistoryResponse> toHistoryResponseList(List<WarrantyHistory> histories);
}
