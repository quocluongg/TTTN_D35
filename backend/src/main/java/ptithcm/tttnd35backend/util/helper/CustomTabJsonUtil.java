package ptithcm.tttnd35backend.util.helper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ptithcm.tttnd35backend.dto.request.CustomTabRequest;
import ptithcm.tttnd35backend.dto.response.CustomTabResponse;

import java.util.ArrayList;
import java.util.List;

/**
 * Xử lý cột custom_tabs trong DB (JSON).
 *
 * Vấn đề: DB có thể lưu JSON bị double-encode (chuỗi chứa JSON thay vì JSON thật).
 * Content mỗi tab có thể là string hoặc object, không đồng nhất kiểu.
 *
 * Giải pháp: Dùng JsonNode thay vì List<CustomTabItem> để tránh crash Hibernate.
 * Class này bóc lớp double-encode và chuẩn hóa thành mảng JSON đúng chuẩn.
 *
 * Dùng ObjectMapper riêng (không inject Spring): Spring Boot 4 chỉ tạo bean Jackson 3,
 * không tạo bean ObjectMapper (Jackson 2) mặc dù library có mặt. Vì nhu cầu đơn giản
 * (chỉ readTree), tự new instance riêng cho lightweight, không phụ thuộc bean nào.
 */
public final class CustomTabJsonUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_UNWRAP_DEPTH = 3; // phòng hờ multi-encode, không loop vô hạn nếu data hỏng

    private CustomTabJsonUtil() {
    }

    /** Chuẩn hóa JsonNode đọc từ DB thành ArrayNode thật, tự bóc lớp chuỗi JSON lồng nếu có. */
    public static ArrayNode normalizeToArrayNode(JsonNode raw) {
        JsonNode current = raw;
        for (int depth = 0; depth < MAX_UNWRAP_DEPTH; depth++) {
            if (current == null || current.isNull() || current.isMissingNode()) {
                return JsonNodeFactory.instance.arrayNode();
            }
            if (current.isArray()) {
                return (ArrayNode) current;
            }
            if (current.isTextual()) {
                try {
                    current = MAPPER.readTree(current.asText());
                    continue;
                } catch (Exception e) {
                    // Text không phải JSON hợp lệ -> data hỏng thật sự, trả rỗng thay vì crash cả API.
                    return JsonNodeFactory.instance.arrayNode();
                }
            }
            // Object đơn lẻ hoặc kiểu lạ khác mảng -> coi như không có tab nào hợp lệ.
            return JsonNodeFactory.instance.arrayNode();
        }
        return JsonNodeFactory.instance.arrayNode();
    }

    /** Build danh sách response từ JsonNode đã lưu trong entity (đọc, hiển thị ra API). */
    public static List<CustomTabResponse> toResponseList(JsonNode raw) {
        ArrayNode items = normalizeToArrayNode(raw);
        List<CustomTabResponse> result = new ArrayList<>(items.size());
        for (JsonNode item : items) {
            String title = item.hasNonNull("title") ? item.get("title").asText() : "";
            // Giữ nguyên content dưới dạng JsonNode (không ép String) để không mất cấu trúc khi
            // content là object thông số kỹ thuật - FE tự biết render string hay bảng key-value.
            JsonNode content = item.has("content") ? item.get("content") : JsonNodeFactory.instance.textNode("");
            result.add(CustomTabResponse.builder().title(title).content(content).build());
        }
        return result;
    }

    /** Build ArrayNode để lưu vào entity từ request tạo/sửa sản phẩm (admin chỉ nhập tab dạng text). */
    public static ArrayNode buildFromRequests(List<CustomTabRequest> requests) {
        ArrayNode array = JsonNodeFactory.instance.arrayNode();
        if (requests == null) {
            return array;
        }
        for (CustomTabRequest request : requests) {
            ObjectNode node = JsonNodeFactory.instance.objectNode();
            node.put("title", request.getTitle());
            node.put("content", request.getContent());
            array.add(node);
        }
        return array;
    }
}
