"""
Final chatbot evaluation runner
================================

Run this file from the BACKEND directory, for example:

    (venv) PS C:\Anupama\employability_framework\backend> python evaluation/final_chatbot_evaluation/run_final_chatbot_evaluation.py

What it does
------------
1. Loads chatbot_final_evaluation_run_manifest.json.
2. Uploads/caches the four fixed sanitized evaluation documents.
3. Uses the exact P01-P10 profiles stored in the manifest.
4. Calls the live FastAPI /chat endpoint for FE001-FE036.
5. Uses the deployed chat-service intent/RAG routing functions to capture:
   - actual detected intent
   - whether RAG was actually used
   - top-3 retrieved evidence
6. Saves a checkpoint after EVERY case so the run can be resumed.

Important
---------
- Start the FastAPI backend before running this script.
- Run this script from the backend directory so `app...` imports resolve.
- Keep the final chatbot implementation frozen during the run.
- The default delay is deliberately conservative because the Groq on-demand
  tier has a TPM limit. You can change --delay, but reducing it too far may
  cause 413/rate-limit fallbacks.
"""

from __future__ import annotations

import argparse
import csv
import inspect
import json
import sys
import time
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests


# ============================================================
# CONFIGURATION
# ============================================================

BASE_URL = "http://127.0.0.1:8000"

DEFAULT_DELAY_SECONDS = 65

THIS_FILE = Path(__file__).resolve()
EVAL_DIR = THIS_FILE.parent

MANIFEST_PATH = (
    EVAL_DIR
    / "chatbot_final_evaluation_run_manifest.json"
)

CASES_PATH = (
    EVAL_DIR
    / "chatbot_final_evaluation_cases_mapped.csv"
)

DOCUMENTS_DIR = (
    EVAL_DIR
    / "documents"
)

DOCUMENT_CACHE_PATH = (
    EVAL_DIR
    / "document_context_cache.json"
)

RESULTS_PATH = (
    EVAL_DIR
    / "chatbot_final_evaluation_results.csv"
)

RESULTS_JSON_PATH = (
    EVAL_DIR
    / "chatbot_final_evaluation_results.json"
)


DOCUMENT_FILES = {
    "D_CV01":
        DOCUMENTS_DIR / "D_CV01.docx",

    "D_JOB01":
        DOCUMENTS_DIR / "D_JOB01.docx",

    "D_COURSE01":
        DOCUMENTS_DIR / "D_COURSE01.docx",

    "D_EMP01":
        DOCUMENTS_DIR / "D_EMP01.docx",
}


# ============================================================
# IMPORT DEPLOYED ROUTING / RAG LOGIC
# ============================================================

try:
    from app.services.chat_service import (
        detect_user_intent,
        get_optional_rag_context,
    )

except Exception as error:
    print(
        "\nERROR: Could not import the deployed chat service.\n"
        "Run this script from your backend directory, e.g.\n\n"
        "  (venv) PS C:\\Anupama\\employability_framework\\backend> "
        "python evaluation\\final_chatbot_evaluation\\"
        "run_final_chatbot_evaluation.py\n\n"
        f"Import error: {error}\n"
    )
    sys.exit(1)


# ============================================================
# HELPERS
# ============================================================

def load_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(
            f"Required file not found: {path}"
        )

    with path.open(
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


def load_cases_csv(
    path: Path
) -> Dict[str, Dict[str, str]]:

    if not path.exists():
        raise FileNotFoundError(
            f"Required file not found: {path}"
        )

    with path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:

        rows = list(
            csv.DictReader(file)
        )

    return {
        row["case_id"]: row
        for row in rows
    }


def load_existing_results() -> Dict[str, Dict[str, Any]]:

    if not RESULTS_JSON_PATH.exists():
        return {}

    try:
        with RESULTS_JSON_PATH.open(
            "r",
            encoding="utf-8",
        ) as file:

            rows = json.load(file)

        return {
            row["case_id"]: row
            for row in rows
            if row.get("case_id")
        }

    except Exception:
        return {}


def save_results(
    result_map: Dict[str, Dict[str, Any]]
) -> None:

    ordered_rows = sorted(
        result_map.values(),
        key=lambda row:
            row["case_id"],
    )

    with RESULTS_JSON_PATH.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            ordered_rows,
            file,
            ensure_ascii=False,
            indent=2,
        )

    fields = [
        "case_id",
        "evaluation_area",
        "subtype",
        "language",
        "selected_language_override",
        "profile_id",
        "document_fixture_id",
        "user_message",

        "expected_intent",
        "actual_intent",
        "intent_match",

        "expected_rag",
        "actual_rag_used",
        "actual_rag_retrieved_count",
        "rag_match",

        "uploaded_document_type",
        "actual_uploaded_document_type",

        "http_status",
        "chatbot_response",

        "retrieved_evidence_1",
        "retrieved_evidence_2",
        "retrieved_evidence_3",

        "run_status",
        "run_error",
    ]

    with RESULTS_PATH.open(
        "w",
        encoding="utf-8-sig",
        newline="",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fields,
        )

        writer.writeheader()

        for row in ordered_rows:

            csv_row = {
                key: row.get(
                    key,
                    ""
                )
                for key in fields
            }

            writer.writerow(
                csv_row
            )


