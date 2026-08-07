package ptithcm.tttnd35backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface IStorageService {

    /**
     * Upload 1 file lên Supabase Storage, trả về public URL.
     * @param folder thư mục con trong bucket, vd "products/{productId}"
     */
    String upload(String folder, MultipartFile file);

    /** Xóa file thật trên Supabase Storage theo public URL đã lưu, tránh rác file khi xóa ProductImage. */
    void delete(String publicUrl);
}
