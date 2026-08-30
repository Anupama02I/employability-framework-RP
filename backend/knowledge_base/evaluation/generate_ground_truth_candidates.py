import csv
import os
import time
from pathlib import Path

import chromadb
import requests
from dotenv import load_dotenv


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

EVALUATION_DIR = Path(__file__).resolve().parent
KB_DIR = EVALUATION_DIR.parent

VECTOR_STORE_DIR = (
    KB_DIR
    / "vector_store"
    / "chroma"
)

OUTPUT_PATH = (
    EVALUATION_DIR
    / "ground_truth_candidates.csv"
)


COLLECTION_NAME = "employability_kb_v1"

MODEL = "@cf/baai/bge-m3"

# Retrieve more than the final Top-5 so we can inspect
# alternative genuinely relevant chunks.
CANDIDATE_TOP_K = 15

MAX_RETRIES = 4
RETRY_WAIT_SECONDS = 10


ACCOUNT_ID = os.getenv(
    "CLOUDFLARE_ACCOUNT_ID"
)

API_TOKEN = os.getenv(
    "CLOUDFLARE_API_TOKEN"
)


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
# INFORMATION NEEDS
#
# IMPORTANT:
# These are canonical ENGLISH retrieval queries used only to
# help identify ground-truth evidence.
#
# They are NOT part of multilingual evaluation.
# ============================================================

INFORMATION_NEEDS = [

    {
        "information_need":
            "software_developer_skills",

        "query":
            "What skills are required to become a software developer?",

        "expected_corpus_id":
            "C001",

        "expected_occupation_name":
            "software developer",
    },

    {
        "information_need":
            "web_developer_role",

        "query":
            "What does a web developer do and what skills are needed?",

        "expected_corpus_id":
            "C001",

        "expected_occupation_name":
            "web developer",
    },

    {
        "information_need":
            "rpl_nvq",

        "query":
            "What is Recognition of Prior Learning and how is it related to NVQ?",

        "expected_corpus_id":
            "C003",

        "expected_occupation_name":
            "",
    },

    {
        "information_need":
            "nvq_progression",

        "query":
            "Can I progress to higher qualification levels through the Sri Lankan NVQ system?",

        "expected_corpus_id":
            "C003",

        "expected_occupation_name":
            "",
    },

    {
        "information_need":
            "state_university_admission",

        "query":
            "What are the minimum requirements for admission to Sri Lankan state universities?",

        "expected_corpus_id":
            "C005",

        "expected_occupation_name":
            "",
    },

    {
        "information_need":
            "cv_skills",

        "query":
            "How should I show my skills and experience in a CV?",

        "expected_corpus_id":
            "C006",

        "expected_occupation_name":
            "",
    },

    {
        "information_need":
            "youth_unemployment",

        "query":
            "What is the unemployment situation among young people in Sri Lanka?",

        "expected_corpus_id":
            "C008",

        "expected_occupation_name":
            "",
    },

    {
        "information_need":
            "nysc_training_centres",

        "query":
            "What NYSC training centres are available in Sri Lanka?",

        "expected_corpus_id":
            "C012",

        "expected_occupation_name":
            "",
    },
]


# ============================================================
# CLOUDFLARE EMBEDDING
# ============================================================

def get_embedding(text):

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
                "text": [text]
            },

            timeout=60,
        )


        if response.ok:

            data = response.json()

            if not data.get("success"):

                raise RuntimeError(
                    f"Cloudflare returned "
                    f"success=false: {data}"
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

            print(
                f"Temporary Cloudflare error "
                f"{response.status_code}. Retrying..."
            )

            time.sleep(
                RETRY_WAIT_SECONDS
                *
                attempt
            )

            continue


        raise RuntimeError(
            "Embedding request failed.\n"
            f"Status: {response.status_code}\n"
            f"{response.text}"
        )


    raise RuntimeError(
        "Embedding failed after retries."
    )


# ============================================================
# CHROMA
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
    "Chroma records:",
    collection.count()
)


# ============================================================
# GENERATE CANDIDATES
# ============================================================

output_rows = []


