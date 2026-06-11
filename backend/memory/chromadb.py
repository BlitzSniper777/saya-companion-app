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

try:
    from sentence_transformers import SentenceTransformer as _SentenceTransformer
    _ST_AVAILABLE = True
except ImportError:
    _ST_AVAILABLE = False
    _SentenceTransformer = None

from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

from config import settings

_client = None
_embedder = None


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


def get_embedder():
    if not _ST_AVAILABLE:
        raise RuntimeError("sentence_transformers not installed")
    global _embedder
    if _embedder is None:
        _embedder = _SentenceTransformer('all-MiniLM-L6-v2')
    return _embedder


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


async def store_conversation_turn(user_id: str, user_message: str, assistant_response: str):
    """Store a conversation turn in the appropriate memory layers."""
    collection = get_collection(user_id)
    embedder = get_embedder()
    
    timestamp = datetime.now(timezone.utc).isoformat()
    turn_id = str(uuid.uuid4())
    
    # Prepare content for embedding
    combined_content = f"User: {user_message}\n{assistant_response}"
    embedding = embedder.encode(combined_content).tolist()
    
    # Determine layers for this turn (simplified - in practice would use classification)
    # For now, store in all layers with metadata
    layers_to_store = [1, 2, 3, 4]
    
    for layer in layers_to_store:
        layer_id = f"{turn_id}_layer{layer}"
        collection.add(
            ids=[layer_id],
            embeddings=[embedding],
            documents=[combined_content],
            metadatas=[{
                "user_id": user_id,
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
    collection = get_collection(user_id)
    embedder = get_embedder()
    
    try:
        query_embedding = embedder.encode(query).tolist()
        
        results = collection.query(
            query_embeddings=[query_embedding],
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
    collection = get_collection(user_id)
    embedder = get_embedder()
    
    content = f"Core identity: {data}"
    embedding = embedder.encode(content).tolist()
    mem_id = f"core_{uuid.uuid4()}"
    
    collection.add(
        ids=[mem_id],
        embeddings=[embedding],
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
    collection = get_collection(user_id)
    embedder = get_embedder()
    
    content = f"Relationship with {person_name}: {details}"
    embedding = embedder.encode(content).tolist()
    mem_id = f"rel_{uuid.uuid4()}"
    
    collection.add(
        ids=[mem_id],
        embeddings=[embedding],
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
    collection = get_collection(user_id)
    embedder = get_embedder()
    
    content = f"Emotional pattern - Trigger: {trigger}, Pattern: {pattern}"
    embedding = embedder.encode(content).tolist()
    mem_id = f"emo_{uuid.uuid4()}"
    
    collection.add(
        ids=[mem_id],
        embeddings=[embedding],
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
    collection = get_collection(user_id)
    embedder = get_embedder()
    
    content = f"Companion calibration: {calibration}"
    embedding = embedder.encode(content).tolist()
    mem_id = f"cal_{uuid.uuid4()}"
    
    collection.add(
        ids=[mem_id],
        embeddings=[embedding],
        documents=[content],
        metadatas=[{
            "user_id": user_id,
            "layer": 4,
            "layer_name": "companion_calibration",
            **calibration,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    )