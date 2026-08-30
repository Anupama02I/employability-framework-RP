import hashlib
import json
import re
from pathlib import Path

import pandas as pd
from pypdf import PdfReader
from bs4 import BeautifulSoup


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

RAW_DOCUMENTS_DIR = BASE_DIR / "raw" / "documents"
PROCESSED_DIR = BASE_DIR / "processed"

MANIFEST_PATH = BASE_DIR / "corpus_v1_manifest.csv"

OUTPUT_INVENTORY = PROCESSED_DIR / "corpus_v1_inventory.csv"
OUTPUT_JSONL = PROCESSED_DIR / "corpus_v1_documents.jsonl"

PROCESSED_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# HELPERS
# ============================================================

def sha256_file(path: Path):

    sha = hashlib.sha256()

    with open(path, "rb") as f:

        for chunk in iter(
            lambda: f.read(1024 * 1024),
            b""
        ):

            sha.update(chunk)

    return sha.hexdigest()


def clean_text(text):

    if not text:
        return ""

    text = text.replace("\x00", " ")

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    text = re.sub(
        r"\n\s*\n\s*\n+",
        "\n\n",
        text
    )

    return text.strip()


def extract_pdf_text(path: Path):

    reader = PdfReader(
        str(path)
    )

    pages = []

    for page_number, page in enumerate(
        reader.pages,
        start=1
    ):

        try:

            text = page.extract_text() or ""

        except Exception:

            text = ""

        text = clean_text(
            text
        )

        if text:

            pages.append(
                {
                    "page_number":
                        page_number,

                    "text":
                        text,
                }
            )

    return pages


def extract_html_text(path: Path):

    html = path.read_text(
        encoding="utf-8",
        errors="ignore"
    )

    soup = BeautifulSoup(
        html,
        "html.parser"
    )


    # Remove obvious webpage noise.

    for tag_name in [
        "script",
        "style",
        "noscript",
        "svg",
        "nav",
        "footer",
        "header",
    ]:

        for tag in soup.find_all(
            tag_name
        ):

            tag.decompose()


    text = soup.get_text(
        "\n"
    )

    text = clean_text(
        text
    )

    return [
        {
            "page_number":
                None,

            "text":
                text,
        }
    ]


# ============================================================
# FIND FILE FOR A MANIFEST RECORD
# ============================================================

# ============================================================
# ACTUAL LOCAL FILENAMES
#
# Maps each Corpus V1 record to the filename you actually
# downloaded/saved inside raw/documents/.
# ============================================================

LOCAL_FILE_MAP = {

    # CareerOne Portfolio Guide
    "C002":
        "Guidelines-for-Portfolio-Preparing.pdf",

    # TVEC NVQ Operational Manual
    "C003":
        "NVQ Operational Manual-2021.pdf",

    # NAITA RPL saved webpage
    "C004":
        "NAITA - National Apprentice and Industrial Training Authority.html",

    # UGC Admissions Handbook
    "C005":
        "student_handbook_english.pdf",

    # ILO - How to Support a Jobseeker?
    "C006":
        "wcms_882743.pdf",

    # ILO - Guiding Youth Careers
    "C007":
        "wcms_154445.pdf",

    # DCS Annual Bulletin 2025
    "C008":
        "LFS_Annual Bulletin_2025.pdf",

    # DCS Q1 2026
    "C009":
        "1stQuarter2026.pdf",

    # Ministry of Labour report
    "C010":
        "3.MinistryofLabour_E-compressed.pdf",

    # NYSC Technical & Vocational Training Division
    "C011":
        "Youth Council __ Sri Lanka.html",

    # NYSC Training Centres
    "C012":
        "Centers National Youth Council Sri Lanka.html",

    # NYSC Examination & Assessment Division
    #
    # Change this if your actual saved filename is different.
    "C013":
        "NYSC Examination and Assessment Division.html",
}


def find_local_file(
    corpus_id,
    expected_path
):

    # --------------------------------------------------------
    # First use the explicit mapping above.
    # --------------------------------------------------------

    mapped_name = (
        LOCAL_FILE_MAP.get(
            corpus_id
        )
    )

    if mapped_name:

        mapped_path = (
            RAW_DOCUMENTS_DIR
            / mapped_name
        )

        if mapped_path.exists():

            return mapped_path


    # --------------------------------------------------------
    # Fallback:
    # try filename recorded in the manifest.
    # --------------------------------------------------------

    if expected_path:

        expected_name = Path(
            expected_path
        ).name

        direct_path = (
            RAW_DOCUMENTS_DIR
            / expected_name
        )

        if direct_path.exists():

            return direct_path


    return None


# ============================================================
# LOAD MANIFEST
# ============================================================

manifest = pd.read_csv(
    MANIFEST_PATH
)


print(
    "Manifest rows:",
    len(manifest)
)


# ============================================================
# ESCO RECORD
#
# ESCO has already been processed separately.
# We validate its processed JSONL but do not try to treat
# it as a normal PDF/HTML document here.
# ============================================================

esco_path = (
    PROCESSED_DIR
    / "esco_occupation_profiles.jsonl"
)


if not esco_path.exists():

    raise FileNotFoundError(
        "Missing processed ESCO file: "
        f"{esco_path}"
    )


print(
    "ESCO processed file found:",
    esco_path.name
)


# ============================================================
# PROCESS DOCUMENT CORPUS
# ============================================================

