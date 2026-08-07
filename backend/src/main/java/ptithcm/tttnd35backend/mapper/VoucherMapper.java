package ptithcm.tttnd35backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ptithcm.tttnd35backend.dto.request.VoucherRequest;
import ptithcm.tttnd35backend.dto.response.VoucherResponse;
import ptithcm.tttnd35backend.entity.Voucher;

@Mapper(componentModel = "spring")
public interface VoucherMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usedCount", ignore = true)
    @Mapping(target = "isActive", source = "active")
    Voucher toEntity(VoucherRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usedCount", ignore = true)
    void updateEntityFromRequest(VoucherRequest request, @MappingTarget Voucher voucher);

    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "currentlyRunning", ignore = true)
    VoucherResponse toResponse(Voucher voucher);
}
