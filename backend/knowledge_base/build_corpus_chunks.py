import csv
import json
import re
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = BASE_DIR / "processed"

DOCUMENTS_PATH = (
    PROCESSED_DIR
    / "corpus_v1_documents.jsonl"
)

ESCO_PATH = (
    PROCESSED_DIR
    / "esco_occupation_profiles.jsonl"
)

OUTPUT_JSONL = (
    PROCESSED_DIR
    / "corpus_v1_chunks.jsonl"
)

OUTPUT_STATS = (
    PROCESSED_DIR
    / "corpus_v1_chunk_stats.csv"
)


# ============================================================
# CHUNK SETTINGS
#
# These are word-based rather than token-based to keep the
# implementation simple and reproducible.
# ============================================================

CHUNK_SIZE_WORDS = 500
CHUNK_OVERLAP_WORDS = 75
MIN_DOCUMENT_CHUNK_WORDS = 30

# ESCO occupation profiles are already logical documents.
# Only unusually long profiles will be split.
ESCO_MAX_WORDS_BEFORE_SPLIT = 700


# ============================================================
# SELECTIVE-SOURCE RULES
#
# C006 = ILO jobseeker handbook
# C007 = ILO youth career handbook
# C010 = Ministry of Labour report
#
# These documents are large and contain material outside the
# intended RAG scope. We keep chunks only when they contain
# relevant career/employment concepts.
# ============================================================

SELECTIVE_KEYWORDS = {

    "C006": [
        "job search",
        "jobseeker",
        "job seeker",
        "curriculum vitae",
        "cv",
        "resume",
        "résumé",
        "application letter",
        "cover letter",
        "interview",
        "employment",
        "online job",
        "job application",
        "professional profile",
        "career",
        "skills",
    ],

    "C007": [
        "career",
        "jobseeker",
        "job seeker",
        "employment",
        "interview",
        "cv",
        "curriculum vitae",
        "job search",
        "career planning",
        "career guidance",
        "skills",
        "occupation",
        "training",
        "young people",
        "youth",
    ],

    "C010": [
        "career guidance",
        "career guidance officer",
        "employment guidance",
        "employment service",
        "public employment service",
        "manpower",
        "job seeker",
        "jobseeker",
        "job fair",
        "labour market information",
        "labour market",
        "employment promotion",
        "employment creation",
        "skills development",
        "career",
    ],
}


# ============================================================
# BASIC HELPERS
# ============================================================

def clean_text(text):

    if not text:
        return ""

    text = text.replace(
        "\x00",
        " "
    )

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text.strip()


def word_count(text):

    return len(
        text.split()
    )


def normalize_for_matching(text):

    return (
        clean_text(text)
        .lower()
    )


# ============================================================
# WORD-BASED CHUNKING
# ============================================================

def split_into_chunks(
    text,
    chunk_size=CHUNK_SIZE_WORDS,
    overlap=CHUNK_OVERLAP_WORDS
):

    text = clean_text(
        text
    )

    if not text:
        return []


    words = text.split()


    if len(words) <= chunk_size:

        return [
            text
        ]


    chunks = []

    start = 0


    while start < len(words):

        end = min(
            start + chunk_size,
            len(words)
        )


        chunk_words = (
            words[
                start:end
            ]
        )


        chunk_text = " ".join(
            chunk_words
        ).strip()


        if chunk_text:

            chunks.append(
                chunk_text
            )


        if end >= len(words):

            break


        start = (
            end - overlap
        )


    return chunks


# ============================================================
# SELECTIVE-SOURCE FILTER
# ============================================================

def should_keep_selective_chunk(
    corpus_id,
    text
):

    keywords = (
        SELECTIVE_KEYWORDS.get(
            corpus_id
        )
    )


    # Not a selective source.
    if not keywords:
        return True


    normalized = (
        normalize_for_matching(
            text
        )
    )


    return any(
        keyword in normalized
        for keyword in keywords
    )


# ============================================================
# LOAD JSONL
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
                json.loads(
                    line
                )
            )


    return records


# ============================================================
# BUILD NON-ESCO CHUNKS
# ============================================================

