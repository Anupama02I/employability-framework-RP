import os
import requests
import chromadb

from pathlib import Path
from dotenv import load_dotenv


# ============================================================
# CONFIG
# ============================================================

load_dotenv()


BASE_DIR = Path(__file__).resolve().parent

VECTOR_STORE_DIR = (
    BASE_DIR
    / "vector_store"
    / "chroma"
)


ACCOUNT_ID = os.getenv(
    "CLOUDFLARE_ACCOUNT_ID"
)

API_TOKEN = os.getenv(
    "CLOUDFLARE_API_TOKEN"
)


MODEL = "@cf/baai/bge-m3"

COLLECTION_NAME = "employability_kb_v1"

TOP_K = 5


API_URL = (
    "https://api.cloudflare.com/client/v4/"
    f"accounts/{ACCOUNT_ID}/ai/run/{MODEL}"
)


# ============================================================
# EMBEDDING FUNCTION
# ============================================================

def get_query_embedding(text):

    response = requests.post(

        API_URL,

        headers={
            "Authorization":
                f"Bearer {API_TOKEN}",

            "Content-Type":
                "application/json",
        },

        json={
            "text": [text]
        },

        timeout=60,
    )


    if not response.ok:

        raise RuntimeError(
            f"Embedding failed: "
            f"{response.status_code}\n"
            f"{response.text}"
        )


    data = response.json()


    if not data.get("success"):

        raise RuntimeError(
            f"Cloudflare returned success=false: "
            f"{data}"
        )


    embeddings = (
        data
        .get("result", {})
        .get("data")
    )


    if not embeddings:

        raise RuntimeError(
            "No embedding returned."
        )


    return embeddings[0]


# ============================================================
# LOAD CHROMA
# ============================================================

client = chromadb.PersistentClient(
    path=str(
        VECTOR_STORE_DIR
    )
)


collection = client.get_collection(
    name=COLLECTION_NAME
)


print(
    "Collection records:",
    collection.count()
)


# ============================================================
# RETRIEVAL TEST
# ============================================================

def retrieve(
    query,
    top_k=TOP_K
):

    query_embedding = (
        get_query_embedding(
            query
        )
    )


    results = collection.query(

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


    return results


def print_results(
    query,
    results
):

    print()
    print(
        "=" * 90
    )

    print(
        "QUERY:"
    )

    print(
        query
    )

    print(
        "=" * 90
    )


    documents = (
        results["documents"][0]
    )

    metadatas = (
        results["metadatas"][0]
    )

    distances = (
        results["distances"][0]
    )


    for rank, (
        document,
        metadata,
        distance
    ) in enumerate(

        zip(
            documents,
            metadatas,
            distances
        ),

        start=1
    ):

        print()
        print(
            f"Rank {rank}"
        )

        print(
            f"Distance: "
            f"{distance:.4f}"
        )

        print(
            "Title:",
            metadata.get(
                "title"
            )
        )

        print(
            "Domain:",
            metadata.get(
                "knowledge_domain"
            )
        )

        print(
            "Source:",
            metadata.get(
                "source"
            )
        )

        print(
            "Corpus ID:",
            metadata.get(
                "corpus_id"
            )
        )

        print(
            "Page:",
            metadata.get(
                "page_number"
            )
        )

        print(
            "Text:"
        )

        print(
            document[:700]
        )

        print(
            "-" * 90
        )


# ============================================================
# INITIAL MULTILINGUAL TEST QUERIES
# ============================================================

queries = [

    # --------------------------------------------------------
    # ENGLISH
    # --------------------------------------------------------

    "What skills are required to become a software developer?",

    "What is Recognition of Prior Learning and how does it relate to NVQ?",

    "How should I prepare for a job interview?",


    # --------------------------------------------------------
    # SINHALA
    # --------------------------------------------------------

    "Software developer කෙනෙකුට අවශ්‍ය කුසලතා මොනවාද?",

    "RPL කියන්නේ මොකක්ද සහ ඒක NVQ එකට සම්බන්ධ වෙන්නේ කොහොමද?",


    # --------------------------------------------------------
    # TAMIL
    # --------------------------------------------------------

    "மென்பொருள் உருவாக்குநராக ஆக என்ன திறன்கள் தேவை?",

    "RPL என்றால் என்ன, அது NVQ உடன் எவ்வாறு தொடர்புடையது?",


    # --------------------------------------------------------
    # SINGLISH
    # --------------------------------------------------------

    "software developer kenek wenna ona skills monawada?",

    "RPL kiyanne mokakda NVQ ekata sambandha wenne kohomada?",


    # --------------------------------------------------------
    # TANGLISH
    # --------------------------------------------------------

    "software developer aaga enna skills venum?",

    "RPL na enna, adhu NVQ oda eppadi connect aaguthu?",
]


# ============================================================
# RUN TESTS
# ============================================================

for query in queries:

    results = retrieve(
        query
    )

    print_results(
        query,
        results
    )