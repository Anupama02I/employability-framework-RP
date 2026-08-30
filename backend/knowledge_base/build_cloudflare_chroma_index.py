import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import chromadb
import requests
from dotenv import load_dotenv


# ============================================================
# CONFIG
# ============================================================

load_dotenv()


BASE_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = BASE_DIR / "processed"

CHUNKS_PATH = (
    PROCESSED_DIR
    / "corpus_v1_chunks.jsonl"
)

VECTOR_STORE_DIR = (
    BASE_DIR
    / "vector_store"
    / "chroma"
)

INDEX_METADATA_PATH = (
    PROCESSED_DIR
    / "corpus_v1_vector_index_metadata.json"
)


ACCOUNT_ID = os.getenv(
    "CLOUDFLARE_ACCOUNT_ID"
)

API_TOKEN = os.getenv(
    "CLOUDFLARE_API_TOKEN"
)


MODEL = "@cf/baai/bge-m3"

COLLECTION_NAME = "employability_kb_v1"


# Keep batches conservative for reliability.
BATCH_SIZE = 16

MAX_RETRIES = 4
RETRY_WAIT_SECONDS = 10


# ============================================================
# VALIDATE ENV
# ============================================================

if not ACCOUNT_ID:
    raise RuntimeError(
        "CLOUDFLARE_ACCOUNT_ID missing from .env"
    )


if not API_TOKEN:
    raise RuntimeError(
        "CLOUDFLARE_API_TOKEN missing from .env"
    )


API_URL = (
    "https://api.cloudflare.com/client/v4/"
    f"accounts/{ACCOUNT_ID}/ai/run/{MODEL}"
)


# ============================================================
# HELPERS
# ============================================================

def load_jsonl(path):

    records = []

    with open(
        path,
        "r",
        encoding="utf-8"
    ) as f:

        for line in f:

            line = line.strip()

            if not line:
                continue

            records.append(
                json.loads(line)
            )

    return records


def safe_string(value):

    if value is None:
        return ""

    return str(value)


def build_embedding_text(record):

    title = safe_string(
        record.get(
            "title"
        )
    ).strip()

    text = safe_string(
        record.get(
            "text"
        )
    ).strip()


    if title:

        return (
            f"Title: {title}\n"
            f"{text}"
        )

    return text


def build_metadata(record):

    page_number = (
        record.get(
            "page_number"
        )
    )

    if page_number is None:
        page_number = -1


    return {

        "corpus_id":
            safe_string(
                record.get(
                    "corpus_id"
                )
            ),

        "source_id":
            safe_string(
                record.get(
                    "source_id"
                )
            ),

        "record_type":
            safe_string(
                record.get(
                    "record_type"
                )
            ),

        "source":
            safe_string(
                record.get(
                    "source"
                )
            ),

        "title":
            safe_string(
                record.get(
                    "title"
                )
            ),

        "knowledge_domain":
            safe_string(
                record.get(
                    "knowledge_domain"
                )
            ),

        "source_url":
            safe_string(
                record.get(
                    "source_url"
                )
            ),

        "freshness_or_validity":
            safe_string(
                record.get(
                    "freshness_or_validity"
                )
            ),

        "language":
            safe_string(
                record.get(
                    "language",
                    "en"
                )
            ),

        "page_number":
            int(
                page_number
            ),

        "occupation_name":
            safe_string(
                record.get(
                    "occupation_name"
                )
            ),

        "esco_code":
            safe_string(
                record.get(
                    "esco_code"
                )
            ),

        "isco_group":
            safe_string(
                record.get(
                    "isco_group"
                )
            ),
    }


# ============================================================
# CLOUDFLARE BGE-M3
# ============================================================

def get_embeddings(texts):

    for attempt in range(
        1,
        MAX_RETRIES + 1
    ):

        response = requests.post(

            API_URL,

            headers={

                "Authorization":
                    f"Bearer {API_TOKEN}",

                "Content-Type":
                    "application/json",
            },

            json={
                "text":
                    texts
            },

            timeout=120,
        )


        if response.ok:

            data = response.json()


            if not data.get(
                "success"
            ):

                raise RuntimeError(
                    f"Cloudflare returned "
                    f"success=false: {data}"
                )


            result = data.get(
                "result",
                {}
            )


            embeddings = (
                result.get(
                    "data"
                )
            )


            if not isinstance(
                embeddings,
                list
            ):

                raise RuntimeError(
                    "Could not locate embedding data "
                    "in Cloudflare response."
                )


            if len(
                embeddings
            ) != len(
                texts
            ):

                raise RuntimeError(
                    "Embedding count does not match "
                    "input text count."
                )


            return embeddings


        # ----------------------------------------------------
        # Retry temporary Cloudflare failures
        # ----------------------------------------------------

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

            print()

            print(
                f"Temporary Cloudflare error "
                f"{response.status_code}. "
                f"Retry {attempt}/{MAX_RETRIES}..."
            )

            time.sleep(
                RETRY_WAIT_SECONDS
                *
                attempt
            )

            continue


        raise RuntimeError(
            "Cloudflare embedding request failed.\n"
            f"Status: {response.status_code}\n"
            f"Response: {response.text}"
        )


    raise RuntimeError(
        "Cloudflare embedding request failed "
        "after all retries."
    )


