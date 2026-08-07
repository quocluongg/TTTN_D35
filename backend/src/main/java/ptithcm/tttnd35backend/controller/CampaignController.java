package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.CampaignResponse;
import ptithcm.tttnd35backend.service.ICampaignService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final ICampaignService campaignService;

    // Trả tất cả campaign is_active=true (kể cả sắp diễn ra/đã qua)
    // lọc theo currentlyRunning nếu muốn hiện cái đang chạy, hoặc hiện cả "sắp diễn ra" nếu muốn teaser trước ngày sale.
    @GetMapping
    public ApiResponse<List<CampaignResponse>> getAll() {
        List<CampaignResponse> all = campaignService.getAll().stream()
                .filter(CampaignResponse::isActive)
                .toList();
        return ApiResponse.<List<CampaignResponse>>builder()
                .success(true)
                .data(all)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
