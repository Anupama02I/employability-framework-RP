import os
import time
from pathlib import Path
from typing import Any, Dict, List

import chromadb
import requests
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


CLOUDFLARE_ACCOUNT_ID = os.getenv(
    "CLOUDFLARE_ACCOUNT_ID"
)

CLOUDFLARE_API_TOKEN = os.getenv(
    "CLOUDFLARE_API_TOKEN"
)


if not CLOUDFLARE_ACCOUNT_ID:
    raise RuntimeError(
        "CLOUDFLARE_ACCOUNT_ID is missing from .env"
    )


if not CLOUDFLARE_API_TOKEN:
    raise RuntimeError(
        "CLOUDFLARE_API_TOKEN is missing from .env"
    )


# ============================================================
# CONFIGURATION
# ============================================================

EMBEDDING_MODEL = "@cf/baai/bge-m3"

COLLECTION_NAME = "employability_kb_v1"

DEFAULT_TOP_K = 5

MAX_RETRIES = 4
RETRY_WAIT_SECONDS = 5


# ============================================================
# PATHS
#
# rag_service.py:
# backend/app/services/rag_service.py
#
# parents[2]:
# backend/
# ============================================================

BACKEND_DIR = (
    Path(__file__)
    .resolve()
    .parents[2]
)


VECTOR_STORE_DIR = (
    BACKEND_DIR
    / "knowledge_base"
    / "vector_store"
    / "chroma"
)


# ============================================================
# CLOUDFLARE ENDPOINT
# ============================================================

CLOUDFLARE_URL = (
    "https://api.cloudflare.com/client/v4/"
    f"accounts/{CLOUDFLARE_ACCOUNT_ID}/"
    f"ai/run/{EMBEDDING_MODEL}"
)


# ============================================================
# LOAD CHROMA ONCE
#
# Important:
# We do not reopen the database for every user message.
# ============================================================

_chroma_client = chromadb.PersistentClient(
    path=str(
        VECTOR_STORE_DIR
    )
)


_collection = _chroma_client.get_collection(
    name=COLLECTION_NAME
)


print(
    f"RAG collection loaded: "
    f"{COLLECTION_NAME} "
    f"({_collection.count()} chunks)"
)


# ============================================================
# QUERY EMBEDDING
# ============================================================

def embed_query(
    query: str
) -> List[float]:

    """
    Generate one BGE-M3 embedding for a user query
    using Cloudflare Workers AI.
    """

    query = query.strip()


    if not query:
        raise ValueError(
            "Query cannot be empty."
        )


    for attempt in range(
        1,
        MAX_RETRIES + 1
    ):

        try:

            response = requests.post(

                CLOUDFLARE_URL,

                headers={
                    "Authorization":
                        f"Bearer "
                        f"{CLOUDFLARE_API_TOKEN}",

                    "Content-Type":
                        "application/json",
                },

                json={
                    "text": [
                        query
                    ]
                },

                timeout=60,
            )


            # ------------------------------------------------
            # SUCCESS
            # ------------------------------------------------

            if response.ok:

                data = response.json()


                if not data.get(
                    "success"
                ):

                    raise RuntimeError(
                        "Cloudflare returned "
                        "success=false."
                    )


                embeddings = (
                    data
                    .get(
                        "result",
                        {}
                    )
                    .get(
                        "data"
                    )
                )


                if (
                    not embeddings
                    or
                    not isinstance(
                        embeddings,
                        list
                    )
                ):

                    raise RuntimeError(
                        "No embedding data "
                        "returned by Cloudflare."
                    )


                embedding = embeddings[0]


                if len(
                    embedding
                ) != 1024:

                    raise RuntimeError(
                        "Unexpected BGE-M3 "
                        "embedding dimension: "
                        f"{len(embedding)}"
                    )


                return embedding


            # ------------------------------------------------
            # TEMPORARY SERVICE ERRORS
            # ------------------------------------------------

            if (
                response.status_code
                in [
                    429,
                    500,
                    502,
                    503,
                    504,
                ]
                and
                attempt < MAX_RETRIES
            ):

                time.sleep(
                    RETRY_WAIT_SECONDS
                    *
                    attempt
                )

                continue


            raise RuntimeError(
                "Cloudflare embedding request failed.\n"
                f"HTTP: {response.status_code}\n"
                f"Response: {response.text}"
            )


        except requests.RequestException as error:

            if attempt < MAX_RETRIES:

                time.sleep(
                    RETRY_WAIT_SECONDS
                    *
                    attempt
                )

                continue


            raise RuntimeError(
                "Cloudflare connection failed."
            ) from error


    raise RuntimeError(
        "Embedding request failed "
        "after all retries."
    )


# ============================================================
# RETRIEVE
# ============================================================

