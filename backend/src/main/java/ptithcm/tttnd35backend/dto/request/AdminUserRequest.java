package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUserRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 2, max = 150) String fullName,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String role,
        @Size(max = 30) String phone) { }
