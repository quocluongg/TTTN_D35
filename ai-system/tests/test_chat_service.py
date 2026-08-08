"""
Unit test cho Chat Service - Orchestrator cua RAG pipeline.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from services.chat_service import ChatService


@pytest.fixture
def mock_dependencies():
    return {
        "nlu_processor": MagicMock(),
        "query_builder": MagicMock(),
        "retriever": MagicMock(),
        "reranker": MagicMock(),
        "prompt_builder": MagicMock(),
        "llm_client": AsyncMock(),
        "validator": MagicMock(),
    }


@pytest.mark.asyncio
async def test_chat_service_returns_response(mock_dependencies):
    """Test full pipeline: NLU -> Retrieval -> Rerank -> Generation -> Validation."""
    service = ChatService(**mock_dependencies)

    mock_dependencies["nlu_processor"].process_query.return_value = MagicMock(
        intent="ask_specs",
        confidence=0.92,
        entities=[],
        is_out_of_scope=False,
    )

    mock_dependencies["retriever"].retrieve.return_value = []
    mock_dependencies["reranker"].rerank_documents.return_value = []
    mock_dependencies["llm_client"].generate_response.return_value = "Test response"
    mock_dependencies["validator"].validate_response.return_value = MagicMock(
        sanitized_response="Test response",
        is_valid=True,
        faithfulness_score=0.95,
        numerical_consistency=True,
        issues=[],
    )

    result = await service.process_chat("Laptop ASUS RAM bao nhiêu?")

    assert result.response == "Test response"
    assert result.nlu_info.intent == "ask_specs"


@pytest.mark.asyncio
async def test_chat_service_handles_out_of_scope(mock_dependencies):
    """Test out-of-scope question returns rejection message."""
    service = ChatService(**mock_dependencies)

    mock_dependencies["nlu_processor"].process_query.return_value = MagicMock(
        intent="out_of_scope",
        confidence=0.3,
        entities=[],
        is_out_of_scope=True,
    )

    result = await service.process_chat("Thời tiết hôm nay thế nào?")

    assert "ngoài phạm vi" in result.response.lower() or "xin lỗi" in result.response.lower()


@pytest.mark.asyncio
async def test_chat_service_out_of_scope_skips_retrieval(mock_dependencies):
    """Test that out-of-scope queries skip retrieval, reranking, and generation."""
    service = ChatService(**mock_dependencies)

    mock_dependencies["nlu_processor"].process_query.return_value = MagicMock(
        intent="out_of_scope",
        confidence=0.1,
        entities=[],
        is_out_of_scope=True,
    )

    result = await service.process_chat("Bóng đá VN hôm nay?")

    # Retrieval and generation should NOT be called
    mock_dependencies["retriever"].retrieve.assert_not_called()
    mock_dependencies["reranker"].rerank_documents.assert_not_called()
    mock_dependencies["llm_client"].generate_response.assert_not_called()
    mock_dependencies["validator"].validate_response.assert_not_called()

    assert result.validation_status["reason"] == "out_of_scope_fast_reply"
    assert result.sources == []


@pytest.mark.asyncio
async def test_chat_service_passes_correct_args_to_retriever(mock_dependencies):
    """Test that build_retrieval_query result is passed to retriever.retrieve."""
    service = ChatService(**mock_dependencies)

    mock_nlu = MagicMock(
        intent="ask_price",
        confidence=0.88,
        entities=[],
        is_out_of_scope=False,
    )
    mock_dependencies["nlu_processor"].process_query.return_value = mock_nlu

    mock_retrieval_query = MagicMock()
    mock_dependencies["query_builder"].build_retrieval_query.return_value = mock_retrieval_query
    mock_dependencies["retriever"].retrieve.return_value = []
    mock_dependencies["reranker"].rerank_documents.return_value = []
    mock_dependencies["llm_client"].generate_response.return_value = "Giá 25 triệu"
    mock_dependencies["validator"].validate_response.return_value = MagicMock(
        sanitized_response="Giá 25 triệu",
        is_valid=True,
        faithfulness_score=0.9,
        numerical_consistency=True,
        issues=[],
    )

    await service.process_chat("Laptop ASUS giá bao nhiêu?")

    # Verify the retrieval query was built from NLU result
    mock_dependencies["query_builder"].build_retrieval_query.assert_called_once_with(mock_nlu)
    # Verify the retrieval query was passed to retrieve
    mock_dependencies["retriever"].retrieve.assert_called_once_with(mock_retrieval_query)


@pytest.mark.asyncio
async def test_chat_service_builds_source_documents(mock_dependencies):
    """Test that reranked docs are converted to SourceDocument objects."""
    service = ChatService(**mock_dependencies)

    mock_dependencies["nlu_processor"].process_query.return_value = MagicMock(
        intent="ask_specs",
        confidence=0.9,
        entities=[],
        is_out_of_scope=False,
    )

    mock_doc = MagicMock()
    mock_doc.id = "doc-1"
    mock_doc.text = "Laptop ASUS RAM 16GB"
    mock_doc.metadata = {"product_name": "ASUS Vivobook"}
    mock_doc.score = 0.95

    mock_dependencies["retriever"].retrieve.return_value = [mock_doc]
    mock_dependencies["reranker"].rerank_documents.return_value = [mock_doc]
    mock_dependencies["llm_client"].generate_response.return_value = "RAM 16GB"
    mock_dependencies["validator"].validate_response.return_value = MagicMock(
        sanitized_response="RAM 16GB",
        is_valid=True,
        faithfulness_score=0.9,
        numerical_consistency=True,
        issues=[],
    )

    result = await service.process_chat("ASUS RAM bao nhiêu?")

    assert len(result.sources) == 1
    assert result.sources[0].id == "doc-1"
    assert result.sources[0].text == "Laptop ASUS RAM 16GB"
    assert result.sources[0].score == 0.95


@pytest.mark.asyncio
async def test_chat_service_validation_status_in_response(mock_dependencies):
    """Test that validation status is correctly mapped to response."""
    service = ChatService(**mock_dependencies)

    mock_dependencies["nlu_processor"].process_query.return_value = MagicMock(
        intent="ask_specs",
        confidence=0.9,
        entities=[],
        is_out_of_scope=False,
    )

    mock_dependencies["retriever"].retrieve.return_value = []
    mock_dependencies["reranker"].rerank_documents.return_value = []
    mock_dependencies["llm_client"].generate_response.return_value = "Test"
    mock_dependencies["validator"].validate_response.return_value = MagicMock(
        sanitized_response="Test",
        is_valid=True,
        faithfulness_score=0.85,
        numerical_consistency=True,
        issues=[],
    )

    result = await service.process_chat("Test query?")

    assert result.validation_status["is_valid"] is True
    assert result.validation_status["faithfulness_score"] == 0.85
    assert result.validation_status["numerical_consistency"] is True
    assert result.validation_status["issues"] == []