def build_document_chunks():

    print(
        "Loading extracted PDF/HTML documents..."
    )


    documents = load_jsonl(
        DOCUMENTS_PATH
    )


    output = []

    skipped_selective = 0


    for record in documents:

        corpus_id = str(
            record.get(
                "corpus_id",
                ""
            )
        ).strip()


        source_id = str(
            record.get(
                "source_id",
                ""
            )
        ).strip()


        text = clean_text(
            record.get(
                "text",
                ""
            )
        )


        if not text:
            continue


        page_number = (
            record.get(
                "page_number"
            )
        )


        chunks = split_into_chunks(
            text
        )


        for chunk_number, chunk_text in enumerate(
            chunks,
            start=1
        ):

            # ------------------------------------------------
            # Remove very short extraction fragments such as
            # page numbers, headings and broken table remnants.
            # ------------------------------------------------

            if word_count(chunk_text) < MIN_DOCUMENT_CHUNK_WORDS:
                continue
            
            # ------------------------------------------------
            # Apply selective filtering only to the large
            # sources defined above.
            # ------------------------------------------------

            if not should_keep_selective_chunk(
                corpus_id,
                chunk_text
            ):

                skipped_selective += 1
                continue


            page_part = (
                f"P{page_number}"
                if page_number is not None
                else
                "HTML"
            )


            chunk_id = (
                f"{corpus_id}_"
                f"{page_part}_"
                f"CH{chunk_number:02d}"
            )


            output.append(
                {
                    "chunk_id":
                        chunk_id,

                    "record_type":
                        "document_chunk",

                    "corpus_id":
                        corpus_id,

                    "source_id":
                        source_id,

                    "source":
                        record.get(
                            "organization",
                            ""
                        ),

                    "title":
                        record.get(
                            "title",
                            ""
                        ),

                    "knowledge_domain":
                        record.get(
                            "knowledge_domain",
                            ""
                        ),

                    "source_url":
                        record.get(
                            "source_url",
                            ""
                        ),

                    "freshness_or_validity":
                        record.get(
                            "freshness_or_validity",
                            ""
                        ),

                    "local_filename":
                        record.get(
                            "local_filename",
                            ""
                        ),

                    "sha256":
                        record.get(
                            "sha256",
                            ""
                        ),

                    "page_number":
                        page_number,

                    "chunk_number":
                        chunk_number,

                    "language":
                        "en",

                    "word_count":
                        word_count(
                            chunk_text
                        ),

                    "text":
                        chunk_text,
                }
            )


    print(
        "Document chunks kept:",
        len(output)
    )

    print(
        "Selective chunks skipped:",
        skipped_selective
    )


    return output


# ============================================================
# BUILD ESCO CHUNKS
# ============================================================

def build_esco_chunks():

    print(
        "Loading ESCO occupation profiles..."
    )


    profiles = load_jsonl(
        ESCO_PATH
    )


    output = []


    for profile in profiles:

        occupation_name = str(
            profile.get(
                "occupation_name",
                ""
            )
        ).strip()


        occupation_uri = str(
            profile.get(
                "occupation_uri",
                ""
            )
        ).strip()


        esco_code = str(
            profile.get(
                "esco_code",
                ""
            )
        ).strip()


        isco_group = str(
            profile.get(
                "isco_group",
                ""
            )
        ).strip()


        text = clean_text(
            profile.get(
                "text",
                ""
            )
        )


        if not text:
            continue


        # ----------------------------------------------------
        # One occupation = one logical document whenever
        # possible.
        # ----------------------------------------------------

        if (
            word_count(text)
            <=
            ESCO_MAX_WORDS_BEFORE_SPLIT
        ):

            text_chunks = [
                text
            ]

        else:

            text_chunks = split_into_chunks(
                text,
                chunk_size=
                    CHUNK_SIZE_WORDS,

                overlap=
                    CHUNK_OVERLAP_WORDS
            )


        for chunk_number, chunk_text in enumerate(
            text_chunks,
            start=1
        ):

            safe_code = (
                esco_code
                .replace(
                    "/",
                    "_"
                )
                .replace(
                    " ",
                    "_"
                )
            )


            if not safe_code:

                safe_code = (
                    occupation_uri
                    .rstrip("/")
                    .split("/")[-1]
                )


            chunk_id = (
                f"ESCO_"
                f"{safe_code}_"
                f"CH{chunk_number:02d}"
            )


            output.append(
                {
                    "chunk_id":
                        chunk_id,

                    "record_type":
                        "esco_occupation",

                    "corpus_id":
                        "C001",

                    "source_id":
                        "SRC002",

                    "source":
                        "European Commission - ESCO",

                    "title":
                        occupation_name,

                    "knowledge_domain":
                        "Occupational information",

                    "source_url":
                        occupation_uri,

                    "freshness_or_validity":
                        "ESCO v1.2.1",

                    "language":
                        "en",

                    "occupation_uri":
                        occupation_uri,

                    "occupation_name":
                        occupation_name,

                    "esco_code":
                        esco_code,

                    "isco_group":
                        isco_group,

                    "chunk_number":
                        chunk_number,

                    "word_count":
                        word_count(
                            chunk_text
                        ),

                    "text":
                        chunk_text,
                }
            )


    print(
        "ESCO chunks created:",
        len(output)
    )


    return output


