from typing import List
import os

# FIXED: lazy init — LLM is created on first use, NOT at module import.
# If HF_API_TOKEN is missing or Hugging Face is unreachable at startup,
# the old code would crash the entire FastAPI process before even starting.
_llm = None


class _FallbackLLM:
    """Returned when HF_API_TOKEN is missing or connection fails."""
    def invoke(self, prompt: str) -> str:
        return "Insights unavailable — set HF_API_TOKEN in .env to enable AI insights."


def _get_llm():
    global _llm
    if _llm is not None:
        return _llm

    token = os.getenv("HF_API_TOKEN")
    if not token:
        _llm = _FallbackLLM()
        return _llm

    try:
        from langchain_community.llms import HuggingFaceHub
        _llm = HuggingFaceHub(
            repo_id="google/flan-t5-base",
            task="text2text-generation",
            model_kwargs={"temperature": 0.3, "max_length": 256},
            huggingfacehub_api_token=token,
        )
    except Exception:
        _llm = _FallbackLLM()

    return _llm


def _to_list(text: str, count: int) -> List[str]:
    lines = [line.strip(" -•*") for line in text.splitlines() if line.strip()]
    return lines[:count] if lines else []


def _generate(prompt: str, count: int) -> List[str]:
    try:
        response = _get_llm().invoke(prompt)
        result = _to_list(response if isinstance(response, str) else str(response), count)
        return result if result else [str(response).strip()]
    except Exception:
        return []


def generate_product_notes(real_product_data: str) -> List[str]:
    return _generate(
        f"Given these retail product trends and stock levels: {real_product_data}. "
        "Generate 3 short actionable insights for a fashion store manager.",
        3,
    )


def generate_channel_insights(real_channel_breakdown: str) -> List[str]:
    return _generate(
        f"Channel performance this month: {real_channel_breakdown}. "
        "Generate 3 retail channel performance insights.",
        3,
    )


def generate_performance_highlights(real_sales_summary: str) -> List[str]:
    return _generate(
        f"Fashion retail data this month: {real_sales_summary}. "
        "Generate 4 specific performance highlights for the store manager.",
        4,
    )


def generate_recommended_actions(real_reorder_and_trend_data: str) -> List[str]:
    return _generate(
        f"Given these inventory and sales issues: {real_reorder_and_trend_data}. "
        "Suggest 3 specific business actions for a fashion retailer.",
        3,
    )


def generate_inventory_alerts_text(real_low_stock_data: str) -> List[str]:
    return _generate(
        f"Inventory signals: {real_low_stock_data}. "
        "Generate 3 crisp alert messages for store operations.",
        3,
    )


def generate_user_activity_notes(real_user_data: str) -> List[str]:
    return _generate(
        f"User activity data: {real_user_data}. Generate 3 team activity insights.",
        3,
    )


def generate_seasonal_insights(real_seasonal_data: str) -> List[str]:
    return _generate(
        f"Seasonal retail data: {real_seasonal_data}. Generate 3 concise seasonal insights.",
        3,
    )
