package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.CampaignItemRequest;
import ptithcm.tttnd35backend.dto.request.CampaignRequest;
import ptithcm.tttnd35backend.dto.response.CampaignItemResponse;
import ptithcm.tttnd35backend.dto.response.CampaignResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface ICampaignService {

    List<CampaignResponse> getAll();

    CampaignResponse getById(UUID id);

    CampaignResponse create(CampaignRequest request);

    CampaignResponse update(UUID id, CampaignRequest request);

    CampaignResponse setActive(UUID id, boolean active);

    List<CampaignItemResponse> getItems(UUID campaignId);

    CampaignItemResponse addItem(UUID campaignId, CampaignItemRequest request);

    CampaignItemResponse updateItem(UUID campaignId, UUID itemId, CampaignItemRequest request);

    void deleteItem(UUID campaignId, UUID itemId);

    /**
     * Giá sale hiện tại (nếu có) của từng variant - dùng cho Cart/Order/trang shop.
     * Chỉ trả về variant đang thật sự nằm trong 1 campaign is_active=true và trong khoảng thời gian hiệu lực.
     * Không có trong map = variant không đang sale, dùng giá gốc.
     */
    Map<UUID, BigDecimal> getActiveSalePrices(Set<UUID> variantIds);
}
