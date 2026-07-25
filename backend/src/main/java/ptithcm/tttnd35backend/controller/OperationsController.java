package ptithcm.tttnd35backend.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.*;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.service.OperationsService;
import java.time.LocalDateTime; import java.util.*;

@RestController @RequestMapping("/admin") @RequiredArgsConstructor
public class OperationsController {
 private final OperationsService service;
 private <T> ResponseEntity<ApiResponse<T>> ok(T data){return ResponseEntity.ok(ApiResponse.<T>builder().success(true).data(data).timestamp(LocalDateTime.now()).build());}
 @GetMapping("/inventory") @PreAuthorize("hasAuthority('INVENTORY_VIEW')") public ResponseEntity<ApiResponse<List<Map<String,Object>>>> inventory(){return ok(service.inventory());}
 @PostMapping("/inventory/{variantId}/adjust") @PreAuthorize("hasAuthority('INVENTORY_UPDATE')") public ResponseEntity<ApiResponse<Void>> adjust(@PathVariable long variantId,@Valid @RequestBody InventoryAdjustmentRequest r,@AuthenticationPrincipal UserPrincipal p){service.adjustInventory(variantId,r,p.getProfile());return ok(null);}
 @GetMapping("/orders") @PreAuthorize("hasAuthority('ORDER_VIEW_ALL')") public ResponseEntity<ApiResponse<List<Map<String,Object>>>> orders(@RequestParam(required=false) String status){return ok(service.orders(status));}
 @PatchMapping("/orders/{id}/status") @PreAuthorize("hasAuthority('ORDER_UPDATE_STATUS')") public ResponseEntity<ApiResponse<Void>> status(@PathVariable UUID id,@Valid @RequestBody OrderStatusRequest r,@AuthenticationPrincipal UserPrincipal p){service.updateOrder(id,r,p.getProfile());return ok(null);}
 @GetMapping("/promotions") @PreAuthorize("hasAuthority('PROMOTION_MANAGE')") public ResponseEntity<ApiResponse<List<Map<String,Object>>>> promotions(){return ok(service.promotions());}
 @PostMapping("/promotions") @PreAuthorize("hasAuthority('PROMOTION_MANAGE')") public ResponseEntity<ApiResponse<UUID>> promotion(@Valid @RequestBody PromotionRequest r,@AuthenticationPrincipal UserPrincipal p){return ok(service.savePromotion(null,r,p.getProfile()));}
 @PutMapping("/promotions/{id}") @PreAuthorize("hasAuthority('PROMOTION_MANAGE')") public ResponseEntity<ApiResponse<UUID>> promotion(@PathVariable UUID id,@Valid @RequestBody PromotionRequest r,@AuthenticationPrincipal UserPrincipal p){return ok(service.savePromotion(id,r,p.getProfile()));}
 @GetMapping("/warranties") @PreAuthorize("hasAuthority('WARRANTY_MANAGE')") public ResponseEntity<ApiResponse<List<Map<String,Object>>>> warranties(@RequestParam(required=false) String status){return ok(service.warranties(status));}
 @PostMapping("/warranties/{id}/history") @PreAuthorize("hasAuthority('WARRANTY_MANAGE')") public ResponseEntity<ApiResponse<Void>> warranty(@PathVariable UUID id,@Valid @RequestBody WarrantyUpdateRequest r,@AuthenticationPrincipal UserPrincipal p){service.updateWarranty(id,r,p.getProfile());return ok(null);}
 @GetMapping("/news") @PreAuthorize("hasAuthority('NEWS_MANAGE')") public ResponseEntity<ApiResponse<List<Map<String,Object>>>> news(@RequestParam(required=false) String status){return ok(service.news(status));}
 @PostMapping("/news") @PreAuthorize("hasAuthority('NEWS_MANAGE')") public ResponseEntity<ApiResponse<UUID>> news(@Valid @RequestBody NewsRequest r,@AuthenticationPrincipal UserPrincipal p){return ok(service.saveNews(null,r,p.getProfile()));}
 @PutMapping("/news/{id}") @PreAuthorize("hasAuthority('NEWS_MANAGE')") public ResponseEntity<ApiResponse<UUID>> news(@PathVariable UUID id,@Valid @RequestBody NewsRequest r,@AuthenticationPrincipal UserPrincipal p){return ok(service.saveNews(id,r,p.getProfile()));}
}
