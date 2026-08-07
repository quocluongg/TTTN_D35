package ptithcm.tttnd35backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ptithcm.tttnd35backend.config.security.UserPrincipal;
import ptithcm.tttnd35backend.dto.request.UpdateProfileRequest;
import ptithcm.tttnd35backend.dto.response.ApiResponse;
import ptithcm.tttnd35backend.dto.response.ProfileResponse;
import ptithcm.tttnd35backend.service.IProfileService;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final IProfileService profileService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> getMe(Authentication authentication) {
        ProfileResponse response = profileService.getMe(currentProfileId(authentication));
        return ApiResponse.<ProfileResponse>builder()
                .success(true)
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> updateMe(
            Authentication authentication,
            @RequestBody @Valid UpdateProfileRequest request) {

        ProfileResponse response = profileService.updateMe(currentProfileId(authentication), request);
        return ApiResponse.<ProfileResponse>builder()
                .success(true)
                .message("Cập nhật thông tin cá nhân thành công")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private UUID currentProfileId(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getProfile().getId();
    }
}
