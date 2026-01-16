import json
import logging
import os
import re
from functools import lru_cache
from typing import Any, Dict, List, Optional

try:
    from llama_cpp import Llama
except Exception:
    Llama = None

logger = logging.getLogger(__name__)


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _extract_json(text: str) -> Optional[Any]:
    if not text:
        return None
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    return None


@lru_cache(maxsize=1)
def _load_llm() -> Optional["Llama"]:
    if Llama is None:
        return None
    model_path = os.getenv("JOOMIDANG_LLM_MODEL", "").strip()
    if not model_path:
        return None
    n_ctx = _int_env("JOOMIDANG_LLM_N_CTX", 4096)
    n_threads = _int_env("JOOMIDANG_LLM_N_THREADS", 0)
    n_gpu_layers = _int_env("JOOMIDANG_LLM_GPU_LAYERS", -1)
    chat_format = os.getenv("JOOMIDANG_LLM_CHAT_FORMAT", "gemma").strip() or None
    try:
        return Llama(
            model_path=model_path,
            n_ctx=max(256, n_ctx),
            n_threads=n_threads if n_threads > 0 else None,
            n_gpu_layers=n_gpu_layers,
            chat_format=chat_format,
            logits_all=False,
        )
    except Exception as exc:
        logger.warning("Local LLM load failed: %s", exc)
        return None


def warmup() -> bool:
    llm = _load_llm()
    return llm is not None


def generate_chat(messages: List[Dict[str, str]]) -> Optional[str]:
    llm = _load_llm()
    if llm is None:
        return None
    max_tokens = _int_env("JOOMIDANG_LLM_MAX_NEW_TOKENS", 512)
    temperature = _float_env("JOOMIDANG_LLM_TEMPERATURE", 0.2)
    try:
        out = llm.create_chat_completion(
            messages=messages,
            max_tokens=max(1, max_tokens),
            temperature=temperature,
        )
    except Exception:
        return None
    if isinstance(out, dict):
        choices = out.get("choices") or []
        if choices and isinstance(choices[0], dict):
            message = choices[0].get("message", {})
            text = message.get("content", "") or ""
            return text.strip()
    return None


def generate_json(messages: List[Dict[str, str]]) -> Optional[Any]:
    text = generate_chat(messages)
    return _extract_json(text or "")
