"""
Vietnamese Electronics NLU Engine (PhoBERT Transformer + Rule-based Engine).

Module phân tích NLU chuyên ngành Điện tử Công nghệ:
- Chuẩn hóa văn bản tiếng Việt (viết tắt, đơn vị tiền tệ, khoảng trắng).
- Nhận diện Ý định (Intent Classification) theo 3 tầng: Rule Engine -> PhoBERT Model -> Fallback Engine.
- Trích xuất Thực thể (Named Entity Recognition - NER) theo 3 tầng:
  Rule/Regex -> PhoBERT Token Model (majority vote subtoken) -> Hậu xử lý nâng cao.
- Hậu xử lý nâng cao: lọc từ rác, gộp thực thể kề nhau, mở rộng dòng sản phẩm, fallback regex.
"""

import os
import re
import sys
import unicodedata
from collections import Counter
from typing import List, Dict, Tuple, Optional, Set

try:
    import torch
except ImportError:
    torch = None

# Đảm bảo import được schema từ package nlu
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlu.schema import IntentType, EntityType, ExtractedEntity, NLUResult

# ============================================================
# CẤU HÌNH DẪN ĐƯỜNG MODEL CHECKPOINT
# ============================================================
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INTENT_MODEL_DIR = "D:/ModelAI/intent_finetuned_model/intent_model"
NER_MODEL_DIR = "D:/ModelAI/ner_finetuned_model/model_finetuned"

# ============================================================
# CẤU HÌNH NER POST-PROCESSING
# ============================================================
NER_MAX_LEN = 64
NER_MAX_ENTITY_WORDS = 6
NER_CONF_MIN = 0.45        # subtoken dưới ngưỡng này không được tính nhãn
NER_WEAK_MIN = 0.35        # entity có conf trung bình dưới ngưỡng bị bỏ

# ============================================================
# 1. TIỀN XỬ LÝ VĂN BẢN TIẾNG VIỆT & CHUẨN HÓA
# ============================================================

# Từ điển viết tắt tiếng Việt thông dụng trong thương mại điện tử
ABBREV: Dict[str, str] = {
    "ko": "không", "k": "không", "hem": "không", "khong": "không",
    "hun": "hơn", "hon": "hơn",
    "nc": "nước", "dt": "điện thoại", "lap": "laptop", "tv": "tivi",
    "tr": "triệu", "trieu": "triệu", "nghin": "nghìn", "ngan": "nghìn",
    "dc": "được", "dk": "được", "bn": "bạn", "admin": "ad",
    "mn": "mọi người", "mọi ng": "mọi người",
    "bh": "bảo hành", "mo": "mở", "tui": "tôi", "muons": "muốn",
}

# Từ đệm ở cuối câu hỏi
FILLERS: Set[str] = frozenset([
    "ạ", "à", "nhé", "nhen", "hen", "hả", "đâu", "đó",
    "mà", "vậy", "thế", "thật", "lắm", "rồi", "đi"
])

# Từ rác/chức năng ở đầu thực thể cần loại bỏ (NER post-processing)
ENTITY_HEAD_STOPS: Set[str] = frozenset([
    "hỏi", "muốn", "đặt", "mua", "giúp", "bạn", "ơi", "cho", "tôi",
    "mình", "làm", "ơn", "hãy", "nhé", "nào", "không", "ạ", "tạo",
    "đơn", "hàng", "dưới", "trên", "có", "những", "loại", "chiếc",
    "máy", "tui", "moons",
])


def normalize_whitespace(text: str) -> str:
    """Chuẩn hóa khoảng trắng, dấu câu trong văn bản."""
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([?!,.])", r"\1", text)
    text = re.sub(r"([?!,.])\1+", r"\1", text)
    text = re.sub(r"([?!,.])(?=\S)", r"\1 ", text)
    return text


def normalize_money(text: str) -> str:
    """Quy đổi viết tắt đơn vị tiền tệ (k, tr, trieu, nghin) thành đầy đủ."""
    text = re.sub(r"(\d[\d.,]*)\s*([ktKT])\b", r"\1 nghìn", text)
    text = re.sub(r"(\d[\d.,]*)\s*tr\b", r"\1 triệu", text)
    text = re.sub(r"(\d[\d.,]*)trieu\b", r"\1 triệu", text, flags=re.IGNORECASE)
    text = re.sub(r"(\d[\d.,]*)\s*nghin\b", r"\1 nghìn", text, flags=re.IGNORECASE)
    return text


