package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import ptithcm.tttnd35backend.exception.BadRequestException;
import ptithcm.tttnd35backend.service.IStorageService;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Upload ảnh lên Supabase Storage qua REST API bằng service_role key (giữ ở server, KHÔNG lộ ra FE).
 * FE gửi multipart lên BE, BE validate loại file/kích thước rồi mới đẩy lên Supabase - an toàn hơn
 * để FE tự upload thẳng bằng anon key.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupabaseStorageServiceImpl implements IStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    private final RestClient restClient;

    @Value("${service.supabase.url}")
    private String supabaseUrl;

    @Value("${service.supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${service.supabase.storage-bucket}")
    private String bucket;

    @Override
    public String upload(String folder, MultipartFile file) {
        validate(file);

        String extension = extractExtension(file.getOriginalFilename());
        String path = folder + "/" + UUID.randomUUID() + extension;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        try {
            restClient.post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .header("Content-Type", file.getContentType())
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();
        } catch (IOException e) {
            throw new BadRequestException("Không đọc được file ảnh, vui lòng thử lại");
        } catch (Exception e) {
            throw new BadRequestException("Upload ảnh lên Supabase Storage thất bại: " + e.getMessage());
        }

        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
    }

    @Override
    public void delete(String publicUrl) {
        String path = extractPathFromPublicUrl(publicUrl);
        if (path == null) {
            // URL không đúng định dạng của bucket này (vd ảnh dán tay từ nguồn khác) - bỏ qua,
            // không có gì để xóa trên Supabase Storage.
            return;
        }
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;
        try {
            restClient.delete()
                    .uri(deleteUrl)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // Không throw ra ngoài: xóa DB record vẫn phải thành công dù file trên Storage có
            // xóa được hay không (vd đã bị xóa tay trước đó) - chỉ log để biết mà dọn thủ công.
            log.warn("Xóa file trên Supabase Storage thất bại cho path '{}': {}", path, e.getMessage());
        }
    }

    private String extractPathFromPublicUrl(String publicUrl) {
        String marker = "/storage/v1/object/public/" + bucket + "/";
        if (publicUrl == null || !publicUrl.contains(marker)) {
            return null;
        }
        return publicUrl.substring(publicUrl.indexOf(marker) + marker.length());
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File ảnh không được để trống");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Chỉ chấp nhận ảnh định dạng JPEG, PNG hoặc WEBP");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Kích thước ảnh tối đa 5MB");
        }
    }

    private String extractExtension(String originalFilename) {
        if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}
