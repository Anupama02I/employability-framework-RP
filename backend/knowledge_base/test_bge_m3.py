import os
import requests

from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


ACCOUNT_ID = os.getenv(
    "CLOUDFLARE_ACCOUNT_ID"
)

API_TOKEN = os.getenv(
    "CLOUDFLARE_API_TOKEN"
)


MODEL = "@cf/baai/bge-m3"


# ============================================================
# VALIDATE CONFIG
# ============================================================

if not ACCOUNT_ID:
    raise RuntimeError(
        "CLOUDFLARE_ACCOUNT_ID is missing from .env"
    )


if not API_TOKEN:
    raise RuntimeError(
        "CLOUDFLARE_API_TOKEN is missing from .env"
    )


# ============================================================
# API ENDPOINT
# ============================================================

url = (
    "https://api.cloudflare.com/client/v4/"
    f"accounts/{ACCOUNT_ID}/ai/run/{MODEL}"
)


# ============================================================
# SMALL MULTILINGUAL TEST
# ============================================================

texts = [
    "What skills are required for a software developer?",

    "Software developer කෙනෙකුට අවශ්‍ය skills මොනවාද?",

    "மென்பொருள் உருவாக்குநருக்கு தேவையான திறன்கள் என்ன?"
]


# ============================================================
# REQUEST
# ============================================================

response = requests.post(
    url,
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
    timeout=60,
)


# ============================================================
# CHECK HTTP RESPONSE
# ============================================================

print(
    "HTTP status:",
    response.status_code
)


if not response.ok:

    print(
        "Cloudflare error response:"
    )

    print(
        response.text
    )

    raise RuntimeError(
        "BGE-M3 API request failed."
    )


data = response.json()


# ============================================================
# INSPECT RESPONSE
# ============================================================

print()
print(
    "Cloudflare success:",
    data.get("success")
)


if not data.get("success"):

    print(
        "Errors:",
        data.get("errors")
    )

    raise RuntimeError(
        "Cloudflare returned success=false."
    )


result = data.get(
    "result"
)


print()
print(
    "Result type:",
    type(result).__name__
)


# Useful on the first run so we know Cloudflare's
# exact response structure.

if isinstance(result, dict):

    print(
        "Result keys:",
        list(result.keys())
    )


# ============================================================
# FIND EMBEDDING MATRIX
# ============================================================

embeddings = None


if isinstance(result, dict):

    # Most embedding responses expose vectors under `data`.
    if isinstance(
        result.get("data"),
        list
    ):

        embeddings = (
            result["data"]
        )


elif isinstance(result, list):

    embeddings = result


if embeddings is None:

    print()
    print(
        "Unexpected result structure:"
    )

    print(result)

    raise RuntimeError(
        "Could not locate embeddings in Cloudflare response."
    )


# ============================================================
# VALIDATE EMBEDDINGS
# ============================================================

print()
print(
    "Number of embeddings:",
    len(embeddings)
)


if len(embeddings) != len(texts):

    raise RuntimeError(
        "Embedding count does not match input count."
    )


first_embedding = (
    embeddings[0]
)


print(
    "Embedding dimension:",
    len(first_embedding)
)


print(
    "First 5 values:",
    first_embedding[:5]
)


# ============================================================
# BASIC VECTOR VALIDATION
# ============================================================

if not all(
    isinstance(
        value,
        (int, float)
    )
    for value in first_embedding
):

    raise RuntimeError(
        "Embedding contains non-numeric values."
    )


if len(first_embedding) == 0:

    raise RuntimeError(
        "Empty embedding returned."
    )


print()
print(
    "BGE-M3 Cloudflare test PASSED."
)