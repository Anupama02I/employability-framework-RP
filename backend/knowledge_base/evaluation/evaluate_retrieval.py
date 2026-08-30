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

OUTPUT_PATH = (
    EVALUATION_DIR
    / "retrieval_evaluation_results.csv"
)

SUMMARY_PATH = (
    EVALUATION_DIR
    / "retrieval_evaluation_summary.csv"
)


VECTOR_STORE_DIR = (
    KB_DIR
    / "vector_store"
    / "chroma"
)


COLLECTION_NAME = "employability_kb_v1"

MODEL = "@cf/baai/bge-m3"

TOP_K = 5

MAX_RETRIES = 4
RETRY_WAIT_SECONDS = 10


ACCOUNT_ID = os.getenv(
    "CLOUDFLARE_ACCOUNT_ID"
)

API_TOKEN = os.getenv(
    "CLOUDFLARE_API_TOKEN"
)


# ============================================================
# VALIDATE ENVIRONMENT
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
                "text": [
                    text
                ]
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


        # Temporary failures only
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
    name=COLLECTION_NAME
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

        test_cases.append(row)


print(
    "Evaluation cases:",
    len(test_cases)
)


if len(test_cases) == 0:

    raise RuntimeError(
        "No retrieval test cases found."
    )


# ============================================================
# GROUND-TRUTH MATCHING
# ============================================================

def normalize(value):

    if value is None:
        return ""

    return (
        str(value)
        .strip()
        .casefold()
    )


def is_relevant(
    metadata,
    expected_corpus_id,
    expected_occupation_name
):

    actual_corpus_id = normalize(
        metadata.get(
            "corpus_id"
        )
    )

    expected_corpus_id = normalize(
        expected_corpus_id
    )


    # Corpus must always match.
    if (
        actual_corpus_id
        !=
        expected_corpus_id
    ):

        return False


    expected_occupation_name = normalize(
        expected_occupation_name
    )


    # --------------------------------------------------------
    # Normal document source
    #
    # No occupation name specified:
    # corpus-level match is sufficient.
    # --------------------------------------------------------

    if not expected_occupation_name:

        return True


    # --------------------------------------------------------
    # ESCO
    #
    # Corpus ID alone is NOT sufficient because C001 contains
    # thousands of occupations.
    # --------------------------------------------------------

    actual_occupation_name = normalize(
        metadata.get(
            "occupation_name"
        )
    )


    return (
        actual_occupation_name
        ==
        expected_occupation_name
    )


# ============================================================
# RETRIEVE
# ============================================================

def retrieve(query):

    query_embedding = (
        get_embedding(
            query
        )
    )


    results = collection.query(

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


    return results


# ============================================================
# EVALUATION
# ============================================================

evaluation_rows = []


for index, case in enumerate(
    test_cases,
    start=1
):

    test_id = case[
        "test_id"
    ]

    query = case[
        "query"
    ]

    input_style = case[
        "input_style"
    ]

    information_need = case[
        "information_need"
    ]

    knowledge_domain = case[
        "knowledge_domain"
    ]

    expected_corpus_id = case[
        "expected_corpus_id"
    ]

    expected_occupation_name = (
        case.get(
            "expected_occupation_name",
            ""
        )
        or ""
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


    relevant_rank = None


    for rank, metadata in enumerate(
        metadatas,
        start=1
    ):

        if is_relevant(
            metadata,
            expected_corpus_id,
            expected_occupation_name
        ):

            relevant_rank = rank

            break


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

        1.0 / relevant_rank

        if relevant_rank is not None

        else 0.0
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

        "expected_corpus_id":
            expected_corpus_id,

        "expected_occupation_name":
            expected_occupation_name,

        "relevant_rank":
            (
                relevant_rank
                if relevant_rank is not None
                else ""
            ),

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

        "top1_corpus_id":
            top1_metadata.get(
                "corpus_id",
                ""
            ),

        "top1_occupation_name":
            top1_metadata.get(
                "occupation_name",
                ""
            ),

        "top1_title":
            top1_metadata.get(
                "title",
                ""
            ),

        "top1_distance":
            (
                round(
                    top1_distance,
                    4
                )
                if top1_distance is not None
                else ""
            ),
    })


print()


# ============================================================
# SAVE DETAILED RESULTS
# ============================================================

fieldnames = list(
    evaluation_rows[0].keys()
)


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
        evaluation_rows
    )