def replace_abbrev(text: str) -> str:
    """Thay thế từ viết tắt bằng từ đầy đủ theo từ điển ABBREV."""
    words = text.split()
    out = []
    for w in words:
        clean = re.sub(r"[?!,.]$", "", w).lower()
        if clean in ABBREV and len(clean) <= 5:
            out.append(ABBREV[clean] + w[len(clean):])
        else:
            out.append(w)
    return " ".join(out)


def normalize_intent(text: str) -> str:
    """Chuẩn hóa câu tiếng Việt cho model: viết tắt, tiền, khoảng trắng, từ đệm."""
    text = text.strip().lower()
    text = replace_abbrev(text)
    text = normalize_money(text)
    text = normalize_whitespace(text)
    words = text.split()
    if words and words[-1] in FILLERS:
        words = words[:-1]
    return " ".join(words).strip() or text


def strip_vietnamese_accents(text: str) -> str:
    """Bỏ dấu thanh tiếng Việt: 'tiền' -> 'tien'."""
    nfd = unicodedata.normalize("NFD", text)
    out = []
    for ch in nfd:
        if unicodedata.category(ch) == "Mn":
            continue
        if ch == "đ":
            ch = "d"
        elif ch == "Đ":
            ch = "D"
        out.append(ch)
    return "".join(out)


# ============================================================
# 2. DANH SÁCH RULE INTENT & THỰC THỂ NER HEURISTICS
# ============================================================

# Danh sách Pattern nhận diện Intent bằng Rule (trên văn bản không dấu)
INTENT_RULES: List[Tuple[str, IntentType, float]] = [
    # Chào hỏi / Greet
    (r"(^(xin\s+)?chao\b|^\bhi\b|^\bhello\b|^\balo\b|\bchao shop\b|\bchao em\b|\bchao ban\b)", IntentType.GREETING, 0.95),
    # order_product (gõ tắt) — đầu danh sách để ưu tiên
    (r"(moons mua|\bmuon mua\b)", IntentType.ORDER_PRODUCT, 0.85),
    # tư vấn ngân sách — trước ask_price
    (r"(duoi \d.*(tr|trieu|nghin|k)|duoi.*trieu co|tren \d.*(tr|trieu)|co.*duoi.*trieu|tam gia|khoang \d)", IntentType.PURCHASE_CONSULTATION, 0.88),
    # hỏi giá
    (r"(bao nhieu tien|gia tien|gia la bao nhieu|mat bao nhieu|gia ca|gia \d|bao nhieu dong|gi bao nhieu|gia \d.*(tr|trieu)|\d (tr|trieu).*(gia|bao nhieu)|gia (bao )?nhieu)", IntentType.ASK_PRICE, 0.90),
    # so sánh sản phẩm
    (r"(so voi|khac nhau gi|so sanh|loai nao hay hon|loai nao tot hon|\bvs\b|sanh voi)", IntentType.COMPARE_PRODUCTS, 0.92),
    # vận chuyển, giờ mở cửa — trước order_product
    (r"(co (ship|giao hang) (toan quoc|cod)?|\bship\b cod|mo cua luc|may gio mo|cua hang mo cua|co ship)", IntentType.GENERAL_QUERY, 0.85),
    # đặt hàng
    (r"(muon dat|mua giup|mua mot cai|\bdat mua\b|\bmuon mua\b|\bdat hang\b|giao toi nha toi)", IntentType.ORDER_PRODUCT, 0.90),
    # bảo hành
    (r"(bao hanh|bao duong|\bbh\b|doi tra|1 doi 1)", IntentType.ASK_WARRANTY, 0.92),
    # khuyến mãi
    (r"(khuyen mai|giam gia|sale|voucher|uu dai|san pham khuyen mai|qua tang)", IntentType.ASK_PROMOTION, 0.90),
    # phàn nàn / khiếu nại
    (r"(hu hong|bi hu|hu rot|tray|loi|nhan hang.*(bi|hu)|phan anh|khieu nai|tra hang|tray xuoc)", IntentType.COMPLAIN, 0.88),
    # tư vấn mua hàng tổng quát
    (r"(co (lap|loai|san pham|cai).*tot|nen mua|loai nao (tot|hay)|choi game tot|cho sinh vien|co laptop nao|can mua|tu van)", IntentType.PURCHASE_CONSULTATION, 0.88),
    # ngoài phạm vi hệ thống
    (r"(thoi tiet|the thao|chuyen tinh|ban nha|giai tri|chinh tri|nau an|thoi trang)", IntentType.OUT_OF_SCOPE, 0.95),
    # hỏi thông số kỹ thuật
    (r"(thong so|cau hinh|ram|ssd|pin|\bcpu\b|\bgpu\b|man hinh|chip)", IntentType.ASK_SPECS, 0.85),
]

