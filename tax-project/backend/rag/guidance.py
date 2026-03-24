"""Simple keyword-based tax guidance retrieval.

Uses TF-IDF-style keyword matching against a curated knowledge base.
No external vector DB required — suitable for the ~dozen-entry corpus.
"""

import json
from pathlib import Path
from typing import Optional

from pydantic import BaseModel

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "tax_guidance.json"


class GuidanceEntry(BaseModel):
    id: str
    topic: str
    keywords: list[str]
    content: str


class GuidanceResult(BaseModel):
    topic: str
    content: str
    relevance: float  # 0.0–1.0 score


_entries: Optional[list[GuidanceEntry]] = None


def _load_entries() -> list[GuidanceEntry]:
    global _entries
    if _entries is None:
        with open(DATA_PATH) as f:
            raw = json.load(f)
        _entries = [GuidanceEntry(**e) for e in raw]
    return _entries


def _score(query_tokens: set[str], entry: GuidanceEntry) -> float:
    """Score an entry against query tokens using keyword overlap."""
    entry_tokens = set()
    for kw in entry.keywords:
        entry_tokens.update(kw.lower().split())
    # Also include words from topic
    entry_tokens.update(entry.topic.lower().split())

    if not entry_tokens:
        return 0.0

    matches = query_tokens & entry_tokens
    # Jaccard-like score weighted toward query coverage
    if not query_tokens:
        return 0.0
    return len(matches) / len(query_tokens)


def search(query: str, top_k: int = 3) -> list[GuidanceResult]:
    """Search the tax guidance knowledge base.

    Returns the top_k most relevant entries for the query.
    """
    entries = _load_entries()
    query_tokens = set(query.lower().split())

    # Remove very common stop words
    stop_words = {"what", "is", "the", "a", "an", "how", "do", "does", "i", "my", "can", "for", "to", "of", "and", "in", "on"}
    query_tokens -= stop_words

    if not query_tokens:
        return []

    scored = []
    for entry in entries:
        s = _score(query_tokens, entry)
        if s > 0:
            scored.append(GuidanceResult(topic=entry.topic, content=entry.content, relevance=round(s, 3)))

    scored.sort(key=lambda r: r.relevance, reverse=True)
    return scored[:top_k]