inventory_rows = []
document_records = []


for _, row in manifest.iterrows():

    corpus_id = str(
        row.get(
            "corpus_id",
            ""
        )
    ).strip()


    source_id = str(
        row.get(
            "source_id",
            ""
        )
    ).strip()


    title = str(
        row.get(
            "title",
            ""
        )
    ).strip()


    organization = str(
        row.get(
            "organization",
            ""
        )
    ).strip()


    knowledge_domain = str(
        row.get(
            "knowledge_domain",
            ""
        )
    ).strip()


    source_url = str(
        row.get(
            "source_url",
            ""
        )
    ).strip()


    planned_path = str(
        row.get(
            "planned_local_or_processed_path",
            ""
        )
    ).strip()


    freshness_or_validity = str(
        row.get(
            "freshness_or_validity",
            ""
        )
    ).strip()


    # --------------------------------------------------------
    # ESCO is already handled separately.
    # --------------------------------------------------------

    if (
        "esco_occupation_profiles.jsonl"
        in planned_path
    ):

        inventory_rows.append(
            {
                "corpus_id":
                    corpus_id,

                "source_id":
                    source_id,

                "title":
                    title,

                "organization":
                    organization,

                "knowledge_domain":
                    knowledge_domain,

                "local_filename":
                    esco_path.name,

                "file_type":
                    ".jsonl",

                "file_size_bytes":
                    esco_path.stat().st_size,

                "sha256":
                    sha256_file(
                        esco_path
                    ),

                "extraction_status":
                    "ESCO_ALREADY_PROCESSED",

                "text_unit_count":
                    3039,
            }
        )

        continue


    # --------------------------------------------------------
    # Normal PDF / HTML documents
    # --------------------------------------------------------

    local_file = (
        find_local_file(
            corpus_id,
            planned_path
        )
    )


    if local_file is None:

        inventory_rows.append(
            {
                "corpus_id":
                    corpus_id,

                "source_id":
                    source_id,

                "title":
                    title,

                "organization":
                    organization,

                "knowledge_domain":
                    knowledge_domain,

                "local_filename":
                    "",

                "file_type":
                    "",

                "file_size_bytes":
                    None,

                "sha256":
                    "",

                "extraction_status":
                    "FILE_NOT_FOUND",

                "text_unit_count":
                    0,
            }
        )

        print(
            f"[MISSING] {corpus_id} - "
            f"{Path(planned_path).name}"
        )

        continue


    suffix = (
        local_file.suffix.lower()
    )


    try:

        if suffix == ".pdf":

            text_units = (
                extract_pdf_text(
                    local_file
                )
            )


        elif suffix in [
            ".html",
            ".htm",
        ]:

            text_units = (
                extract_html_text(
                    local_file
                )
            )


        else:

            print(
                f"[SKIP] Unsupported file type: "
                f"{local_file.name}"
            )

            text_units = []


        status = (
            "OK"
            if text_units
            else
            "NO_TEXT_EXTRACTED"
        )


    except Exception as error:

        print(
            f"[ERROR] {local_file.name}: "
            f"{error}"
        )

        text_units = []

        status = "EXTRACTION_ERROR"


    file_hash = (
        sha256_file(
            local_file
        )
    )


    inventory_rows.append(
        {
            "corpus_id":
                corpus_id,

            "source_id":
                source_id,

            "title":
                title,

            "organization":
                organization,

            "knowledge_domain":
                knowledge_domain,

            "local_filename":
                local_file.name,

            "file_type":
                suffix,

            "file_size_bytes":
                local_file.stat().st_size,

            "sha256":
                file_hash,

            "extraction_status":
                status,

            "text_unit_count":
                len(
                    text_units
                ),
        }
    )


    # --------------------------------------------------------
    # Save extracted text records
    # --------------------------------------------------------

    for unit in text_units:

        document_records.append(
            {
                "corpus_id":
                    corpus_id,

                "source_id":
                    source_id,

                "title":
                    title,

                "organization":
                    organization,

                "knowledge_domain":
                    knowledge_domain,

                "source_url":
                    source_url,

                "freshness_or_validity":
                    freshness_or_validity,

                "local_filename":
                    local_file.name,

                "sha256":
                    file_hash,

                "page_number":
                    unit[
                        "page_number"
                    ],

                "text":
                    unit[
                        "text"
                    ],
            }
        )


# ============================================================
# SAVE INVENTORY
# ============================================================

inventory_df = pd.DataFrame(
    inventory_rows
)


inventory_df.to_csv(
    OUTPUT_INVENTORY,
    index=False,
    encoding="utf-8-sig"
)


# ============================================================
# SAVE EXTRACTED DOCUMENTS
# ============================================================

with open(
    OUTPUT_JSONL,
    "w",
    encoding="utf-8"
) as f:

    for record in document_records:

        f.write(
            json.dumps(
                record,
                ensure_ascii=False
            )
            +
            "\n"
        )


# ============================================================
# SUMMARY
# ============================================================

print()
print(
    "Corpus preparation complete."
)

print(
    "Inventory:",
    OUTPUT_INVENTORY
)

print(
    "Extracted document JSONL:",
    OUTPUT_JSONL
)

print()


print(
    inventory_df[
        [
            "corpus_id",
            "local_filename",
            "extraction_status",
            "text_unit_count",
        ]
    ].to_string(
        index=False
    )
)