# Rule loại trừ: nếu match rule chính nhưng cũng match EXCLUDE thì bỏ qua
INTENT_EXCLUDE: List[str] = []

# Mapping IntentType -> English label string (đồng bộ với model output)
INTENT_LABELS_EN: List[str] = [
    "greeting", "ask_specs", "compare_products", "ask_price", "ask_warranty",
    "purchase_consultation", "ask_promotion", "order_product",
    "complain", "general_query", "out_of_scope",
]

# Từ khóa Thương hiệu
BRAND_WORDS: Set[str] = {
    "asus", "dell", "hp", "lenovo", "msi", "acer", "apple", "samsung",
    "lg", "sony", "tcl", "philips", "xperia", "jbl", "logitech",
    "razer", "hyperx", "kingston", "seagate", "wd", "intel", "amd",
    "nvidia", "xiaomi", "oppo", "vivo", "realme", "honor", "huawei",
    "nokia", "panasonic", "toshiba", "sharp", "hitachi", "electrolux",
    "beko", "aqua", "mitsubishi", "daikin", "canon", "epson", "brother",
    "iphone", "macbook", "galaxy", "ipad",
}

# Các từ phụ trợ dòng sản phẩm (Product Line / Model) — dùng để mở rộng entity
MODEL_LINE_PARTS: Set[str] = {
    "air", "pro", "max", "ultra", "mini", "plus", "inverter", "master",
    "oled", "crystal", "charge", "legion", "pavilion", "katana", "strix",
    "tuf", "nitro", "rog", "iphone", "galaxy", "macbook", "ipad", "airpods",
    "buds", "redmi", "poco", "vivo", "xps", "v30", "note", "s24", "s23",
    "s22", "m1", "m2", "m3", "m4", "vivobook", "zenbook", "ideapad", "victus", "gram",
    "wh-1000xm5", "wh1000xm5", "c920", "u2723qe", "u2720q", "m404dn",
    "hr2240", "a80l", "side", "by", "s10",
}

# Regex trích xuất Thông số & Giá
SPEC_PATTERNS: List[str] = [
    r"(?i)\bRAM\s*\d+\s*(?:GB|MB)?\b",
    r"(?i)\bSSD\s*\d+\s*(?:GB|TB)?\b",
    r"(?i)\bHDD\s*\d+\s*(?:GB|TB)?\b",
    r"(?i)\bRTX\s*\d{4}(?:\s*Ti)?\b",
    r"(?i)\bGTX\s*\d{4}(?:\s*Ti)?\b",
    r"(?i)\bCore\s*i[3579]\b|\bi[3579]\s*\d{4,5}[A-Z]*\b",
    r"(?i)\bRyzen\s*[3579]\s*\d{4}[A-Z]*\b",
    r"(?i)\bApple\s*M[1234](?:\s*(?:Pro|Max))?\b",
    r"(?i)\bOLED\b|\b120Hz\b|\b144Hz\b|\b165Hz\b|\b2K\b|\b4K\b|\bFHD\b",
]

PRICE_RE = re.compile(r"\b\d[\d.,]*\s*(?:nghìn\s+)?(?:triệu|nghìn|k|tr|đ|vnđ)\b", re.IGNORECASE)
PRICE_TEXT_RE = re.compile(r"^\d[\d.,\s]*(?:triệu|nghìn|k|tr|đ|vnđ)?$", re.IGNORECASE)


# ============================================================
# 3. RULE-BASED NLU ENGINE (TẦNG NLU LUẬT & HEURISTICS)
# ============================================================

