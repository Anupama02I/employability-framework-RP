import json
from pathlib import Path

import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

RAW_DIR = BASE_DIR / "raw" / "esco"
PROCESSED_DIR = BASE_DIR / "processed"

PROCESSED_DIR.mkdir(
    parents=True,
    exist_ok=True
)


OCCUPATIONS_PATH = (
    RAW_DIR
    / "occupations_en.csv"
)

SKILLS_PATH = (
    RAW_DIR
    / "skills_en.csv"
)

RELATIONS_PATH = (
    RAW_DIR
    / "occupationSkillRelations_en.csv"
)


OUTPUT_JSONL = (
    PROCESSED_DIR
    / "esco_occupation_profiles.jsonl"
)

OUTPUT_CSV = (
    PROCESSED_DIR
    / "esco_occupation_profiles.csv"
)


# ============================================================
# LOAD RAW ESCO DATA
# ============================================================

print("Loading ESCO files...")


occupations = pd.read_csv(
    OCCUPATIONS_PATH
)

skills = pd.read_csv(
    SKILLS_PATH
)

relations = pd.read_csv(
    RELATIONS_PATH
)


print(
    "Occupation rows:",
    len(occupations)
)

print(
    "Skill rows:",
    len(skills)
)

print(
    "Occupation-skill relations:",
    len(relations)
)


# ============================================================
# BASIC CLEANING
#
# We are NOT modifying raw files.
# Only the processed representation is cleaned.
# ============================================================

# ESCO contains a few duplicate occupation URIs.
# One unique URI should represent one occupation.

occupations = (
    occupations
    .drop_duplicates(
        subset=["conceptUri"]
    )
    .copy()
)


# Keep released occupation records only.

if "status" in occupations.columns:

    occupations = (
        occupations[
            occupations["status"]
            ==
            "released"
        ]
        .copy()
    )


# Keep only valid essential/optional relationships.

relations = (
    relations[
        relations["relationType"]
        .isin(
            [
                "essential",
                "optional"
            ]
        )
    ]
    .copy()
)


# ============================================================
# HELPER
# ============================================================

def clean_value(value):

    if pd.isna(value):
        return ""

    return str(value).strip()


def unique_preserve_order(values):

    seen = set()
    output = []

    for value in values:

        value = clean_value(
            value
        )

        if not value:
            continue

        key = value.lower()

        if key in seen:
            continue

        seen.add(key)

        output.append(
            value
        )

    return output


# ============================================================
# GROUP ESCO SKILLS BY OCCUPATION
# ============================================================

print(
    "Grouping occupation-skill relationships..."
)


essential_map = (
    relations[
        relations["relationType"]
        ==
        "essential"
    ]
    .groupby(
        "occupationUri"
    )["skillLabel"]
    .apply(
        unique_preserve_order
    )
    .to_dict()
)


optional_map = (
    relations[
        relations["relationType"]
        ==
        "optional"
    ]
    .groupby(
        "occupationUri"
    )["skillLabel"]
    .apply(
        unique_preserve_order
    )
    .to_dict()
)


# ============================================================
# BUILD STANDARDIZED OCCUPATION PROFILES
# ============================================================

profiles = []


for _, row in occupations.iterrows():

    occupation_uri = clean_value(
        row.get(
            "conceptUri"
        )
    )

    occupation_name = clean_value(
        row.get(
            "preferredLabel"
        )
    )

    description = clean_value(
        row.get(
            "description"
        )
    )

    isco_group = clean_value(
        row.get(
            "iscoGroup"
        )
    )

    esco_code = clean_value(
        row.get(
            "code"
        )
    )

    alt_labels_raw = clean_value(
        row.get(
            "altLabels"
        )
    )


    if alt_labels_raw:

        alt_labels = unique_preserve_order(
            alt_labels_raw.splitlines()
        )

    else:

        alt_labels = []


    essential_skills = (
        essential_map.get(
            occupation_uri,
            []
        )
    )

    optional_skills = (
        optional_map.get(
            occupation_uri,
            []
        )
    )


    # --------------------------------------------------------
    # TEXT USED LATER FOR EMBEDDING / RAG
    # --------------------------------------------------------

    text_parts = [

        f"Occupation: {occupation_name}",

        f"ESCO code: {esco_code}",

        f"ISCO group: {isco_group}",
    ]


    if description:

        text_parts.append(
            f"Description: {description}"
        )


    if alt_labels:

        text_parts.append(

            "Alternative occupation names: "
            +
            "; ".join(
                alt_labels
            )
        )


    if essential_skills:

        text_parts.append(

            "Essential skills and knowledge: "
            +
            "; ".join(
                essential_skills
            )
        )


    if optional_skills:

        text_parts.append(

            "Optional skills and knowledge: "
            +
            "; ".join(
                optional_skills
            )
        )


    rag_text = "\n".join(
        text_parts
    )


    profile = {

        "source":
            "ESCO",

        "source_version":
            "1.2.1",

        "language":
            "en",

        "knowledge_domain":
            "occupational_information",

        "occupation_uri":
            occupation_uri,

        "esco_code":
            esco_code,

        "isco_group":
            isco_group,

        "occupation_name":
            occupation_name,

        "description":
            description,

        "alternative_labels":
            alt_labels,

        "essential_skills":
            essential_skills,

        "optional_skills":
            optional_skills,

        "essential_skill_count":
            len(
                essential_skills
            ),

        "optional_skill_count":
            len(
                optional_skills
            ),

        "text":
            rag_text,
    }


    profiles.append(
        profile
    )


# ============================================================
# SAVE JSONL
#
# JSONL is convenient for later embedding.
# ============================================================

print(
    "Saving JSONL..."
)


with open(
    OUTPUT_JSONL,
    "w",
    encoding="utf-8"
) as file:

    for profile in profiles:

        file.write(
            json.dumps(
                profile,
                ensure_ascii=False
            )
            +
            "\n"
        )


# ============================================================
# SAVE CSV
#
# Useful for inspection in Excel / pandas.
# ============================================================

csv_rows = []


for profile in profiles:

    csv_rows.append(

        {

            "occupation_uri":
                profile[
                    "occupation_uri"
                ],

            "esco_code":
                profile[
                    "esco_code"
                ],

            "isco_group":
                profile[
                    "isco_group"
                ],

            "occupation_name":
                profile[
                    "occupation_name"
                ],

            "description":
                profile[
                    "description"
                ],

            "essential_skills":
                " | ".join(
                    profile[
                        "essential_skills"
                    ]
                ),

            "optional_skills":
                " | ".join(
                    profile[
                        "optional_skills"
                    ]
                ),

            "essential_skill_count":
                profile[
                    "essential_skill_count"
                ],

            "optional_skill_count":
                profile[
                    "optional_skill_count"
                ],

            "text":
                profile[
                    "text"
                ],
        }
    )


pd.DataFrame(
    csv_rows
).to_csv(
    OUTPUT_CSV,
    index=False,
    encoding="utf-8-sig"
)


# ============================================================
# SUMMARY
# ============================================================

print()
print(
    "ESCO transformation complete."
)

print(
    "Occupation profiles created:",
    len(profiles)
)

print(
    "JSONL:",
    OUTPUT_JSONL
)

print(
    "CSV:",
    OUTPUT_CSV
)