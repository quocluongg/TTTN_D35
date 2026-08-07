package ptithcm.tttnd35backend.service;

import ptithcm.tttnd35backend.dto.request.UpdateProfileRequest;
import ptithcm.tttnd35backend.dto.response.ProfileResponse;

import java.util.UUID;

public interface IProfileService {

    ProfileResponse getMe(UUID profileId);

    ProfileResponse updateMe(UUID profileId, UpdateProfileRequest request);
}
