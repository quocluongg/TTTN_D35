import pytest
from nlu.ner_extractor import extract_entities
from config.constants import EntityType


def test_extract_brand():
    entities = extract_entities("Laptop ASUS ROG Strix G16 có RAM bao nhiêu?")
    brands = [e for e in entities if e.entity_type == EntityType.BRAND]
    assert len(brands) > 0
    assert brands[0].text == "ASUS"


def test_extract_spec_attribute():
    entities = extract_entities("Laptop này có RAM bao nhiêu?")
    specs = [e for e in entities if e.entity_type == EntityType.SPEC]
    assert len(specs) > 0
    assert "RAM" in specs[0].text.upper()


def test_extract_multiple_brands():
    entities = extract_entities("So sánh ASUS ROG vs MSI Raider")
    brands = [e for e in entities if e.entity_type == EntityType.BRAND]
    brand_texts = [e.text for e in brands]
    assert "ASUS" in brand_texts
    assert "MSI" in brand_texts


def test_extract_price_range():
    entities = extract_entities("Laptop gaming giá 20-30 triệu")
    prices = [e for e in entities if e.entity_type == EntityType.PRICE]
    assert len(prices) > 0
