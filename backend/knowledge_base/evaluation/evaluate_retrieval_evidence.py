import csv
import os
import time
from collections import defaultdict
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


TEST_CASES_PATH = (
    EVALUATION_DIR
    / "retrieval_test_cases.csv"
)


GROUND_TRUTH_PATH = (
    EVALUATION_DIR
    / "retrieval_ground_truth.csv"
)


RESULTS_PATH = (
    EVALUATION_DIR
    / "retrieval_evidence_results.csv"
)


SUMMARY_PATH = (
    EVALUATION_DIR
    / "retrieval_evidence_summary.csv"
)


VECTOR_STORE_DIR = (
    KB_DIR
    / "vector_store"
    / "chroma"
)


COLLECTION_NAME = (
    "employability_kb_v1"
)


MODEL = (
    "@cf/baai/bge-m3"
)


TOP_K = 5

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
        "CLOUDFLARE_ACCOUNT_ID "
        "missing from .env"
    )


if not API_TOKEN:

    raise RuntimeError(
        "CLOUDFLARE_API_TOKEN "
        "missing from .env"
    )


API_URL = (
    "https://api.cloudflare.com/client/v4/"
    f"accounts/{ACCOUNT_ID}/ai/run/{MODEL}"
)


# ============================================================
# EMBEDDING
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
                "text": [
                    text
                ]
            },

            timeout=60,
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


            if not embeddings:

                raise RuntimeError(
                    "No embedding returned."
                )


            return embeddings[0]


        # ----------------------------------------------------
        # Retry temporary API failures
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

            print(
                f"\nTemporary Cloudflare error "
                f"{response.status_code}. "
                f"Retrying..."
            )


            time.sleep(
                RETRY_WAIT_SECONDS
                *
                attempt
            )


            continue


        raise RuntimeError(
            "Embedding request failed.\n"
            f"HTTP status: "
            f"{response.status_code}\n"
            f"{response.text}"
        )


    raise RuntimeError(
        "Embedding failed after retries."
    )


# ============================================================
# LOAD CHROMA
# ============================================================

client = chromadb.PersistentClient(

    path=str(
        VECTOR_STORE_DIR
    )
)


collection = client.get_collection(

    name=
        COLLECTION_NAME
)


print(
    "Chroma records:",
    collection.count()
)


# ============================================================
# LOAD TEST CASES
# ============================================================

test_cases = []


with open(
    TEST_CASES_PATH,
    "r",
    encoding="utf-8-sig",
    newline=""
) as f:

    reader = csv.DictReader(f)

    for row in reader:

        test_cases.append(
            row
        )


print(
    "Test cases:",
    len(test_cases)
)


# ============================================================
# LOAD EVIDENCE-LEVEL GROUND TRUTH
# ============================================================

ground_truth = defaultdict(
    set
)


with open(
    GROUND_TRUTH_PATH,
    "r",
    encoding="utf-8-sig",
    newline=""
) as f:

    reader = csv.DictReader(f)


    for row in reader:

        information_need = (
            row[
                "information_need"
            ].strip()
        )


        chunk_id = (
            row[
                "relevant_chunk_id"
            ].strip()
        )


        if (
            information_need
            and
            chunk_id
        ):

            ground_truth[
                information_need
            ].add(
                chunk_id
            )


print(
    "Information needs with ground truth:",
    len(ground_truth)
)


# ============================================================
# VALIDATE GROUND TRUTH
# ============================================================

information_needs_in_tests = {

    row[
        "information_need"
    ].strip()

    for row in test_cases
}


missing_ground_truth = (

    information_needs_in_tests
    -
    set(
        ground_truth.keys()
    )
)


if missing_ground_truth:

    raise RuntimeError(

        "Missing evidence-level ground truth "
        "for:\n"

        +
        "\n".join(
            sorted(
                missing_ground_truth
            )
        )
    )


# ============================================================
# RETRIEVAL
# ============================================================

def retrieve(query):

    query_embedding = (
        get_embedding(
            query
        )
    )


    return collection.query(

        query_embeddings=[
            query_embedding
        ],

        n_results=
            TOP_K,

        include=[
            "documents",
            "metadatas",
            "distances",
        ],
    )


# ============================================================
# EVALUATE
# ============================================================

evaluation_rows = []


