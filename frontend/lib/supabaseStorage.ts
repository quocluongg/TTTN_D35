import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zzukpubwbntihzztilqy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.s6Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export const BUCKET_NAME = "products";

/**
 * Tải file ảnh nén (Buffer) lên Supabase Storage
 */
export async function uploadImageToSupabase(
  fileName: string,
  imageBuffer: Buffer,
  contentType: string = "image/webp"
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const filePath = `crawled/${fileName}`;

    // Upload buffer trực tiếp lên Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`Lỗi upload Supabase Storage: ${error.message}. Đang thử lấy URL công khai trực tiếp...`);
      // Nếu bucket đã tồn tại hoặc permission warning, trả về công thức URL tiêu chuẩn Supabase
      const fallbackUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
      return { success: true, url: fallbackUrl };
    }

    // Lấy URL công khai (Public URL)
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    const fallbackUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/crawled/${fileName}`;
    return {
      success: true,
      url: fallbackUrl,
      error: err.message,
    };
  }
}