# ============================================================
# SAVE JSONL
# ============================================================

def save_jsonl(
    records,
    path
):

    with open(
        path,
        "w",
        encoding="utf-8"
    ) as f:

        for record in records:

            f.write(
                json.dumps(
                    record,
                    ensure_ascii=False
                )
                +
                "\n"
            )


# ============================================================
# SAVE CHUNK STATISTICS
# ============================================================

def save_stats(
    records
):

    stats = {}


    for record in records:

        corpus_id = (
            record.get(
                "corpus_id",
                ""
            )
        )

        title = (
            record.get(
                "title",
                ""
            )
        )

        source = (
            record.get(
                "source",
                ""
            )
        )

        domain = (
            record.get(
                "knowledge_domain",
                ""
            )
        )


        key = (
            corpus_id,
            source,
            domain,
        )


        if key not in stats:

            stats[key] = {
                "corpus_id":
                    corpus_id,

                "source":
                    source,

                "knowledge_domain":
                    domain,

                "chunk_count":
                    0,

                "total_words":
                    0,
            }


        stats[key][
            "chunk_count"
        ] += 1


        stats[key][
            "total_words"
        ] += int(
            record.get(
                "word_count",
                0
            )
        )


    rows = list(
        stats.values()
    )


    for row in rows:

        if row[
            "chunk_count"
        ]:

            row[
                "mean_words_per_chunk"
            ] = round(
                row[
                    "total_words"
                ]
                /
                row[
                    "chunk_count"
                ],
                2
            )

        else:

            row[
                "mean_words_per_chunk"
            ] = 0


    fieldnames = [

        "corpus_id",
        "source",
        "knowledge_domain",
        "chunk_count",
        "total_words",
        "mean_words_per_chunk",
    ]


    with open(
        OUTPUT_STATS,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=
                fieldnames
        )

        writer.writeheader()

        writer.writerows(
            rows
        )


# ============================================================
# MAIN
# ============================================================

def main():

    if not DOCUMENTS_PATH.exists():

        raise FileNotFoundError(
            f"Missing: {DOCUMENTS_PATH}"
        )


    if not ESCO_PATH.exists():

        raise FileNotFoundError(
            f"Missing: {ESCO_PATH}"
        )


    document_chunks = (
        build_document_chunks()
    )


    esco_chunks = (
        build_esco_chunks()
    )


    all_chunks = (
        document_chunks
        +
        esco_chunks
    )


    save_jsonl(
        all_chunks,
        OUTPUT_JSONL
    )


    save_stats(
        all_chunks
    )


    # --------------------------------------------------------
    # Validation summary
    # --------------------------------------------------------

    total_words = sum(
        record.get(
            "word_count",
            0
        )
        for record in all_chunks
    )


    max_words = max(
        (
            record.get(
                "word_count",
                0
            )
            for record in all_chunks
        ),
        default=0
    )


    min_words = min(
        (
            record.get(
                "word_count",
                0
            )
            for record in all_chunks
        ),
        default=0
    )


    print()
    print(
        "======================================"
    )

    print(
        "CORPUS V1 CHUNKING COMPLETE"
    )

    print(
        "======================================"
    )

    print(
        "Total chunks:",
        len(all_chunks)
    )

    print(
        "Document chunks:",
        len(document_chunks)
    )

    print(
        "ESCO chunks:",
        len(esco_chunks)
    )

    print(
        "Total words:",
        total_words
    )

    print(
        "Min words in chunk:",
        min_words
    )

    print(
        "Max words in chunk:",
        max_words
    )

    print()

    print(
        "Output JSONL:",
        OUTPUT_JSONL
    )

    print(
        "Chunk statistics:",
        OUTPUT_STATS
    )


if __name__ == "__main__":

    main()