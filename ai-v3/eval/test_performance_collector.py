"""Tests for PerformanceCollector."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import numpy as np
from eval.performance_collector import PerformanceCollector


def test_record_single_measurement():
    """Test recording a single performance measurement."""
    collector = PerformanceCollector()
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)

    assert len(collector.latencies) == 1
    assert collector.latencies[0] == 100.0
    assert collector.input_tokens[0] == 500
    assert collector.output_tokens[0] == 100


def test_record_multiple_measurements():
    """Test recording multiple measurements."""
    collector = PerformanceCollector()
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=200.0, input_tokens=600, output_tokens=150)
    collector.record(latency_ms=150.0, input_tokens=550, output_tokens=120)

    assert len(collector.latencies) == 3
    assert len(collector.input_tokens) == 3
    assert len(collector.output_tokens) == 3


def test_summary_statistics():
    """Test summary returns correct statistics."""
    collector = PerformanceCollector()
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=200.0, input_tokens=600, output_tokens=150)
    collector.record(latency_ms=300.0, input_tokens=700, output_tokens=200)

    summary = collector.summary()

    assert summary["latency_mean_ms"] == 200.0
    assert summary["latency_p50_ms"] == 200.0
    assert summary["latency_p95_ms"] == pytest.approx(290.0)  # 95th percentile with linear interpolation
    assert summary["avg_input_tokens"] == 600.0
    assert summary["avg_output_tokens"] == 150.0
    assert summary["total_input_tokens"] == 1800
    assert summary["total_output_tokens"] == 450


def test_throughput_calculation():
    """Test throughput is calculated correctly."""
    collector = PerformanceCollector()
    # 3 queries, each 100ms = 300ms total = 10 QPS
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)

    summary = collector.summary()
    assert summary["throughput_qps"] == pytest.approx(10.0)


def test_cost_estimation():
    """Test cost estimation based on Gemini 3.1 Flash Lite pricing."""
    collector = PerformanceCollector()
    # 1000 input tokens = $0.000015
    # 1000 output tokens = $0.00006
    collector.record(latency_ms=100.0, input_tokens=1000, output_tokens=1000)

    summary = collector.summary()
    expected_cost = 0.000015 + 0.00006  # $0.000075
    assert summary["estimated_cost_usd"] == pytest.approx(expected_cost)


def test_empty_collector():
    """Test summary with no measurements."""
    collector = PerformanceCollector()
    summary = collector.summary()

    assert summary["latency_mean_ms"] == 0.0
    assert summary["throughput_qps"] == 0.0
    assert summary["estimated_cost_usd"] == 0.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