# ============================================================
# METRIC CALCULATION
# ============================================================

def calculate_metrics(rows):

    count = len(rows)


    if count == 0:

        return {
            "count": 0,
            "hit_at_1": 0,
            "hit_at_3": 0,
            "hit_at_5": 0,
            "mrr": 0,
        }


    return {

        "count":
            count,

        "hit_at_1":
            sum(
                row["hit_at_1"]
                for row in rows
            )
            /
            count,

        "hit_at_3":
            sum(
                row["hit_at_3"]
                for row in rows
            )
            /
            count,

        "hit_at_5":
            sum(
                row["hit_at_5"]
                for row in rows
            )
            /
            count,

        "mrr":
            sum(
                row["reciprocal_rank"]
                for row in rows
            )
            /
            count,
    }


# ============================================================
# BUILD SUMMARY
# ============================================================

summary_rows = []


# Overall
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


# ============================================================
# BY INPUT STYLE
# ============================================================

by_style = defaultdict(list)


for row in evaluation_rows:

    by_style[
        row["input_style"]
    ].append(row)


for style, rows in sorted(
    by_style.items()
):

    metrics = calculate_metrics(
        rows
    )


    summary_rows.append({

        "group_type":
            "Input style",

        "group":
            style,

        **metrics
    })


# ============================================================
# BY KNOWLEDGE DOMAIN
# ============================================================

by_domain = defaultdict(list)


for row in evaluation_rows:

    by_domain[
        row["knowledge_domain"]
    ].append(row)


for domain, rows in sorted(
    by_domain.items()
):

    metrics = calculate_metrics(
        rows
    )


    summary_rows.append({

        "group_type":
            "Knowledge domain",

        "group":
            domain,

        **metrics
    })


# ============================================================
# BY INFORMATION NEED
# ============================================================

by_need = defaultdict(list)


for row in evaluation_rows:

    by_need[
        row["information_need"]
    ].append(row)


for need, rows in sorted(
    by_need.items()
):

    metrics = calculate_metrics(
        rows
    )


    summary_rows.append({

        "group_type":
            "Information need",

        "group":
            need,

        **metrics
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
        fieldnames=summary_fields
    )

    writer.writeheader()


    for row in summary_rows:

        output_row = dict(row)

        for metric in [
            "hit_at_1",
            "hit_at_3",
            "hit_at_5",
            "mrr",
        ]:

            output_row[
                metric
            ] = round(
                output_row[
                    metric
                ],
                4
            )


        writer.writerow(
            output_row
        )


# ============================================================
# PRINT SUMMARY
# ============================================================

print()
print(
    "=" * 75
)

print(
    "RETRIEVAL EVALUATION COMPLETE"
)

print(
    "=" * 75
)


print()
print(
    "OVERALL"
)

print(
    f"Cases:  {overall['count']}"
)

print(
    f"Hit@1:  {overall['hit_at_1']:.3f}"
)

print(
    f"Hit@3:  {overall['hit_at_3']:.3f}"
)

print(
    f"Hit@5:  {overall['hit_at_5']:.3f}"
)

print(
    f"MRR:    {overall['mrr']:.3f}"
)


print()
print(
    "BY INPUT STYLE"
)


for style, rows in sorted(
    by_style.items()
):

    metrics = calculate_metrics(
        rows
    )

    print(
        f"{style:12} "
        f"n={metrics['count']:2d}  "
        f"H@1={metrics['hit_at_1']:.3f}  "
        f"H@3={metrics['hit_at_3']:.3f}  "
        f"H@5={metrics['hit_at_5']:.3f}  "
        f"MRR={metrics['mrr']:.3f}"
    )


print()
print(
    "BY KNOWLEDGE DOMAIN"
)


for domain, rows in sorted(
    by_domain.items()
):

    metrics = calculate_metrics(
        rows
    )

    print(
        f"{domain}: "
        f"n={metrics['count']}  "
        f"H@1={metrics['hit_at_1']:.3f}  "
        f"H@3={metrics['hit_at_3']:.3f}  "
        f"H@5={metrics['hit_at_5']:.3f}  "
        f"MRR={metrics['mrr']:.3f}"
    )


print()
print(
    "Detailed results:"
)

print(
    OUTPUT_PATH
)


print()
print(
    "Summary:"
)

print(
    SUMMARY_PATH
)