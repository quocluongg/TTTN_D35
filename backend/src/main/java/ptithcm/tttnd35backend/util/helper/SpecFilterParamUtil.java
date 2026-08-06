package ptithcm.tttnd35backend.util.helper;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Parse query param động dạng "spec.<specKey>=<specValue>" (vd spec.RAM=16GB&spec.CPU=Intel)
 * thành Map<specKey, specValue> để lọc nhiều thông số kỹ thuật cùng lúc (AND).
 * Dùng HttpServletRequest thay vì @RequestParam cố định vì số lượng/tên spec_key không cố định
 * (mỗi loại sản phẩm có bộ thông số khác nhau - xem DB_Design_Report.docx mục VI.1).
 */
public final class SpecFilterParamUtil {

    private static final String PREFIX = "spec.";

    private SpecFilterParamUtil() {
    }

    public static Map<String, String> extract(HttpServletRequest request) {
        Map<String, String> specs = new LinkedHashMap<>();
        if (request == null) {
            return specs;
        }
        for (Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
            String paramName = entry.getKey();
            if (!paramName.startsWith(PREFIX) || paramName.length() <= PREFIX.length()) {
                continue;
            }
            String specKey = paramName.substring(PREFIX.length());
            String[] values = entry.getValue();
            if (values == null || values.length == 0) {
                continue;
            }
            String specValue = values[0];
            if (StringUtils.hasText(specKey) && StringUtils.hasText(specValue)) {
                specs.put(specKey, specValue);
            }
        }
        return specs;
    }
}
