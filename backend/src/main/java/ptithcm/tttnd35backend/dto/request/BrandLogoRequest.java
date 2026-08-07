package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandLogoRequest(
        @NotBlank(message = "Tên thương hiệu không được để trống")
        @Size(max = 150, message = "Tên thương hiệu tối đa 150 ký tự")
        String name,

        @NotBlank(message = "Logo URL không được để trống")
        String logoUrl,

        String websiteUrl,
        Integer sortOrder,
        Boolean isActive
) {}
