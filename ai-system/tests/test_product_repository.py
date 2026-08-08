import pytest
import uuid
import sys
import os

# Thêm ai-system vào sys.path để import các module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import AsyncMock, MagicMock
from db.product_repository import ProductRepository


@pytest.fixture
def mock_session():
    session = AsyncMock()
    return session


@pytest.fixture
def repo(mock_session):
    return ProductRepository(mock_session)


@pytest.mark.asyncio
async def test_get_product_by_id_returns_product(repo, mock_session):
    product_id = str(uuid.uuid4())
    mock_result = MagicMock()
    mock_result.fetchone.return_value = {
        "id": product_id,
        "name": "Test Laptop",
        "slug": "test-laptop",
        "description": "A test laptop",
        "brand": "ASUS",
        "image_url": "http://example.com/img.jpg",
        "rating": 4.8,
        "reviews_count": 20,
        "sold_quantity": 5,
        "use_case": "Gaming",
        "is_active": True,
        "category": "Laptop",
        "price": 25000000,
        "stock_quantity": 10,
        "specifications": {"CPU": "i7", "RAM": "16GB"}
    }
    mock_session.execute.return_value = mock_result

    result = await repo.get_product_by_id(product_id)

    assert result is not None
    assert result["name"] == "Test Laptop"
    assert result["brand"] == "ASUS"
    assert result["category"] == "Laptop"
    assert result["price"] == 25000000.0
    assert result["specifications"] == {"CPU": "i7", "RAM": "16GB"}


@pytest.mark.asyncio
async def test_get_product_by_id_returns_none_when_not_found(repo, mock_session):
    product_id = str(uuid.uuid4())
    mock_result = MagicMock()
    mock_result.fetchone.return_value = None
    mock_session.execute.return_value = mock_result

    result = await repo.get_product_by_id(product_id)

    assert result is None


@pytest.mark.asyncio
async def test_get_product_by_id_normalizes_data_types(repo, mock_session):
    product_id = str(uuid.uuid4())
    mock_result = MagicMock()
    mock_result.fetchone.return_value = {
        "id": product_id,
        "name": "Test Laptop",
        "slug": "test-laptop",
        "description": "A test laptop",
        "brand": "ASUS",
        "image_url": "http://example.com/img.jpg",
        "rating": None,
        "reviews_count": None,
        "sold_quantity": None,
        "use_case": "Gaming",
        "is_active": True,
        "category": "Laptop",
        "price": 25000000,
        "stock_quantity": 10,
        "specifications": '{"CPU": "i7", "RAM": "16GB"}'
    }
    mock_session.execute.return_value = mock_result

    result = await repo.get_product_by_id(product_id)

    assert result is not None
    assert isinstance(result["price"], float)
    assert isinstance(result["rating"], float)
    assert result["rating"] == 4.8
    assert isinstance(result["reviews_count"], int)
    assert result["reviews_count"] == 20
    assert isinstance(result["sold_quantity"], int)
    assert result["sold_quantity"] == 0
    assert isinstance(result["specifications"], dict)
    assert result["specifications"]["CPU"] == "i7"


@pytest.mark.asyncio
async def test_get_product_by_id_handles_empty_specifications(repo, mock_session):
    product_id = str(uuid.uuid4())
    mock_result = MagicMock()
    mock_result.fetchone.return_value = {
        "id": product_id,
        "name": "Test Laptop",
        "slug": "test-laptop",
        "description": "A test laptop",
        "brand": "ASUS",
        "image_url": None,
        "rating": 4.5,
        "reviews_count": 10,
        "sold_quantity": 5,
        "use_case": "Văn phòng",
        "is_active": True,
        "category": "Laptop",
        "price": 15000000,
        "stock_quantity": 20,
        "specifications": None
    }
    mock_session.execute.return_value = mock_result

    result = await repo.get_product_by_id(product_id)

    assert result is not None
    assert result["specifications"] == {}
