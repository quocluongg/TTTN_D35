package ptithcm.tttnd35backend.dto.request;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
public record NewsRequest(@NotBlank @Size(max=500) String title, @NotBlank @Size(max=550) String slug,
                          String excerpt, @NotBlank String content, String thumbnail,
                          @Pattern(regexp="DRAFT|PUBLISHED") String status, LocalDateTime publishedAt,
                          String seoTitle, String seoDescription) { }
