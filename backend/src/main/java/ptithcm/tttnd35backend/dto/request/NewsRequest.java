package ptithcm.tttnd35backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import ptithcm.tttnd35backend.util.enums.NewsCategory;

public record NewsRequest(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
        String title,

        String slug,

        String excerpt,

        @NotBlank(message = "Nội dung bài viết không được để trống")
        String content,

        String thumbnail,

        @NotNull(message = "Danh mục bài viết không được để trống")
        NewsCategory category,

        Boolean isPublished
) {}
