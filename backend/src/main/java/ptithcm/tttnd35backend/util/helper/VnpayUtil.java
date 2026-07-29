package ptithcm.tttnd35backend.util.helper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;

// HMAC-SHA512 sign/verify theo  chuẩn VNPay - dùng chung cho lúc tạo URL thanh toán (init)
// và lúc xác thực chữ ký ở IPN/return callback (chống giả mạo request).
public class VnpayUtil {

    private VnpayUtil() {
    }

    public static String buildPaymentUrl(String payUrl, TreeMap<String, String> params, String hashSecret) {
        String hashData = buildHashData(params);
        String secureHash = hmacSha512(hashSecret, hashData);
        return payUrl + "?" + buildQueryString(params) + "&vnp_SecureHash=" + secureHash;
    }

    // Dùng khi nhận IPN/return: tự tính lại chữ ký từ params (trừ vnp_SecureHash) rồi so sánh.
    public static boolean verifySignature(Map<String, String> params, String hashSecret) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) {
            return false;
        }
        TreeMap<String, String> sorted = new TreeMap<>(params);
        sorted.remove("vnp_SecureHash");
        sorted.remove("vnp_SecureHashType");

        String expectedHash = hmacSha512(hashSecret, buildHashData(sorted));
        return MessageDigest.isEqual(
                expectedHash.getBytes(StandardCharsets.US_ASCII),
                receivedHash.getBytes(StandardCharsets.US_ASCII));
    }

    private static String buildHashData(Map<String, String> sortedParams) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isEmpty()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append('&');
            }
            sb.append(encode(entry.getKey())).append('=').append(encode(entry.getValue()));
        }
        return sb.toString();
    }

    private static String buildQueryString(Map<String, String> sortedParams) {
        return buildHashData(sortedParams);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private static String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo chữ ký VNPay", e);
        }
    }
}
