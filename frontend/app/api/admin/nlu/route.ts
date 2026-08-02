import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    // Thử gọi sang FastAPI AI Engine ở port 8000
    const aiEngineRes = await fetch(`http://localhost:8000/api/nlu/parse?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });

    if (aiEngineRes.ok) {
      const data = await aiEngineRes.json();
      return NextResponse.json({
        ...data,
        source: "PhoBERT / Rule AI Engine (port 8000)"
      });
    }
  } catch (err) {
    console.warn("AI Engine port 8000 not reachable, using fallback Next.js NLU parser.");
  }

  // Fallback NLU parser nếu server AI chưa khởi động
  const queryLower = q.toLowerCase();
  let intent = "general_query";
  let confidence = 0.85;

  if (/so sánh|khác gì|hơn hay|so sanh/i.test(queryLower)) {
    intent = "compare_products";
    confidence = 0.95;
  } else if (/cấu hình|thông số|chip|ram|ssd|màn hình|cau hinh|thong so/i.test(queryLower)) {
    intent = "ask_specs";
    confidence = 0.92;
  } else if (/bảo hành|đổi trả|bao lâu|1 đổi 1|bao hanh/i.test(queryLower)) {
    intent = "ask_warranty";
    confidence = 0.94;
  } else if (/khuyến mãi|ưu đãi|giảm giá|voucher|quà tặng/i.test(queryLower)) {
    intent = "ask_promotion";
    confidence = 0.93;
  } else if (/giá bao nhiêu|báo giá|bao nhiêu tiền|bao nhieu/i.test(queryLower)) {
    intent = "ask_price";
    confidence = 0.95;
  } else if (/đặt mua|mua ngay|order|thanh toán|dat mua/i.test(queryLower)) {
    intent = "order_product";
    confidence = 0.91;
  } else if (/khiếu nại|hỏng|bị lỗi|trầy xước|giao nhầm/i.test(queryLower)) {
    intent = "complain";
    confidence = 0.90;
  } else if (/tư vấn|gợi ý|nên mua|tầm giá|khoảng giá|dưới \d+/i.test(queryLower)) {
    intent = "purchase_consultation";
    confidence = 0.88;
  }

  // Fallback Rule NER
  const brands = ["Asus", "Dell", "Apple", "Lenovo", "HP", "Acer", "MSI", "Samsung", "LG", "Gigabyte", "Macbook"];
  const models = ["TUF Gaming", "ROG Strix", "XPS 13", "XPS 15", "Macbook Air", "Macbook Pro", "M1", "M2", "M3", "Legion 5", "Vivobook", "Nitro 5", "Victus", "Katana 15"];
  
  const entities: any[] = [];
  brands.forEach(b => {
    const idx = q.indexOf(b);
    if (idx !== -1) {
      entities.push({ text: b, entity_type: "BRAND", start_char: idx, end_char: idx + b.length, confidence: 0.98 });
    }
  });

  models.forEach(m => {
    const idx = q.indexOf(m);
    if (idx !== -1) {
      entities.push({ text: m, entity_type: "MODEL", start_char: idx, end_char: idx + m.length, confidence: 0.95 });
    }
  });

  // Extract Price & Spec regex
  const priceMatch = q.match(/(?:dưới|tầm|khoảng|trên)?\s*\d+\s*(?:triệu|tr|tỷ|k|đ|vnđ)/i);
  if (priceMatch && priceMatch.index !== undefined) {
    entities.push({ text: priceMatch[0], entity_type: "PRICE", start_char: priceMatch.index, end_char: priceMatch.index + priceMatch[0].length, confidence: 0.92 });
  }

  const specMatch = q.match(/RAM\s*\d+GB|SSD\s*\d+GB|RTX\s*\d{4}|Intel\s*Core\s*i[3579]/i);
  if (specMatch && specMatch.index !== undefined) {
    entities.push({ text: specMatch[0], entity_type: "SPEC", start_char: specMatch.index, end_char: specMatch.index + specMatch[0].length, confidence: 0.90 });
  }

  return NextResponse.json({
    original_query: q,
    intent,
    confidence,
    entities,
    intent_scores: {
      [intent]: confidence
    },
    source: "Next.js Fallback NLU Engine"
  });
}