for index, case in enumerate(
    test_cases,
    start=1
):

    test_id = (
        case[
            "test_id"
        ]
    )


    information_need = (
        case[
            "information_need"
        ].strip()
    )


    input_style = (
        case[
            "input_style"
        ]
    )


    knowledge_domain = (
        case[
            "knowledge_domain"
        ]
    )


    query = (
        case[
            "query"
        ]
    )


    relevant_chunk_ids = (
        ground_truth[
            information_need
        ]
    )


    print(
        f"[{index}/{len(test_cases)}] "
        f"{test_id} | "
        f"{input_style}",
        end="\r"
    )


    results = retrieve(
        query
    )


    retrieved_ids = (
        results[
            "ids"
        ][0]
    )


    metadatas = (
        results[
            "metadatas"
        ][0]
    )


    distances = (
        results[
            "distances"
        ][0]
    )


    # --------------------------------------------------------
    # Find rank of FIRST relevant evidence chunk
    # --------------------------------------------------------

    relevant_rank = None

    matched_chunk_id = ""


    for rank, chunk_id in enumerate(
        retrieved_ids,
        start=1
    ):

        if (
            chunk_id
            in
            relevant_chunk_ids
        ):

            relevant_rank = rank

            matched_chunk_id = (
                chunk_id
            )

            break


    # --------------------------------------------------------
    # Metrics
    # --------------------------------------------------------

    hit_at_1 = int(
        relevant_rank is not None
        and
        relevant_rank <= 1
    )


    hit_at_3 = int(
        relevant_rank is not None
        and
        relevant_rank <= 3
    )


    hit_at_5 = int(
        relevant_rank is not None
        and
        relevant_rank <= 5
    )


    reciprocal_rank = (

        1.0
        /
        relevant_rank

        if relevant_rank
        is not None

        else 0.0
    )


    # --------------------------------------------------------
    # Top-1 diagnostic information
    # --------------------------------------------------------

    top1_chunk_id = (

        retrieved_ids[0]

        if retrieved_ids

        else ""
    )


    top1_metadata = (

        metadatas[0]

        if metadatas

        else {}
    )


    top1_distance = (

        distances[0]

        if distances

        else None
    )


    evaluation_rows.append({

        "test_id":
            test_id,

        "information_need":
            information_need,

        "input_style":
            input_style,

        "knowledge_domain":
            knowledge_domain,

        "query":
            query,

        "relevant_chunk_count":
            len(
                relevant_chunk_ids
            ),

        "relevant_rank":
            (
                relevant_rank

                if relevant_rank
                is not None

                else ""
            ),

        "matched_chunk_id":
            matched_chunk_id,

        "hit_at_1":
            hit_at_1,

        "hit_at_3":
            hit_at_3,

        "hit_at_5":
            hit_at_5,

        "reciprocal_rank":
            round(
                reciprocal_rank,
                4
            ),

        "top1_chunk_id":
            top1_chunk_id,

        "top1_corpus_id":
            top1_metadata.get(
                "corpus_id",
                ""
            ),

        "top1_title":
            top1_metadata.get(
                "title",
                ""
            ),

        "top1_occupation_name":
            top1_metadata.get(
                "occupation_name",
                ""
            ),

        "top1_distance":
            (
                round(
                    top1_distance,
                    4
                )

                if top1_distance
                is not None

                else ""
            ),

        "retrieved_top5_ids":
            " | ".join(
                retrieved_ids
            ),

        "expected_relevant_ids":
            " | ".join(
                sorted(
                    relevant_chunk_ids
                )
            ),
    })


print()


# ============================================================
# SAVE DETAILED RESULTS
# ============================================================

with open(
    RESULTS_PATH,
    "w",
    encoding="utf-8-sig",
    newline=""
) as f:

    fieldnames = list(
        evaluation_rows[
            0
        ].keys()
    )


    writer = csv.DictWriter(

        f,

        fieldnames=
            fieldnames
    )


    writer.writeheader()


    writer.writerows(
        evaluation_rows
    )


# ============================================================
# METRIC FUNCTION
# ============================================================

def calculate_metrics(rows):

    count = len(rows)


    if count == 0:

        return {

            "count": 0,

            "hit_at_1": 0.0,

            "hit_at_3": 0.0,

            "hit_at_5": 0.0,

            "mrr": 0.0,
        }


    return {

        "count":
            count,

        "hit_at_1":
            sum(
                row[
                    "hit_at_1"
                ]
                for row in rows
            )
            /
            count,

        "hit_at_3":
            sum(
                row[
                    "hit_at_3"
                ]
                for row in rows
            )
            /
            count,

        "hit_at_5":
            sum(
                row[
                    "hit_at_5"
                ]
                for row in rows
            )
            /
            count,

        "mrr":
            sum(
                row[
                    "reciprocal_rank"
                ]
                for row in rows
            )
            /
            count,
    }


# ============================================================
# GROUP RESULTS
# ============================================================

summary_rows = []


overall = calculate_metrics(
    evaluation_rows
)


summary_rows.append({

    "group_type":
        "Overall",

    "group":
        "All",

    **overall
})


# ------------------------------------------------------------
# Input style
# ------------------------------------------------------------

by_style = defaultdict(
    list
)


for row in evaluation_rows:

    by_style[
        row[
            "input_style"
        ]
    ].append(
        row
    )


for style, rows in sorted(
    by_style.items()
):

    summary_rows.append({

        "group_type":
            "Input style",

        "group":
            style,

        **calculate_metrics(
            rows
        )
    })