def normalize_document_type(
    uploaded_document: Optional[
        Dict[str, Any]
    ]
) -> str:

    if not uploaded_document:
        return "NONE"

    value = uploaded_document.get(
        "document_type",
        "NONE",
    )

    if isinstance(value, dict):
        value = value.get(
            "value",
            str(value),
        )

    return str(value)


def compact_evidence(
    chunk: Dict[str, Any]
) -> str:

    """
    Preserve the information human evaluators need while
    avoiding unnecessary internal retrieval metadata.
    """

    parts: List[str] = []

    title = (
        chunk.get("title")
        or ""
    ).strip()

    source = (
        chunk.get("source")
        or ""
    ).strip()

    page = chunk.get(
        "page_number"
    )

    validity = (
        chunk.get(
            "freshness_or_validity"
        )
        or ""
    ).strip()

    occupation = (
        chunk.get(
            "occupation_name"
        )
        or ""
    ).strip()

    text = (
        chunk.get("text")
        or ""
    ).strip()

    if source:
        parts.append(
            f"Source: {source}"
        )

    if title:
        parts.append(
            f"Title: {title}"
        )

    if (
        page is not None
        and
        page != -1
        and
        str(page).strip()
    ):
        parts.append(
            f"Page: {page}"
        )

    if validity:
        parts.append(
            "Validity/reporting period: "
            f"{validity}"
        )

    if occupation:
        parts.append(
            f"Occupation: {occupation}"
        )

    if text:
        parts.append(
            f"Evidence: {text}"
        )

    return "\n".join(
        parts
    )


# ============================================================
# DOCUMENT UPLOAD / CACHE
# ============================================================

def load_document_cache() -> Dict[str, Any]:

    if not DOCUMENT_CACHE_PATH.exists():
        return {}

    try:
        return load_json(
            DOCUMENT_CACHE_PATH
        )

    except Exception:
        return {}


def save_document_cache(
    cache: Dict[str, Any]
) -> None:

    with DOCUMENT_CACHE_PATH.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            cache,
            file,
            ensure_ascii=False,
            indent=2,
        )


def upload_document(
    fixture_id: str
) -> Dict[str, Any]:

    path = DOCUMENT_FILES[
        fixture_id
    ]

    if not path.exists():
        raise FileNotFoundError(
            f"{fixture_id} not found: {path}"
        )

    print(
        f"Uploading {fixture_id}: "
        f"{path.name}"
    )

    with path.open(
        "rb"
    ) as file:

        response = requests.post(
            f"{BASE_URL}/document/upload",
            files={
                "file": (
                    path.name,
                    file,
                    "application/vnd.openxmlformats-"
                    "officedocument.wordprocessingml.document",
                )
            },
            timeout=180,
        )

    if not response.ok:
        raise RuntimeError(
            f"Document upload failed "
            f"for {fixture_id}.\n"
            f"HTTP {response.status_code}\n"
            f"{response.text}"
        )

    payload = response.json()

    document = payload.get(
        "document"
    )

    if not document:
        raise RuntimeError(
            f"No document context returned "
            f"for {fixture_id}."
        )

    print(
        f"  classified as: "
        f"{normalize_document_type(document)}"
    )

    return document


def prepare_document_cache(
    delay_seconds: int
) -> Dict[str, Any]:

    cache = load_document_cache()

    missing = [
        fixture_id
        for fixture_id
        in DOCUMENT_FILES
        if fixture_id not in cache
    ]

    if not missing:

        print(
            "Document cache already contains "
            "all four fixtures."
        )

        return cache

    print(
        "\nPreparing fixed document contexts..."
    )

    for index, fixture_id in enumerate(
        missing
    ):

        document = upload_document(
            fixture_id
        )

        cache[
            fixture_id
        ] = document

        save_document_cache(
            cache
        )

        if index < len(missing) - 1:

            print(
                f"Waiting {delay_seconds}s "
                "before next Groq-dependent upload..."
            )

            time.sleep(
                delay_seconds
            )

    return cache


