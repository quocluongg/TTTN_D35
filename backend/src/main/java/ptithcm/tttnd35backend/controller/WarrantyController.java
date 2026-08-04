package ptithcm.tttnd35backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.WarrantyCardResponse;
import ptithcm.tttnd35backend.service.IWarrantyService;

import java.time.LocalDateTime;

@RestController
@RequestMapping({"/api/v1/warranty", "/warranty"})
@RequiredArgsConstructor
public class WarrantyController {

    private final IWarrantyService warrantyService;

    @GetMapping("/lookup")
    public ApiResponse<WarrantyCardResponse> lookup(
            @RequestParam String phone,
            @RequestParam String serial
    ) {
        return ApiResponse.<WarrantyCardResponse>builder()
                .success(true)
                .data(warrantyService.lookupWarranty(phone, serial))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
/*
 * Example cURL:
 * GET /api/v1/warranty/lookup?phone=0912345678&serial=WC-X89A12BC
 * curl -X GET "http://localhost:8080/api/v1/warranty/lookup?phone=0912345678&serial=WC-X89A12BC"
 */