class RuleBasedNLUEngine:
    """
    Rule-based NLU: Intent classification bằng Regex + NER bằng heuristics/regex.
    Chạy nhanh, không cần model, dùng làm Tier 1 và fallback.
    """

    def detect_intent(self, normalized_text: str) -> Tuple[IntentType, float]:
        """Khớp pattern Regex trên text không dấu. Trả (intent, conf)."""
        unaccented = strip_vietnamese_accents(normalized_text)

        for pattern, intent, conf in INTENT_RULES:
            if re.search(pattern, unaccented):
                # Kiểm tra rule loại trừ
                if any(re.search(p, unaccented) for p in INTENT_EXCLUDE):
                    continue
                return intent, conf

        return IntentType.GENERAL_QUERY, 0.70

    def extract_entities(self, text: str) -> List[ExtractedEntity]:
        """Trích xuất thực thể bằng heuristics: BRAND dictionary + SPEC/PRICE regex + MODEL expansion."""
        raw_entities: List[Dict] = []
        words = text.split()

        # Step 1: Nhận diện Thương hiệu (BRAND) qua từ điển
        for w in words:
            clean_w = w.lower().strip("!?.,")
            if clean_w in BRAND_WORDS:
                match = re.search(r"\b" + re.escape(w) + r"\b", text, re.IGNORECASE)
                if match:
                    raw_entities.append({
                        "text": match.group(0),
                        "type": EntityType.BRAND,
                        "start": match.start(),
                        "end": match.end(),
                        "conf": 0.98
                    })

        # Step 2: Nhận diện Thông số kỹ thuật (SPEC) qua Regex
        for spec_pattern in SPEC_PATTERNS:
            for match in re.finditer(spec_pattern, text):
                if not any(e["start"] <= match.start() < e["end"] for e in raw_entities):
                    raw_entities.append({
                        "text": match.group(0),
                        "type": EntityType.SPEC,
                        "start": match.start(),
                        "end": match.end(),
                        "conf": 0.92
                    })

        # Step 3: Nhận diện Giá (PRICE) qua Regex
        for match in PRICE_RE.finditer(text):
            if not any(e["start"] <= match.start() < e["end"] for e in raw_entities):
                raw_entities.append({
                    "text": match.group(0),
                    "type": EntityType.PRICE,
                    "start": match.start(),
                    "end": match.end(),
                    "conf": 0.90
                })

        # Step 4: Sắp xếp theo vị trí trong câu
        raw_entities.sort(key=lambda x: x["start"])

        # Step 5: Mở rộng BRAND kết hợp dòng sản phẩm kế tiếp
        enhanced_entities: List[Dict] = []
        for ent in raw_entities:
            if ent["type"] == EntityType.BRAND and len(ent["text"].split()) == 1:
                pos = ent["end"]
                rest = text[pos:].strip().split()
                added = []
                for token in rest:
                    if token.lower().strip("!?.,") in MODEL_LINE_PARTS:
                        added.append(token)
                    else:
                        break
                if added:
                    ent["text"] = ent["text"] + " " + " ".join(added)
                    ent["end"] = ent["start"] + len(ent["text"])
                    ent["type"] = EntityType.MODEL
            enhanced_entities.append(ent)

        # Step 6: Chuyển đổi thành ExtractedEntity, làm sạch từ rác đầu
        final_entities: List[ExtractedEntity] = []
        for e in enhanced_entities:
            clean_text = e["text"]
            for head_stop in ENTITY_HEAD_STOPS:
                if clean_text.lower().startswith(head_stop + " "):
                    clean_text = clean_text[len(head_stop) + 1:].strip()

            if clean_text:
                final_entities.append(ExtractedEntity(
                    text=clean_text,
                    entity_type=e["type"],
                    start_char=e["start"],
                    end_char=e["start"] + len(clean_text),
                    confidence=e["conf"]
                ))

        return final_entities

    def parse(self, text: str) -> NLUResult:
        """Parse truy vấn: chuẩn hóa -> detect intent -> extract entities."""
        norm_text = normalize_intent(text)
        intent, conf = self.detect_intent(norm_text)
        entities = self.extract_entities(text)

        return NLUResult(
            original_query=text,
            intent=intent,
            confidence=conf,
            entities=entities,
            intent_scores={intent.value: conf}
        )


# ============================================================
# 4. NER POST-PROCESSOR (Hậu xử lý nâng cao từ best-ai)
# ============================================================

