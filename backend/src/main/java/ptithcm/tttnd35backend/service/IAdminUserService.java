package ptithcm.tttnd35backend.service;

import org.springframework.data.domain.Pageable;
import ptithcm.tttnd35backend.dto.request.UserCreateRequest;
import ptithcm.tttnd35backend.dto.request.UserLockRequest;
import ptithcm.tttnd35backend.dto.request.UserUpdateRequest;
import ptithcm.tttnd35backend.dto.response.UserAdminResponse;
import ptithcm.tttnd35backend.dto.response.pagination.PageResponse;

import java.util.UUID;

public interface IAdminUserService {

    PageResponse<UserAdminResponse> getUsers(String roleName, Boolean isActive, String search, Pageable pageable);

    UserAdminResponse getUserById(UUID id);

    UserAdminResponse createUser(UserCreateRequest request);

    UserAdminResponse updateUser(UUID id, UserUpdateRequest request);

    UserAdminResponse lockUser(UUID id, UserLockRequest request);
}