# ============================================================
# LOAD CORPUS
# ============================================================

if not CHUNKS_PATH.exists():

    raise FileNotFoundError(
        f"Missing chunks file: {CHUNKS_PATH}"
    )


chunks = load_jsonl(
    CHUNKS_PATH
)


print()
print(
    "Corpus chunks loaded:",
    len(chunks)
)


# ============================================================
# PREPARE CHROMA
# ============================================================

VECTOR_STORE_DIR.mkdir(
    parents=True,
    exist_ok=True
)


client = chromadb.PersistentClient(

    path=str(
        VECTOR_STORE_DIR
    )
)


# Rebuild clean V1 collection.

try:

    client.delete_collection(
        COLLECTION_NAME
    )

    print(
        "Existing V1 collection removed."
    )

except Exception:

    pass


collection = client.create_collection(

    name=
        COLLECTION_NAME,

    embedding_function=
        None,

    configuration={
        "hnsw": {
            "space": "cosine"
        }
    }
)


# ============================================================
# EMBED + INDEX
# ============================================================

total = len(
    chunks
)


print()
print(
    "Starting Cloudflare BGE-M3 indexing..."
)

print(
    "Total chunks:",
    total
)

print(
    "Batch size:",
    BATCH_SIZE
)


for start in range(
    0,
    total,
    BATCH_SIZE
):

    end = min(
        start + BATCH_SIZE,
        total
    )


    batch = (
        chunks[
            start:end
        ]
    )


    texts_for_embedding = [

        build_embedding_text(
            record
        )

        for record in batch
    ]


    embeddings = (
        get_embeddings(
            texts_for_embedding
        )
    )


    ids = [

        record[
            "chunk_id"
        ]

        for record in batch
    ]


    documents = [

        record.get(
            "text",
            ""
        )

        for record in batch
    ]


    metadatas = [

        build_metadata(
            record
        )

        for record in batch
    ]


    collection.add(

        ids=
            ids,

        embeddings=
            embeddings,

        documents=
            documents,

        metadatas=
            metadatas
    )


    print(
        f"Indexed {end}/{total}",
        end="\r"
    )


print()


# ============================================================
# VALIDATE
# ============================================================

stored_count = (
    collection.count()
)


print()
print(
    "======================================"
)

print(
    "CLOUDFLARE BGE-M3 INDEX COMPLETE"
)

print(
    "======================================"
)

print(
    "Corpus chunks:",
    total
)

print(
    "Stored in Chroma:",
    stored_count
)


if stored_count != total:

    raise RuntimeError(
        "Chroma record count does not "
        "match corpus chunk count."
    )


# ============================================================
# VERIFY DIMENSION
# ============================================================

sample_embedding = (
    get_embeddings(
        [
            "test embedding dimension"
        ]
    )[0]
)


embedding_dimension = (
    len(
        sample_embedding
    )
)


print(
    "Embedding dimension:",
    embedding_dimension
)


# ============================================================
# SAVE INDEX METADATA
# ============================================================

metadata = {

    "corpus_version":
        "1.0",

    "chunk_count":
        total,

    "embedding_provider":
        "Cloudflare Workers AI",

    "embedding_model":
        MODEL,

    "embedding_dimension":
        embedding_dimension,

    "collection_name":
        COLLECTION_NAME,

    "distance_metric":
        "cosine",

    "batch_size":
        BATCH_SIZE,

    "created_at_utc":
        datetime.now(
            timezone.utc
        ).isoformat(),
}


with open(
    INDEX_METADATA_PATH,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        metadata,
        f,
        indent=2,
        ensure_ascii=False
    )


print()
print(
    "Vector database:"
)

print(
    VECTOR_STORE_DIR
)

print()
print(
    "Index metadata:"
)

print(
    INDEX_METADATA_PATH
)