class NERPostProcessor:
    """
    Hậu xử lý kết quả NER từ PhoBERT Token Model.
    Bao gồm: majority vote subtoken, BIO extraction, head-stop cleaning,
    tail cleaning, weak entity filtering, PRICE regex fallback,
    brand expansion, entity merging with gap absorption.
    """

    @staticmethod
    def predict_raw(text: str, model, tokenizer) -> Tuple[List[str], List[str], List[float]]:
        """
        Chạy PhoBERT NER model và majority vote cấp từ.

        Returns: (words, word_labels, word_confs)
        """
        words = text.strip().split()
        inputs = tokenizer(
            words,
            is_split_into_words=True,
            return_tensors="pt",
            truncation=True,
            max_length=NER_MAX_LEN
        )
        with torch.no_grad():
            out = model(**inputs)
            logits = out.logits

        probs = torch.softmax(logits, dim=-1)[0]
        sub_labels = [model.config.id2label[int(p)] for p in logits.argmax(-1)[0]]
        sub_confs = [float(probs[i].max()) for i in range(len(sub_labels))]
        word_ids = inputs.word_ids()

        # Gom subtoken theo word_id
        buckets: Dict[int, List[Tuple[str, float]]] = {}
        for idx, wid in enumerate(word_ids):
            if wid is None:
                continue
            buckets.setdefault(wid, []).append((sub_labels[idx], sub_confs[idx]))

        # Majority vote — chỉ tính subtoken có confidence >= CONF_MIN
        w_labels: List[str] = []
        w_confs: List[float] = []
        for wid in sorted(buckets):
            votes = [lab for lab, conf in buckets[wid] if conf >= NER_CONF_MIN]
            confs = [conf for lab, conf in buckets[wid] if conf >= NER_CONF_MIN]
            if not votes:
                w_labels.append("O")
                w_confs.append(0.0)
                continue
            top = Counter(votes).most_common(1)[0][0]
            # Confidence trung bình của nhãn thắng
            matching_confs = [c for l, c in zip(votes, confs) if l == top]
            top_c = sum(matching_confs) / max(1, len(matching_confs))
            w_labels.append(top)
            w_confs.append(top_c)

        return words, w_labels, w_confs

    @staticmethod
    def extract_entities(words: List[str], labels: List[str], confs: List[float]) -> List[Dict]:
        """Trích xuất entity từ BIO labels."""
        entities = []
        start = 0
        cur_type = None

        for i in range(len(words) + 1):
            label = labels[i] if i < len(words) else "O"
            base = label[2:] if label.startswith(("B-", "I-")) else None

            if cur_type is None and base is not None:
                cur_type = base
                start = i
            elif cur_type is not None and (base != cur_type or label == "O"):
                seg_conf = sum(confs[start:i]) / max(1, i - start)
                text = " ".join(words[start:i])
                if text:
                    entities.append({
                        "text": text,
                        "type": cur_type,
                        "conf": seg_conf
                    })
                cur_type = None

        return entities

    @staticmethod
    def clean(entities: List[Dict]) -> List[Dict]:
        """Hậu xử lý: cắt đầu đuôi nhiễu, lọc entity yếu, kiểm tra PRICE."""
        out = []
        for ent in entities:
            w = ent["text"].split()
            t = ent["type"]
            if not w:
                continue

            # Entity PRICE phải là số (có thể kèm đơn vị tiền)
            if t == "PRICE" and not PRICE_TEXT_RE.match(ent["text"].strip()):
                continue

            # Cắt từ nhiễu ở đầu entity
            head_cut = 0
            for i, x in enumerate(w):
                if x.lower().strip("!?.,") in ENTITY_HEAD_STOPS:
                    head_cut = i + 1
                else:
                    break
            w = w[head_cut:]

            # Cắt đuôi không thuộc sản phẩm (số, đơn vị tiền, từ chỉ lượng)
            for i in range(len(w) - 1, -1, -1):
                x = w[i]
                if t in ("CATEGORY", "BRAND") and x.isdigit():
                    w = w[:i]
                elif x in ("inch", "triệu", "nghìn", "đ", "₫", "giá", "bộ",
                           "cái", "chiếc"):
                    w = w[:i]
                else:
                    break

            if not w:
                continue
            if all(x.lower().strip("!?.,") in ENTITY_HEAD_STOPS for x in w):
                continue
            if ent["conf"] < NER_WEAK_MIN:
                continue

            out.append({"text": " ".join(w), "type": t, "conf": ent["conf"]})
        return out

    @staticmethod
    def expand_brand_model(entities: List[Dict], text: str) -> List[Dict]:
        """
        Fallback: mở rộng entity BRAND/CATEGORY đơn word bằng từ khóa
        dòng sản phẩm liền sau (VD: "MacBook" -> "MacBook Air M3").
        """
        for ent in list(entities):
            if ent["type"] in ("BRAND", "CATEGORY") and len(ent["text"].split()) == 1:
                pos = text.find(ent["text"])
                if pos < 0:
                    continue
                end = pos + len(ent["text"])
                rest = text[end:].strip().split()
                added = []
                for wtoken in rest:
                    if wtoken.lower().strip("!?.,") in MODEL_LINE_PARTS:
                        added.append(wtoken)
                    else:
                        break
                if added:
                    ent["text"] = ent["text"] + " " + " ".join(added)
        return entities

    @staticmethod
    def fallback_price(entities: List[Dict], text: str) -> List[Dict]:
        """
        Fallback PRICE: mở rộng PRICE model bằng regex, hoặc thêm PRICE mới
        nếu model bỏ sót hoàn toàn.
        """
        price_ents = [e for e in entities if e["type"] == "PRICE"]

        if price_ents:
            # Mở rộng PRICE model bằng đơn vị tiền theo regex
            for e in list(price_ents):
                pos = text.find(e["text"])
                if pos >= 0:
                    m = PRICE_RE.match(text[pos:])
                    if m and len(m.group(0)) > len(e["text"]):
                        e["text"] = m.group(0).strip()
        else:
            # Model không bắt được PRICE -> regex fallback
            m = PRICE_RE.search(text)
            if m:
                entities.append({
                    "text": m.group(0).strip(),
                    "type": "PRICE",
                    "conf": 0.9
                })

        return entities

    @staticmethod
    def merge_adjacent(entities: List[Dict], text: str) -> List[Dict]:
        """
        Gộp entity liền nhau khi model tách rời (VD: "Samsung" + "Galaxy S24 Ultra"
        -> "Samsung Galaxy S24 Ultra"). Hấp thu từ bị model bỏ sót nằm giữa.
        """
        entities.sort(key=lambda e: text.find(e["text"]))
        merged: List[Dict] = []

        for ent in entities:
            if merged:
                prev = merged[-1]
                prev_pos = text.find(prev["text"])
                end_prev = prev_pos + len(prev["text"]) + 1
                cur_pos = text.find(ent["text"])
                gap = cur_pos - end_prev
                mid = text[end_prev:cur_pos] if gap > 0 else ""
                mid_ok = (len(mid) <= 12 and mid.strip()
                          and re.fullmatch(r"[\w\s]+", mid))

                # Gộp khi 2 entity kề nhau và thuộc nhóm có thể gộp
                if gap <= 2 and prev["type"] in ("BRAND", "CATEGORY") \
                        and ent["type"] in ("BRAND", "PRODUCT_LINE", "SPEC"):
                    if mid and prev["type"] == "BRAND":
                        ent["text"] = mid.strip() + " " + ent["text"]
                    prev["text"] = prev["text"] + " " + ent["text"]
                    continue

                # Gộp khi khoảng hở ngắn chứa từ model bỏ sót
                if gap <= 5 and mid_ok and prev["type"] == "BRAND" \
                        and ent["type"] in ("BRAND", "PRODUCT_LINE", "SPEC"):
                    ent["text"] = mid.strip() + " " + ent["text"]
                    prev["text"] = prev["text"] + " " + ent["text"]
                    continue

            merged.append(ent)
        return merged

    @staticmethod
    def brand_keyword_fallback(entities: List[Dict], words: List[str]) -> List[Dict]:
        """Fallback BRAND: thêm brand từ danh sách keyword nếu model bỏ sót."""
        found_text = " ".join(e["text"] for e in entities).lower()
        for word in words:
            wl = word.lower().strip("!?.,")
            if wl in BRAND_WORDS and word not in found_text:
                if not any(word in e["text"] for e in entities):
                    entities.append({"text": word, "type": "BRAND", "conf": 1.0})
        return entities


