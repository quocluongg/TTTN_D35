"""Performance metrics collector for RAGAS benchmark."""
import numpy as np
from typing import List


class PerformanceCollector:
    """Collects and summarizes performance metrics during benchmark execution."""

    # Mimo v2.5 Pro pricing (per 1K tokens, estimated)
    INPUT_COST_PER_1K = 0.000015
    OUTPUT_COST_PER_1K = 0.00006

    def __init__(self):
        self.latencies: List[float] = []
        self.input_tokens: List[int] = []
        self.output_tokens: List[int] = []

    def record(self, latency_ms: float, input_tokens: int, output_tokens: int):
        """Record a single performance measurement."""
        self.latencies.append(latency_ms)
        self.input_tokens.append(input_tokens)
        self.output_tokens.append(output_tokens)

    def summary(self) -> dict:
        """Calculate summary statistics for all recorded measurements."""
        if not self.latencies:
            return {
                "latency_mean_ms": 0.0,
                "latency_p50_ms": 0.0,
                "latency_p95_ms": 0.0,
                "latency_p99_ms": 0.0,
                "throughput_qps": 0.0,
                "avg_input_tokens": 0.0,
                "avg_output_tokens": 0.0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "estimated_cost_usd": 0.0
            }

        return {
            "latency_mean_ms": float(np.mean(self.latencies)),
            "latency_p50_ms": float(np.percentile(self.latencies, 50)),
            "latency_p95_ms": float(np.percentile(self.latencies, 95)),
            "latency_p99_ms": float(np.percentile(self.latencies, 99)),
            "throughput_qps": len(self.latencies) / (sum(self.latencies) / 1000),
            "avg_input_tokens": float(np.mean(self.input_tokens)),
            "avg_output_tokens": float(np.mean(self.output_tokens)),
            "total_input_tokens": sum(self.input_tokens),
            "total_output_tokens": sum(self.output_tokens),
            "estimated_cost_usd": self._calc_cost()
        }

    def _calc_cost(self) -> float:
        """Calculate estimated API cost based on token counts."""
        input_cost = sum(self.input_tokens) / 1000 * self.INPUT_COST_PER_1K
        output_cost = sum(self.output_tokens) / 1000 * self.OUTPUT_COST_PER_1K
        return round(input_cost + output_cost, 6)
