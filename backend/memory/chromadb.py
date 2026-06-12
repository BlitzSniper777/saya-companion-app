try:
    import chromadb as _chromadb
    try:
        from chromadb.config import Settings as _ChromaSettings
        _CHROMA_SETTINGS = _ChromaSettings(anonymized_telemetry=False)
    except ImportError:
        _CHROMA_SETTINGS = None
    _CHROMA_AVAILABLE = True
except ImportError:
    _CHROMA_AVAILABLE = False
    _chromadb = None
    _CHROMA_SETTINGS = None

from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

from config import settings

_client = None


def get_chroma_client():
    if not _CHROMA_AVAILABLE:
        raise RuntimeError("chromadb not installed")
    global _client
    if _client is None:
        kwargs = {"path": settings.CHROMA_PATH}
        if _CHROMA_SETTINGS is not None:
            kwargs["settings"] = _CHROMA_SETTINGS
        _client = _chromadb.PersistentClient(**kwargs)
    return _client


def get_collection(user_id: str):
    """Get or create user's isolated ChromaDB collection."""
    client = get_chroma_client()
    collection_name = f"user_{user_id.replace('-', '_')}"
    return client.get_or_create_collection(name=collection_name)


def get_layer_name(layer: int) -> str:
    """Map layer number to name."""
    return {
        1: "core_identity",
        2: "relationships",
        3: "emotional_patterns",
        4: "companion_calibration"
    }.get(layer, "unknown")


async def store_conversation_turn(user_id: str, user_message: str, assistant_response: str, companion_id: str = ""):
    """Store a conversation turn in the appropriate memory layers."""
    if not _CHROMA_AVAILABLE:
        return
    collection = get_collection(user_id)

    timestamp = datetime.now(timezone.utc).isoformat()
    turn_id = str(uuid.uuid4())
    combined_content = f"User: {user_message}\n{assistant_response}"

    layers_to_store = [1, 2, 3, 4]
    for layer in layers_to_store:
        layer_id = f"{turn_id}_layer{layer}"
        collection.add(
            ids=[layer_id],
            documents=[combined_content],
            metadatas=[{
                "user_id": user_id,
                "companion_id": companion_id,
                "layer": layer,
                "layer_name": get_layer_name(layer),
                "user_message": user_message,
                "assistant_response": assistant_response,
                "timestamp": timestamp,
                "turn_id": turn_id
            }]
        )


async def get_user_memories(user_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Retrieve top relevant memories across all layers for a user."""
    if not _CHROMA_AVAILABLE:
        return []
    collection = get_collection(user_id)

    try:
        results = collection.query(
            query_texts=[query],
            n_results=limit,
            include=["documents", "metadatas", "distances"]
        )

        memories = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                memories.append({
                    "id": doc_id,
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i]
                })
        return memories
    except Exception:
        return []


async def store_core_identity(user_id: str, data: Dict[str, Any]):
    """Store core identity facts (Layer 1)."""
    if not _CHROMA_AVAILABLE:
        return
    collection = get_collection(user_id)
    content = f"Core identity: {data}"
    mem_id = f"core_{uuid.uuid4()}"
    collection.add(
        ids=[mem_id],
        documents=[content],
        metadatas=[{
            "user_id": user_id,
            "layer": 1,
            "layer_name": "core_identity",
            **data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    )


async def store_relationship(user_id: str, person_name: str, details: Dict[str, Any]):
    """Store relationship information (Layer 2)."""
    if not _CHROMA_AVAILABLE:
        return
    collection = get_collection(user_id)
    content = f"Relationship with {person_name}: {details}"
    mem_id = f"rel_{uuid.uuid4()}"
    collection.add(
        ids=[mem_id],
        documents=[content],
        metadatas=[{
            "user_id": user_id,
            "layer": 2,
            "layer_name": "relationships",
            "person_name": person_name,
            **details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    )


async def store_emotional_pattern(user_id: str, trigger: str, pattern: Dict[str, Any]):
    """Store emotional pattern (Layer 3)."""
    if not _CHROMA_AVAILABLE:
        return
    collection = get_collection(user_id)
    content = f"Emotional pattern - Trigger: {trigger}, Pattern: {pattern}"
    mem_id = f"emo_{uuid.uuid4()}"
    collection.add(
        ids=[mem_id],
        documents=[content],
        metadatas=[{
            "user_id": user_id,
            "layer": 3,
            "layer_name": "emotional_patterns",
            "trigger": trigger,
            **pattern,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    )


async def store_companion_calibration(user_id: str, calibration: Dict[str, Any]):
    """Store companion calibration (Layer 4)."""
    if not _CHROMA_AVAILABLE:
        return
    collection = get_collection(user_id)
    content = f"Companion calibration: {calibration}"
    mem_id = f"cal_{uuid.uuid4()}"
    collection.add(
        ids=[mem_id],
        documents=[content],
        metadatas=[{
            "user_id": user_id,
            "layer": 4,
            "layer_name": "companion_calibration",
            **calibration,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    )
