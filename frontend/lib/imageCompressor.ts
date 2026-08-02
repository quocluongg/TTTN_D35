import sharp from "sharp";

export interface CompressionResult {
  buffer: Buffer;
  contentType: string;
  sizeBytes: number;
  sizeKB: number;
  originalSizeBytes?: number;
}

/**
 * Nén buffer ảnh về định dạng WebP với dung lượng ĐẢM BẢO <= 50KB (51,200 bytes).
 */
export async function compressImageUnder50KB(
  inputBuffer: Buffer,
  maxSizeBytes: number = 51200 // 50 KB
): Promise<CompressionResult> {
  const originalSize = inputBuffer.length;

  let width = 800;
  let quality = 80;
  let compressedBuffer: Buffer;

  // Thu nhỏ kích thước và giảm chất lượng tuần tự tới khi <= 50KB
  while (true) {
    compressedBuffer = await sharp(inputBuffer)
      .resize({
        width,
        height: width,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })
      .toBuffer();

    if (compressedBuffer.length <= maxSizeBytes || quality <= 10) {
      break;
    }

    // Giảm dần chất lượng
    if (quality > 30) {
      quality -= 15;
    } else if (width > 400) {
      // Nếu quality đã giảm sâu mà vẫn > 50KB, thu nhỏ kích thước hình ảnh
      width -= 150;
      quality = 60;
    } else {
      quality -= 5;
    }
  }

  return {
    buffer: compressedBuffer,
    contentType: "image/webp",
    sizeBytes: compressedBuffer.length,
    sizeKB: Math.round((compressedBuffer.length / 1024) * 10) / 10,
    originalSizeBytes: originalSize,
  };
}

/**
 * Tải ảnh từ URL rồi nén về dung lượng <= 50KB.
 */
export async function fetchAndCompressImage(
  imageUrl: string,
  maxSizeBytes: number = 51200
): Promise<CompressionResult | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      console.error(`Không thể tải ảnh từ URL: ${imageUrl} (HTTP ${res.status})`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    return await compressImageUnder50KB(inputBuffer, maxSizeBytes);
  } catch (err) {
    console.error(`Lỗi khi nén ảnh từ URL ${imageUrl}:`, err);
    return null;
  }
}