# ------------------------------------------------------------
# Knowledge domain
# ------------------------------------------------------------

by_domain = defaultdict(
    list
)


for row in evaluation_rows:

    by_domain[
        row[
            "knowledge_domain"
        ]
    ].append(
        row
    )


for domain, rows in sorted(
    by_domain.items()
):

    summary_rows.append({

        "group_type":
            "Knowledge domain",

        "group":
            domain,

        **calculate_metrics(
            rows
        )
    })


# ------------------------------------------------------------
# Information need
# ------------------------------------------------------------

by_need = defaultdict(
    list
)


for row in evaluation_rows:

    by_need[
        row[
            "information_need"
        ]
    ].append(
        row
    )


for need, rows in sorted(
    by_need.items()
):

    summary_rows.append({

        "group_type":
            "Information need",

        "group":
            need,

        **calculate_metrics(
            rows
        )
    })


# ============================================================
# SAVE SUMMARY
# ============================================================

summary_fields = [

    "group_type",
    "group",
    "count",
    "hit_at_1",
    "hit_at_3",
    "hit_at_5",
    "mrr",
]


with open(
    SUMMARY_PATH,
    "w",
    encoding="utf-8-sig",
    newline=""
) as f:

    writer = csv.DictWriter(

        f,

        fieldnames=
            summary_fields
    )


    writer.writeheader()


    for row in summary_rows:

        output = dict(
            row
        )


        for metric in [

            "hit_at_1",
            "hit_at_3",
            "hit_at_5",
            "mrr",

        ]:

            output[
                metric
            ] = round(
                output[
                    metric
                ],
                4
            )


        writer.writerow(
            output
        )


# ============================================================
# PRINT RESULTS
# ============================================================

print()
print(
    "=" * 78
)

print(
    "EVIDENCE-LEVEL RETRIEVAL EVALUATION"
)

print(
    "=" * 78
)


print()
print(
    "OVERALL"
)

print(
    f"Cases:  "
    f"{overall['count']}"
)

print(
    f"Hit@1:  "
    f"{overall['hit_at_1']:.3f}"
)

print(
    f"Hit@3:  "
    f"{overall['hit_at_3']:.3f}"
)

print(
    f"Hit@5:  "
    f"{overall['hit_at_5']:.3f}"
)

print(
    f"MRR:    "
    f"{overall['mrr']:.3f}"
)


print()
print(
    "BY INPUT STYLE"
)


for style, rows in sorted(
    by_style.items()
):

    metrics = (
        calculate_metrics(
            rows
        )
    )


    print(

        f"{style:12} "

        f"n={metrics['count']:2d}  "

        f"H@1="
        f"{metrics['hit_at_1']:.3f}  "

        f"H@3="
        f"{metrics['hit_at_3']:.3f}  "

        f"H@5="
        f"{metrics['hit_at_5']:.3f}  "

        f"MRR="
        f"{metrics['mrr']:.3f}"
    )


print()
print(
    "BY KNOWLEDGE DOMAIN"
)


for domain, rows in sorted(
    by_domain.items()
):

    metrics = (
        calculate_metrics(
            rows
        )
    )


    print(

        f"{domain}: "

        f"n={metrics['count']}  "

        f"H@1="
        f"{metrics['hit_at_1']:.3f}  "

        f"H@3="
        f"{metrics['hit_at_3']:.3f}  "

        f"H@5="
        f"{metrics['hit_at_5']:.3f}  "

        f"MRR="
        f"{metrics['mrr']:.3f}"
    )


print()
print(
    "BY INFORMATION NEED"
)


for need, rows in sorted(
    by_need.items()
):

    metrics = (
        calculate_metrics(
            rows
        )
    )


    print(

        f"{need}: "

        f"n={metrics['count']}  "

        f"H@1="
        f"{metrics['hit_at_1']:.3f}  "

        f"H@3="
        f"{metrics['hit_at_3']:.3f}  "

        f"H@5="
        f"{metrics['hit_at_5']:.3f}  "

        f"MRR="
        f"{metrics['mrr']:.3f}"
    )


# ============================================================
# PRINT FAILED CASES
# ============================================================

failed_cases = [

    row

    for row in evaluation_rows

    if row[
        "hit_at_5"
    ] == 0
]


print()
print(
    "FAILED TOP-5 CASES:",
    len(failed_cases)
)


for row in failed_cases:

    print()

    print(
        row[
            "test_id"
        ],
        "|",
        row[
            "input_style"
        ],
        "|",
        row[
            "information_need"
        ]
    )

    print(
        "Query:",
        row[
            "query"
        ]
    )

    print(
        "Retrieved:",
        row[
            "retrieved_top5_ids"
        ]
    )

    print(
        "Expected:",
        row[
            "expected_relevant_ids"
        ]
    )


print()
print(
    "Detailed results:"
)

print(
    RESULTS_PATH
)


print()
print(
    "Summary:"
)

print(
    SUMMARY_PATH
)