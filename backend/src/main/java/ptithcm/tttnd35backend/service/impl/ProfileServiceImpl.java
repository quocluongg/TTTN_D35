package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ptithcm.tttnd35backend.dto.request.UpdateProfileRequest;
import ptithcm.tttnd35backend.dto.response.ProfileResponse;
import ptithcm.tttnd35backend.entity.Profile;
import ptithcm.tttnd35backend.exception.ResourceNotFoundException;
import ptithcm.tttnd35backend.mapper.ProfileMapper;
import ptithcm.tttnd35backend.repository.IProfileRepository;
import ptithcm.tttnd35backend.service.IProfileService;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements IProfileService {

    private final IProfileRepository profileRepository;
    private final ProfileMapper profileMapper;

    @Override
    public ProfileResponse getMe(UUID profileId) {
        return profileMapper.toResponse(getProfileOrThrow(profileId));
    }

    @Override
    @Transactional
    public ProfileResponse updateMe(UUID profileId, UpdateProfileRequest request) {
        Profile profile = getProfileOrThrow(profileId);

        profile.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) {
            profile.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getEmailNotif() != null) {
            profile.setEmailNotif(request.getEmailNotif());
        }
        if (request.getPushNotif() != null) {
            profile.setPushNotif(request.getPushNotif());
        }
        if (request.getSystemNotif() != null) {
            profile.setSystemNotif(request.getSystemNotif());
        }

        return profileMapper.toResponse(profileRepository.save(profile));
    }

    private Profile getProfileOrThrow(UUID profileId) {
        return profileRepository.findByIdWithRole(profileId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
    }
}