for index, need in enumerate(
    INFORMATION_NEEDS,
    start=1
):

    information_need = (
        need["information_need"]
    )

    query = need["query"]

    expected_corpus_id = (
        need["expected_corpus_id"]
    )

    expected_occupation_name = (
        need["expected_occupation_name"]
    )


    print()
    print(
        f"[{index}/{len(INFORMATION_NEEDS)}] "
        f"{information_need}"
    )


    query_embedding = (
        get_embedding(
            query
        )
    )


    # --------------------------------------------------------
    # Retrieve general top candidates.
    # --------------------------------------------------------

    results = collection.query(

        query_embeddings=[
            query_embedding
        ],

        n_results=
            CANDIDATE_TOP_K,

        include=[
            "documents",
            "metadatas",
            "distances",
        ],
    )


    ids = (
        results["ids"][0]
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
        chunk_id,
        document,
        metadata,
        distance
    ) in enumerate(

        zip(
            ids,
            documents,
            metadatas,
            distances
        ),

        start=1
    ):

        output_rows.append({

            "information_need":
                information_need,

            "canonical_query":
                query,

            "candidate_type":
                "global_top15",

            "candidate_rank":
                rank,

            "chunk_id":
                chunk_id,

            "corpus_id":
                metadata.get(
                    "corpus_id",
                    ""
                ),

            "occupation_name":
                metadata.get(
                    "occupation_name",
                    ""
                ),

            "title":
                metadata.get(
                    "title",
                    ""
                ),

            "page_number":
                metadata.get(
                    "page_number",
                    ""
                ),

            "knowledge_domain":
                metadata.get(
                    "knowledge_domain",
                    ""
                ),

            "distance":
                round(
                    distance,
                    4
                ),

            "expected_corpus_id":
                expected_corpus_id,

            "expected_occupation_name":
                expected_occupation_name,

            # You will fill this manually.
            "relevant":
                "",

            "notes":
                "",

            "text":
                document,
        })


    # --------------------------------------------------------
    # For normal document sources, also retrieve the best
    # candidates FROM THE EXPECTED SOURCE.
    #
    # This is important because a relevant chunk may not appear
    # in the global Top-15.
    # --------------------------------------------------------

    if expected_corpus_id != "C001":

        source_results = collection.query(

            query_embeddings=[
                query_embedding
            ],

            n_results=
                10,

            where={
                "corpus_id":
                    expected_corpus_id
            },

            include=[
                "documents",
                "metadatas",
                "distances",
            ],
        )


        source_ids = (
            source_results["ids"][0]
        )

        source_documents = (
            source_results["documents"][0]
        )

        source_metadatas = (
            source_results["metadatas"][0]
        )

        source_distances = (
            source_results["distances"][0]
        )


        existing_ids = set(ids)


        for rank, (
            chunk_id,
            document,
            metadata,
            distance
        ) in enumerate(

            zip(
                source_ids,
                source_documents,
                source_metadatas,
                source_distances
            ),

            start=1
        ):

            # Avoid duplicate rows already present
            # in global Top-15.
            if chunk_id in existing_ids:
                continue


            output_rows.append({

                "information_need":
                    information_need,

                "canonical_query":
                    query,

                "candidate_type":
                    "expected_source_top10",

                "candidate_rank":
                    rank,

                "chunk_id":
                    chunk_id,

                "corpus_id":
                    metadata.get(
                        "corpus_id",
                        ""
                    ),

                "occupation_name":
                    metadata.get(
                        "occupation_name",
                        ""
                    ),

                "title":
                    metadata.get(
                        "title",
                        ""
                    ),

                "page_number":
                    metadata.get(
                        "page_number",
                        ""
                    ),

                "knowledge_domain":
                    metadata.get(
                        "knowledge_domain",
                        ""
                    ),

                "distance":
                    round(
                        distance,
                        4
                    ),

                "expected_corpus_id":
                    expected_corpus_id,

                "expected_occupation_name":
                    expected_occupation_name,

                "relevant":
                    "",

                "notes":
                    "",

                "text":
                    document,
            })


# ============================================================
# SAVE CSV
# ============================================================

fieldnames = [

    "information_need",
    "canonical_query",
    "candidate_type",
    "candidate_rank",
    "chunk_id",
    "corpus_id",
    "occupation_name",
    "title",
    "page_number",
    "knowledge_domain",
    "distance",
    "expected_corpus_id",
    "expected_occupation_name",
    "relevant",
    "notes",
    "text",
]


with open(
    OUTPUT_PATH,
    "w",
    encoding="utf-8-sig",
    newline=""
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames
    )

    writer.writeheader()

    writer.writerows(
        output_rows
    )


print()
print(
    "=" * 75
)

print(
    "GROUND-TRUTH CANDIDATES GENERATED"
)

print(
    "=" * 75
)

print(
    "Information needs:",
    len(INFORMATION_NEEDS)
)

print(
    "Candidate rows:",
    len(output_rows)
)

print()

print(
    "Output:"
)

print(
    OUTPUT_PATH
)