# ============================================================
# ACTUAL DEPLOYED RAG ROUTING
# ============================================================

def get_actual_rag_info(
    message: str,
    actual_intent: str,
    uploaded_document: Optional[
        Dict[str, Any]
    ],
) -> Dict[str, Any]:

    """
    Call the deployed get_optional_rag_context() directly.

    Current project versions may accept either:
      (message, detected_intent)
    or:
      (message, detected_intent, uploaded_document)

    This runner supports both without modifying the chatbot.
    """

    signature = inspect.signature(
        get_optional_rag_context
    )

    kwargs: Dict[str, Any] = {
        "message":
            message,

        "detected_intent":
            actual_intent,
    }

    if (
        "uploaded_document"
        in signature.parameters
    ):
        kwargs[
            "uploaded_document"
        ] = uploaded_document

    return get_optional_rag_context(
        **kwargs
    )


# ============================================================
# CHAT API
# ============================================================

def call_chat(
    message: str,
    profile: Dict[str, Any],
    uploaded_document: Optional[
        Dict[str, Any]
    ],
) -> tuple[int, str]:

    payload = {
        "message":
            message,

        "employabilityProfile":
            profile,

        "conversationHistory":
            [],

        "uploadedDocument":
            uploaded_document,
    }

    response = requests.post(
        f"{BASE_URL}/chat",
        json=payload,
        timeout=180,
    )

    if not response.ok:
        raise RuntimeError(
            f"/chat failed.\n"
            f"HTTP {response.status_code}\n"
            f"{response.text}"
        )

    data = response.json()

    reply = (
        data.get("reply")
        or ""
    ).strip()

    if not reply:
        raise RuntimeError(
            "/chat returned an empty reply."
        )

    return (
        response.status_code,
        reply,
    )


# ============================================================
# CASE EXECUTION
# ============================================================

def expected_rag_bool(
    value: str
) -> bool:

    return (
        str(value)
        .strip()
        .lower()
        in {
            "yes",
            "true",
            "1",
        }
    )


def run_case(
    manifest_case: Dict[str, Any],
    case_info: Dict[str, str],
    document_cache: Dict[str, Any],
) -> Dict[str, Any]:

    case_id = manifest_case[
        "case_id"
    ]

    message = manifest_case[
        "user_message"
    ]

    profile = deepcopy(
        manifest_case[
            "employabilityProfile"
        ]
    )

    fixture_id = (
        case_info.get(
            "document_fixture_id"
        )
        or ""
    ).strip()

    # FE036 explicitly evaluates behavior AFTER a document
    # has been removed, so no uploaded document is passed.
    if case_id == "FE036":

        uploaded_document = None

    elif fixture_id:

        uploaded_document = (
            document_cache.get(
                fixture_id
            )
        )

        if uploaded_document is None:

            raise RuntimeError(
                f"Missing cached document "
                f"for {fixture_id}."
            )

    else:

        uploaded_document = None

    actual_intent = (
        detect_user_intent(
            message,
            []
        )
    )

    rag_info = (
        get_actual_rag_info(
            message=
                message,

            actual_intent=
                actual_intent,

            uploaded_document=
                uploaded_document,
        )
    )

    actual_rag_used = bool(
        rag_info.get(
            "used",
            False
        )
    )

    chunks = (
        rag_info.get(
            "chunks",
            []
        )
        or []
    )

    evidence = [
        compact_evidence(
            chunk
        )
        for chunk in chunks[:3]
    ]

    while len(evidence) < 3:
        evidence.append("")

    http_status, reply = (
        call_chat(
            message=
                message,

            profile=
                profile,

            uploaded_document=
                uploaded_document,
        )
    )

    expected_rag = expected_rag_bool(
        case_info.get(
            "expected_rag",
            ""
        )
    )

    actual_doc_type = (
        normalize_document_type(
            uploaded_document
        )
    )

    return {
        "case_id":
            case_id,

        "evaluation_area":
            case_info.get(
                "evaluation_area",
                ""
            ),

        "subtype":
            case_info.get(
                "subtype",
                ""
            ),

        "language":
            case_info.get(
                "language",
                ""
            ),

        "selected_language_override":
            case_info.get(
                "selected_language_override",
                profile.get(
                    "selectedLanguage",
                    ""
                )
            ),

        "profile_id":
            manifest_case.get(
                "profile_id",
                ""
            ),

        "document_fixture_id":
            fixture_id,

        "user_message":
            message,

        "expected_intent":
            case_info.get(
                "expected_intent",
                ""
            ),

        "actual_intent":
            actual_intent,

        "intent_match":
            (
                actual_intent
                ==
                case_info.get(
                    "expected_intent",
                    ""
                )
            ),

        "expected_rag":
            case_info.get(
                "expected_rag",
                ""
            ),

        "actual_rag_used":
            actual_rag_used,

        "actual_rag_retrieved_count":
            rag_info.get(
                "retrieved_count",
                0
            ),

        "rag_match":
            (
                actual_rag_used
                ==
                expected_rag
            ),

        "uploaded_document_type":
            case_info.get(
                "uploaded_document_type",
                ""
            ),

        "actual_uploaded_document_type":
            actual_doc_type,

        "http_status":
            http_status,

        "chatbot_response":
            reply,

        "retrieved_evidence_1":
            evidence[0],

        "retrieved_evidence_2":
            evidence[1],

        "retrieved_evidence_3":
            evidence[2],

        "run_status":
            "COMPLETED",

        "run_error":
            "",
    }


