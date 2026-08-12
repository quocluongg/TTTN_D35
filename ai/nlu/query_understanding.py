"""Query understanding: typo correction, abbreviation expansion, accent normalization.

Adapted from itlr for electronics domain. Runs BEFORE NLU to improve matching.
"""
import difflib
import re
from typing import Any, Dict, List, Tuple

# --- Abbreviations (Vietnamese electronics context) ---
ABBREVIATIONS = {
    "dt": "dien thoai",
    "lt": "laptop",
    "mb": "macbook",
    "mba": "macbook air",
    "mbp": "macbook pro",
    "tb": "may tinh bang",
    "pk": "phu kien",
    "ram": "bo nho ram",
    "ssd": "o cung ssd",
    "hdd": "o cung hdd",
    "gpu": "card do hoa",
    "cpu": "bo xu ly",
    "tbw": "terabytes written",
    "nvme": "o cung nvme",
    "ips": "man hinh ips",
    "oled": "man hinh oled",
    "fhd": "full hd 1920x1080",
    "qhd": "quad hd 2560x1440",
    "uhd": "ultra hd 4k",
    "rtx": "card do hoa rtx",
    "gtx": "card do hoa gtx",
    "wifi": "ket noi wifi",
    "bt": "bluetooth",
    "usb": "cong usb",
    "hdmi": "cong hdmi",
    "typec": "cong usb type c",
    "tgdd": "the gioi di dong",
    "fpt": "fpt shop",
    "vnexpress": "bao vnexpress",
}

_AMBIGUOUS_ABBR = {"mb", "tb", "dt"}

# --- Common typos ---
COMMON_TYPOS = {
    "dien thaoi": "dien thoai",
    "dien thoa": "dien thoai",
    "laptpp": "laptop",
    "laptoop": "laptop",
    "lap top": "laptop",
    "macbok": "macbook",
    "mac book": "macbook",
    "macboook": "macbook",
    "samsun": "samsung",
    "samung": "samsung",
    "applle": "apple",
    "asuss": "asus",
    "iphon": "iphone",
    "ipaddd": "ipad",
    "airpod": "airpods",
    "bluetooth": "bluetooth",
    "blutooth": "bluetooth",
    "man hinh": "man hinh",
    "man hinhf": "man hinh",
    "phu kien": "phu kien",
    "phu kjen": "phu kien",
    "bao hanh": "bao hanh",
    "bao hnah": "bao hanh",
    "khuyen mai": "khuyen mai",
    "khueen mai": "khuyen mai",
    "gia re": "gia re",
    "giaẻ": "gia re",
    "gaming": "gaming",
    "gamign": "gaming",
}

# --- Seed vocabulary for fuzzy matching ---
_SEED_VOCAB = {
    "dien thoai", "laptop", "macbook", "may tinh bang", "phu kien",
    "samsung", "apple", "asus", "dell", "lenovo", "hp", "acer", "msi",
    "xiaomi", "oppo", "vivo", "realme", "sony", "jbl",
    "iphone", "ipad", "airpods", "galaxy", "macbook",
    "gaming", "van phong", "do hoa", "mong nhe",
    "ram", "ssd", "hdd", "cpu", "gpu", "man hinh",
    "ban phim", "chuot", "tai nghe", "sac du phong",
    "bao hanh", "doi tra", "khuyen mai", "giam gia",
    "gia re", "tot nhat", "tot", "re", "chat luong",
}


def _normalize_text(text: Any) -> str:
    """Normalize Vietnamese text: NFC + lowercase + remove special chars."""
    import unicodedata

    if not text:
        return ""
    text = unicodedata.normalize("NFC", str(text).lower())
    text = re.sub(r"[^\w\sÀ-ỹ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _strip_accents(text: str) -> str:
    """Remove Vietnamese diacritics for matching."""
    import unicodedata

    if not text:
        return ""
    text = str(text).lower().replace("đ", "d")
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def build_query_vocab(brands: List[str] = None, models: List[str] = None) -> frozenset:
    """Build vocabulary for typo correction from seed vocab + brand/model lists."""
    vocab = set(_SEED_VOCAB)

    for brand in (brands or []):
        for tok in _strip_accents(_normalize_text(brand)).split():
            if len(tok) >= 3 and tok.isalpha():
                vocab.add(tok)

    for model in (models or []):
        for tok in _strip_accents(_normalize_text(model)).split():
            if len(tok) >= 3 and tok.isalpha():
                vocab.add(tok)

    return frozenset(v for v in vocab if len(v) >= 3)


def _correct_token(tok: str, vocab: frozenset) -> Tuple[str, bool]:
    """Correct a single token. Returns (corrected_token, was_corrected)."""
    bare = _strip_accents(tok)

    # Check common typos first
    if bare in COMMON_TYPOS:
        return COMMON_TYPOS[bare], True

    # If token is in vocab, it's fine
    if bare in vocab:
        return tok, False

    # Fuzzy match for tokens >= 4 chars
    if len(bare) >= 4 and bare.isalpha() and tok == bare:
        match = difflib.get_close_matches(bare, vocab, n=1, cutoff=0.84)
        if match and match[0] != bare:
            return match[0], True

    return tok, False


def understand_query(query: str, vocab: frozenset = None) -> Dict[str, Any]:
    """Analyze and normalize user query.

    Returns:
        dict with keys: original, corrected, display, corrections, expansions
    """
    if vocab is None:
        vocab = build_query_vocab()

    query = re.sub(r"(?i)c\+\+", "cpp", str(query))
    query = re.sub(r"(?i)c#", "csharp", query)

    tokens = _normalize_text(query).split()
    corrected_tokens = []
    corrections = []
    expansions = []

    single_token = len(tokens) == 1
    for tok in tokens:
        bare = _strip_accents(tok)

        # Check abbreviations
        if tok == bare and bare in ABBREVIATIONS:
            if bare in _AMBIGUOUS_ABBR and not single_token:
                corrected_tokens.append(tok)
            else:
                expansions.append(ABBREVIATIONS[bare])
                corrected_tokens.append(tok)
            continue

        # Check typos
        fixed, changed = _correct_token(tok, vocab)
        if changed:
            corrections.append((tok, fixed))
        corrected_tokens.append(fixed)

    display = " ".join(corrected_tokens)
    corrected = f"{display} {' '.join(expansions)}" if expansions else display

    return {
        "original": query,
        "corrected": corrected,
        "display": display,
        "corrections": corrections,
        "expansions": expansions,
    }


def intent_note(understanding: Dict[str, Any]) -> str:
    """Generate a user-facing note about query corrections/expansions.

    Returns empty string if no corrections were made.
    """
    corr = understanding.get("corrections") or []
    exps = understanding.get("expansions") or []
    if not corr and not exps:
        return ""

    bits = []
    if corr:
        bits.append("từ sửa: " + ", ".join(f"*{w}* -> **{r}**" for w, r in corr[:3]))
    if exps:
        bits.append("viết tắt: " + ", ".join(f"**{e}**" for e in exps[:3]))

    display = understanding.get("display", "")
    text = display[:1].upper() + display[1:] if display else display

    return (
        f"> Em hiểu anh/chị hỏi về: **{text}**  \n"
        f"> _({' · '.join(bits)})_\n\n"
    )