# ============================================================
# 5. PHOBERT TRANSFORMER NLU ENGINE MAIN CLASS
# ============================================================

class PhoBERTElectronicsNLU:
    """
    PhoBERT NLU Engine kết hợp Intent Classification + NER.
    Pipeline 3 tầng:
      1. Rule Engine (regex/heuristic) — chạy trước, nhanh.
      2. PhoBERT Intent Model — chỉ chạy khi rule không khớp.
      3. PhoBERT NER Model — trích xuất thực thể cấp token với hậu xử lý nâng cao.
    Model được lazy-load và cache để tiết kiệm bộ nhớ.
    """

    def __init__(self, intent_model_dir: str = INTENT_MODEL_DIR,
                 ner_model_dir: str = NER_MODEL_DIR):
        self.intent_model_dir = intent_model_dir
        self.ner_model_dir = ner_model_dir
        self.fallback_engine = RuleBasedNLUEngine()
        self.ner_processor = NERPostProcessor()

        # Intent model (lazy load)
        self._intent_tokenizer = None
        self._intent_model = None
        self._intent_loaded = False

        # NER model (lazy load)
        self._ner_tokenizer = None
        self._ner_model = None
        self._ner_loaded = False

        # Thử nạp model ngay khi khởi tạo
        self._load_intent_model()
        self._load_ner_model()

    # ----------------------------------------------------------
    # Model Loading
    # ----------------------------------------------------------

    def _load_intent_model(self):
        """Nạp PhoBERT Intent Classification model từ checkpoint."""
        config_path = os.path.join(self.intent_model_dir, "config.json")
        if not os.path.exists(config_path):
            print(f"[PhoBERT NLU] Chưa thấy intent model tại {self.intent_model_dir}. Dùng Rule Engine.")
            return

        try:
            print(f"[PhoBERT NLU] Đang nạp intent model từ: {self.intent_model_dir}")
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            # use_fast=False cho PhoBERT compatibility
            self._intent_tokenizer = AutoTokenizer.from_pretrained(
                self.intent_model_dir, use_fast=False
            )
            self._intent_model = AutoModelForSequenceClassification.from_pretrained(
                self.intent_model_dir
            )
            self._intent_model.eval()
            self._intent_loaded = True
            print("[PhoBERT NLU] Nạp intent model thành công!")
        except Exception as e:
            print(f"[PhoBERT NLU Warning] Không thể nạp intent model: {e}. Dùng Rule Engine.")

    def _load_ner_model(self):
        """Nạp PhoBERT NER Token Classification model từ checkpoint."""
        config_path = os.path.join(self.ner_model_dir, "config.json")
        if not os.path.exists(config_path):
            print(f"[PhoBERT NLU] Chưa thấy NER model tại {self.ner_model_dir}. Dùng Rule NER.")
            return

        try:
            print(f"[PhoBERT NLU] Đang nạp NER model từ: {self.ner_model_dir}")
            from transformers import AutoTokenizer, AutoModelForTokenClassification
            self._ner_tokenizer = AutoTokenizer.from_pretrained(
                self.ner_model_dir, local_files_only=True
            )
            self._ner_model = AutoModelForTokenClassification.from_pretrained(
                self.ner_model_dir, local_files_only=True
            )
            self._ner_model.eval()
            self._ner_loaded = True
            print("[PhoBERT NLU] Nạp NER model thành công!")
        except Exception as e:
            print(f"[PhoBERT NLU Warning] Không thể nạp NER model: {e}. Dùng Rule NER.")

    # ----------------------------------------------------------
    # Intent Detection (3 tầng)
    # ----------------------------------------------------------

    def _detect_intent(self, text: str, norm_text: str) -> Tuple[IntentType, float, Dict[str, float]]:
        """
        Intent detection 3 tầng:
          1. Rule Engine — nếu khớp, trả ngay.
          2. PhoBERT Model — nếu rule không khớp và model có sẵn.
          3. Fallback GENERAL_QUERY.

        Returns: (intent, confidence, intent_scores)
        """
        # Tier 1: Rule Engine
        rule_intent, rule_conf = self.fallback_engine.detect_intent(norm_text)

        # Nếu rule khớp với confidence cao (>= 0.85), dùng luôn
        if rule_conf >= 0.85:
            scores = {rule_intent.value: rule_conf}
            return rule_intent, rule_conf, scores

        # Tier 2: PhoBERT Intent Model
        if self._intent_loaded and self._intent_model and self._intent_tokenizer:
            try:
                inputs = self._intent_tokenizer(
                    norm_text, return_tensors="pt", truncation=True, max_length=128
                )
                with torch.no_grad():
                    logits = self._intent_model(**inputs).logits[0]
                probs = torch.softmax(logits, dim=0).numpy()

                # Sắp xếp giảm dần theo xác suất
                order = (-probs).argsort()
                intents_list = list(IntentType)

                best_idx = int(order[0])
                best_intent = intents_list[best_idx] if best_idx < len(intents_list) else rule_intent
                best_conf = float(probs[best_idx])

                # Intent scores đầy đủ
                intent_scores = {}
                for i in range(min(len(intents_list), len(probs))):
                    intent_scores[intents_list[i].value] = round(float(probs[i]), 4)

                # Nếu rule cũng khớp (nhưng conf thấp), so sánh và chọn tốt hơn
                if rule_conf >= 0.70 and rule_conf > best_conf:
                    return rule_intent, rule_conf, intent_scores

                return best_intent, round(best_conf, 4), intent_scores

            except Exception as e:
                print(f"[PhoBERT NLU Error] Intent inference lỗi: {e}. Dùng Rule Engine.")

        # Tier 3: Fallback
        scores = {rule_intent.value: rule_conf}
        return rule_intent, rule_conf, scores

    # ----------------------------------------------------------
    # NER Extraction (3 tầng)
    # ----------------------------------------------------------

    def _extract_entities_ner(self, text: str) -> List[ExtractedEntity]:
        """
        NER extraction 3 tầng:
          1. PhoBERT Token Model + hậu xử lý nâng cao (nếu model có sẵn).
          2. Rule/Regex fallback (BRAND dictionary + SPEC/PRICE regex).
          3. Gộp kết quả 2 tầng.

        Returns: List[ExtractedEntity]
        """
        # Tier 1: PhoBERT NER Model
        if self._ner_loaded and self._ner_model and self._ner_tokenizer:
            try:
                words, labels, confs = self.ner_processor.predict_raw(
                    text, self._ner_model, self._ner_tokenizer
                )
                raw_entities = self.ner_processor.extract_entities(words, labels, confs)
                cleaned = self.ner_processor.clean(raw_entities)

                # Fallback brand keyword
                cleaned = self.ner_processor.brand_keyword_fallback(cleaned, words)

                # Mở rộng BRAND -> MODEL
                cleaned = self.ner_processor.expand_brand_model(cleaned, text)

                # Fallback PRICE regex
                cleaned = self.ner_processor.fallback_price(cleaned, text)

                # Gộp entity liền nhau
                cleaned = self.ner_processor.merge_adjacent(cleaned, text)

                # Chuyển đổi sang ExtractedEntity
                return self._to_extracted_entities(cleaned, text)

            except Exception as e:
                print(f"[PhoBERT NLU Error] NER inference lỗi: {e}. Dùng Rule NER.")

        # Tier 2: Rule/Regex NER fallback
        return self.fallback_engine.extract_entities(text)

    def _to_extracted_entities(self, ner_results: List[Dict], text: str) -> List[ExtractedEntity]:
        """Chuyển đổi kết quả NER dict sang ExtractedEntity schema."""
        entities: List[ExtractedEntity] = []
        for ent in ner_results:
            ent_text = ent["text"]
            # Tìm vị trí trong câu gốc
            pos = text.find(ent_text)
            start_char = pos if pos >= 0 else 0
            end_char = start_char + len(ent_text)

            # Map NER type sang EntityType
            type_mapping = {
                "BRAND": EntityType.BRAND,
                "PRODUCT_NAME": EntityType.PRODUCT_NAME,
                "PRODUCT_LINE": EntityType.MODEL,
                "CATEGORY": EntityType.CATEGORY,
                "PRICE": EntityType.PRICE,
                "SPEC": EntityType.SPEC,
                "MODEL": EntityType.MODEL,
            }
            entity_type = type_mapping.get(ent["type"], EntityType.PRODUCT_NAME)

            # Làm sạch từ rác ở đầu
            clean_text = ent_text
            for head_stop in ENTITY_HEAD_STOPS:
                if clean_text.lower().startswith(head_stop + " "):
                    clean_text = clean_text[len(head_stop) + 1:].strip()

            if clean_text:
                entities.append(ExtractedEntity(
                    text=clean_text,
                    entity_type=entity_type,
                    start_char=start_char,
                    end_char=start_char + len(clean_text),
                    confidence=ent.get("conf", 1.0)
                ))

        return entities

    # ----------------------------------------------------------
    # Main Parse Pipeline
    # ----------------------------------------------------------

    def parse(self, text: str) -> NLUResult:
        """
        Pipeline phân tích NLU hoàn chỉnh:
          1. Tiền xử lý & chuẩn hóa câu tiếng Việt.
          2. Intent detection 3 tầng (Rule -> PhoBERT -> Fallback).
          3. NER extraction 3 tầng (PhoBERT Token Model -> Rule/Regex -> Gộp).
          4. Đóng gói NLUResult.

        Args:
            text: Truy vấn gốc từ người dùng.

        Returns:
            NLUResult với intent, confidence, entities, intent_scores.
        """
        # Step 1: Tiền xử lý
        norm_text = normalize_intent(text)

        # Step 2: Intent detection 3 tầng
        intent, conf, intent_scores = self._detect_intent(text, norm_text)

        # Step 3: NER extraction 3 tầng
        entities = self._extract_entities_ner(text)

        # Step 4: Đóng gói kết quả
        return NLUResult(
            original_query=text,
            intent=intent,
            confidence=conf,
            entities=entities,
            intent_scores=intent_scores
        )