# ============================================================
# CASE SELECTION
# ============================================================

def select_cases(
    manifest_cases: List[
        Dict[str, Any]
    ],
    requested_cases: Optional[str],
    start_case: Optional[str],
    end_case: Optional[str],
) -> List[Dict[str, Any]]:

    selected = manifest_cases

    if requested_cases:

        wanted = {
            item.strip().upper()
            for item
            in requested_cases.split(",")
            if item.strip()
        }

        selected = [
            item
            for item
            in selected
            if item["case_id"].upper()
            in wanted
        ]

    if start_case:

        start_case = (
            start_case.upper()
        )

        selected = [
            item
            for item
            in selected
            if item["case_id"].upper()
            >= start_case
        ]

    if end_case:

        end_case = (
            end_case.upper()
        )

        selected = [
            item
            for item
            in selected
            if item["case_id"].upper()
            <= end_case
        ]

    return selected


# ============================================================
# MAIN
# ============================================================

def main() -> None:

    parser = argparse.ArgumentParser(
        description=(
            "Run the fixed FE001-FE036 "
            "chatbot evaluation."
        )
    )

    parser.add_argument(
        "--delay",
        type=int,
        default=DEFAULT_DELAY_SECONDS,
        help=(
            "Seconds between Groq-dependent calls "
            f"(default: {DEFAULT_DELAY_SECONDS})."
        ),
    )

    parser.add_argument(
        "--cases",
        type=str,
        default=None,
        help=(
            "Comma-separated case IDs, e.g. "
            "FE001,FE002,FE009."
        ),
    )

    parser.add_argument(
        "--start",
        type=str,
        default=None,
        help="First case ID to run.",
    )

    parser.add_argument(
        "--end",
        type=str,
        default=None,
        help="Last case ID to run.",
    )

    parser.add_argument(
        "--rerun",
        action="store_true",
        help=(
            "Run selected cases again even if a "
            "completed checkpoint already exists."
        ),
    )

    parser.add_argument(
        "--prepare-documents-only",
        action="store_true",
        help=(
            "Only upload/cache the four fixed "
            "document fixtures, then stop."
        ),
    )

    args = parser.parse_args()

    manifest = load_json(
        MANIFEST_PATH
    )

    cases_by_id = load_cases_csv(
        CASES_PATH
    )

    print(
        "\n============================================"
    )
    print(
        "FINAL CHATBOT EVALUATION"
    )
    print(
        "============================================"
    )
    print(
        f"Manifest: {MANIFEST_PATH.name}"
    )
    print(
        f"Cases:    {CASES_PATH.name}"
    )
    print(
        f"Delay:    {args.delay}s"
    )

    document_cache = (
        prepare_document_cache(
            delay_seconds=
                args.delay
        )
    )

    if args.prepare_documents_only:

        print(
            "\nDocument preparation complete."
        )
        return

    selected_cases = (
        select_cases(
            manifest_cases=
                manifest["cases"],

            requested_cases=
                args.cases,

            start_case=
                args.start,

            end_case=
                args.end,
        )
    )

    if not selected_cases:
        print(
            "No cases selected."
        )
        return

    result_map = (
        load_existing_results()
    )

    completed_count = 0
    failed_count = 0

    print(
        f"\nSelected cases: "
        f"{len(selected_cases)}"
    )

    for index, manifest_case in enumerate(
        selected_cases,
        start=1,
    ):

        case_id = manifest_case[
            "case_id"
        ]

        existing = result_map.get(
            case_id
        )

        if (
            existing
            and
            existing.get(
                "run_status"
            )
            ==
            "COMPLETED"
            and
            not args.rerun
        ):

            print(
                f"\n[{index}/{len(selected_cases)}] "
                f"{case_id} already completed - skipped."
            )

            continue

        case_info = cases_by_id.get(
            case_id
        )

        if not case_info:
            print(
                f"\n{case_id}: missing from "
                f"{CASES_PATH.name}"
            )
            failed_count += 1
            continue

        print(
            "\n--------------------------------------------"
        )
        print(
            f"[{index}/{len(selected_cases)}] "
            f"Running {case_id}"
        )
        print(
            f"Profile: "
            f"{manifest_case.get('profile_id')}"
        )
        print(
            f"Language: "
            f"{case_info.get('language')}"
        )
        print(
            f"Question: "
            f"{manifest_case.get('user_message')}"
        )

        try:

            result = run_case(
                manifest_case=
                    manifest_case,

                case_info=
                    case_info,

                document_cache=
                    document_cache,
            )

            result_map[
                case_id
            ] = result

            save_results(
                result_map
            )

            completed_count += 1

            print(
                f"Actual intent: "
                f"{result['actual_intent']}"
            )
            print(
                f"RAG used: "
                f"{result['actual_rag_used']} | "
                f"Retrieved: "
                f"{result['actual_rag_retrieved_count']}"
            )
            print(
                f"HTTP: "
                f"{result['http_status']}"
            )
            print(
                "Saved checkpoint."
            )

        except Exception as error:

            failed_count += 1

            result_map[
                case_id
            ] = {
                "case_id":
                    case_id,

                "evaluation_area":
                    case_info.get(
                        "evaluation_area",
                        ""
                    ),

                "subtype":
                    case_info.get(
                        "subtype",
                        ""
                    ),

                "language":
                    case_info.get(
                        "language",
                        ""
                    ),

                "selected_language_override":
                    case_info.get(
                        "selected_language_override",
                        ""
                    ),

                "profile_id":
                    manifest_case.get(
                        "profile_id",
                        ""
                    ),

                "document_fixture_id":
                    case_info.get(
                        "document_fixture_id",
                        ""
                    ),

                "user_message":
                    manifest_case.get(
                        "user_message",
                        ""
                    ),

                "expected_intent":
                    case_info.get(
                        "expected_intent",
                        ""
                    ),

                "actual_intent":
                    "",

                "intent_match":
                    "",

                "expected_rag":
                    case_info.get(
                        "expected_rag",
                        ""
                    ),

                "actual_rag_used":
                    "",

                "actual_rag_retrieved_count":
                    "",

                "rag_match":
                    "",

                "uploaded_document_type":
                    case_info.get(
                        "uploaded_document_type",
                        ""
                    ),

                "actual_uploaded_document_type":
                    "",

                "http_status":
                    "",

                "chatbot_response":
                    "",

                "retrieved_evidence_1":
                    "",

                "retrieved_evidence_2":
                    "",

                "retrieved_evidence_3":
                    "",

                "run_status":
                    "ERROR",

                "run_error":
                    str(error),
            }

            save_results(
                result_map
            )

            print(
                f"ERROR in {case_id}: "
                f"{error}"
            )
            print(
                "Error checkpoint saved. "
                "The next run can retry it."
            )

        # Wait between chat cases to avoid Groq TPM issues.
        if index < len(selected_cases):

            print(
                f"Waiting {args.delay}s "
                "before next case..."
            )

            time.sleep(
                args.delay
            )

    print(
        "\n============================================"
    )
    print(
        "RUN FINISHED"
    )
    print(
        "============================================"
    )
    print(
        f"Completed this run: "
        f"{completed_count}"
    )
    print(
        f"Errors this run:    "
        f"{failed_count}"
    )
    print(
        f"CSV results:  "
        f"{RESULTS_PATH}"
    )
    print(
        f"JSON results: "
        f"{RESULTS_JSON_PATH}"
    )
    print(
        "\nDo not edit chatbot behavior based on "
        "individual answers before completing the "
        "full fixed evaluation."
    )


if __name__ == "__main__":
    main()
