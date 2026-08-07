package ptithcm.tttnd35backend.util.helper;

import java.text.Normalizer;
import java.util.regex.Pattern;

/** Sinh slug chuẩn SEO từ tên tiếng Việt có dấu: bỏ dấu, lowercase, khoảng trắng/ký tự đặc biệt -> "-". */
public class SlugUtils {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\s-]");
    private static final Pattern WHITESPACE_OR_DASH = Pattern.compile("[\\s-]+");
    private static final Pattern EDGE_DASH = Pattern.compile("^-+|-+$");

    private SlugUtils() {
    }

    public static String toSlug(String input) {
        if (input == null) {
            return "";
        }
        String noAccent = Normalizer.normalize(input, Normalizer.Form.NFD);
        noAccent = DIACRITICS.matcher(noAccent).replaceAll("");
        noAccent = noAccent.replace('đ', 'd').replace('Đ', 'D');

        String slug = noAccent.toLowerCase();
        slug = NON_ALNUM.matcher(slug).replaceAll("");
        slug = slug.trim();
        slug = WHITESPACE_OR_DASH.matcher(slug).replaceAll("-");
        slug = EDGE_DASH.matcher(slug).replaceAll("");
        return slug;
    }

    /** Lấy tối đa 3 ký tự chữ/số đầu của slug, viết hoa - dùng làm prefix SKU (vd "dien-thoai" -> "DIE"). */
    public static String toShortPrefix(String slug, int length) {
        if (slug == null || slug.isBlank()) {
            return "SKU".substring(0, Math.min(length, 3));
        }
        String alnumOnly = slug.replace("-", "");
        String prefix = alnumOnly.length() >= length ? alnumOnly.substring(0, length) : alnumOnly;
        while (prefix.length() < length) {
            prefix = prefix + "X";
        }
        return prefix.toUpperCase();
    }
}