def retrieve_context(
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> List[Dict[str, Any]]:

    """
    Retrieve Top-K evidence chunks from Corpus V1.

    No translation or query normalization is performed.
    The original English/Sinhala/Tamil/Singlish/Tanglish
    query is embedded directly using BGE-M3.
    """

    query = query.strip()


    if not query:

        return []


    query_embedding = embed_query(
        query
    )


    results = _collection.query(

        query_embeddings=[
            query_embedding
        ],

        n_results=
            top_k,

        include=[
            "documents",
            "metadatas",
            "distances",
        ],
    )


    ids = (
        results.get(
            "ids",
            [[]]
        )[0]
    )


    documents = (
        results.get(
            "documents",
            [[]]
        )[0]
    )


    metadatas = (
        results.get(
            "metadatas",
            [[]]
        )[0]
    )


    distances = (
        results.get(
            "distances",
            [[]]
        )[0]
    )


    retrieved = []


    for rank, (
        chunk_id,
        document,
        metadata,
        distance,
    ) in enumerate(

        zip(
            ids,
            documents,
            metadatas,
            distances,
        ),

        start=1
    ):

        metadata = metadata or {}


        retrieved.append(
            {
                "rank":
                    rank,

                "chunk_id":
                    chunk_id,

                "text":
                    document,

                "distance":
                    float(
                        distance
                    ),

                "corpus_id":
                    metadata.get(
                        "corpus_id",
                        ""
                    ),

                "source_id":
                    metadata.get(
                        "source_id",
                        ""
                    ),

                "title":
                    metadata.get(
                        "title",
                        ""
                    ),

                "source":
                    metadata.get(
                        "source",
                        ""
                    ),

                "knowledge_domain":
                    metadata.get(
                        "knowledge_domain",
                        ""
                    ),

                "source_url":
                    metadata.get(
                        "source_url",
                        ""
                    ),

                "freshness_or_validity":
                    metadata.get(
                        "freshness_or_validity",
                        ""
                    ),

                "page_number":
                    metadata.get(
                        "page_number",
                        -1
                    ),

                "occupation_name":
                    metadata.get(
                        "occupation_name",
                        ""
                    ),

                "esco_code":
                    metadata.get(
                        "esco_code",
                        ""
                    ),

                "isco_group":
                    metadata.get(
                        "isco_group",
                        ""
                    ),
            }
        )


    return retrieved


# ============================================================
# FORMAT CONTEXT FOR QWEN
# ============================================================

def format_context_for_llm(
    retrieved_chunks: List[
        Dict[str, Any]
    ]
) -> str:

    """
    Convert retrieved evidence into a clear context block
    for the LLM.

    The LLM should receive:
    - source identity
    - validity/date information
    - page when available
    - retrieved evidence text
    """

    if not retrieved_chunks:

        return (
            "No external knowledge-base evidence "
            "was retrieved for this question."
        )


    sections = []


    for item in retrieved_chunks:

        source_parts = []


        title = (
            item.get(
                "title"
            )
            or
            "Untitled source"
        )


        source = (
            item.get(
                "source"
            )
            or
            "Unknown source"
        )


        source_parts.append(
            f"Source: {source}"
        )


        source_parts.append(
            f"Title: {title}"
        )


        page_number = (
            item.get(
                "page_number"
            )
        )


        if (
            page_number is not None
            and
            page_number != -1
        ):

            source_parts.append(
                f"Page: {page_number}"
            )


        validity = (
            item.get(
                "freshness_or_validity"
            )
            or ""
        ).strip()


        if validity:

            source_parts.append(
                f"Validity / reporting period: "
                f"{validity}"
            )


        occupation_name = (
            item.get(
                "occupation_name"
            )
            or ""
        ).strip()


        if occupation_name:

            source_parts.append(
                f"Occupation: "
                f"{occupation_name}"
            )


        source_url = (
            item.get(
                "source_url"
            )
            or ""
        ).strip()


        if source_url:

            source_parts.append(
                f"Source URL: {source_url}"
            )


        evidence = (
            item.get(
                "text"
            )
            or ""
        ).strip()


        block = (
            f"[Retrieved evidence "
            f"{item['rank']}]\n"
            +
            "\n".join(
                source_parts
            )
            +
            "\nEvidence:\n"
            +
            evidence
        )


        sections.append(
            block
        )


    return (
        "\n\n"
        "----------------------------------------\n\n"
    ).join(
        sections
    )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================

def get_rag_context(
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> Dict[str, Any]:

    """
    Convenience wrapper used later by chat_service.py.
    """

    retrieved_chunks = retrieve_context(
        query=query,
        top_k=top_k,
    )


    formatted_context = (
        format_context_for_llm(
            retrieved_chunks
        )
    )


    return {
        "query":
            query,

        "retrieved_count":
            len(
                retrieved_chunks
            ),

        "chunks":
            retrieved_chunks,

        "formatted_context":
            formatted_context,
    }