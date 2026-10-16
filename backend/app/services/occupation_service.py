import json
from pathlib import Path


# ============================================================
# PATHS
#
# occupation_service.py:
# backend/app/services/occupation_service.py
#
# parents[2]:
# backend/
# ============================================================

BACKEND_DIR = (
    Path(__file__)
    .resolve()
    .parents[2]
)

ESCO_PROFILES_PATH = (
    BACKEND_DIR
    / "knowledge_base"
    / "processed"
    / "esco_occupation_profiles.jsonl"
)


# ============================================================
# CACHE
#
# The ESCO file is loaded only once during runtime.
# ============================================================

_occupation_profiles = None


# ============================================================
# FEATURED OCCUPATIONS
#
# These are shown before the user performs a search.
# They are examples for exploration, NOT recommendations.
# ============================================================

FEATURED_OCCUPATION_NAMES = [
    "software developer",
    "data analyst",
    "business analyst",
    "accountant",
    "graphic designer",
    "civil engineer",
    "electrical engineer",
    "marketing manager",
]


# ============================================================
# LOAD ESCO PROFILES
# ============================================================

def load_occupation_profiles():

    global _occupation_profiles

    if _occupation_profiles is not None:
        return _occupation_profiles


    if not ESCO_PROFILES_PATH.exists():

        raise FileNotFoundError(
            "ESCO occupation profiles file was not found at: "
            f"{ESCO_PROFILES_PATH}"
        )


    profiles = []


    with ESCO_PROFILES_PATH.open(
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            line = line.strip()

            if not line:
                continue


            try:

                profile = json.loads(
                    line
                )

            except json.JSONDecodeError:
                continue


            occupation_name = str(
                profile.get(
                    "occupation_name",
                    ""
                )
            ).strip()


            if not occupation_name:
                continue


            profiles.append(
                profile
            )


    # Stable alphabetical ordering
    profiles.sort(
        key=lambda item:
            str(
                item.get(
                    "occupation_name",
                    ""
                )
            ).lower()
    )


    _occupation_profiles = profiles


    print(
        "ESCO occupation profiles loaded:",
        len(
            _occupation_profiles
        )
    )


    return _occupation_profiles


# ============================================================
# RESPONSE HELPERS
# ============================================================

def occupation_summary(
    profile
):

    essential_skills = (
        profile.get(
            "essential_skills",
            []
        )
        or
        []
    )


    optional_skills = (
        profile.get(
            "optional_skills",
            []
        )
        or
        []
    )


    return {

        "esco_code":
            profile.get(
                "esco_code",
                ""
            ),

        "occupation_name":
            profile.get(
                "occupation_name",
                ""
            ),

        "description":
            profile.get(
                "description",
                ""
            ),

        # Only a few are needed on the card.
        "essential_skills":
            essential_skills[:6],

        "essential_skill_count":
            len(
                essential_skills
            ),

        "optional_skill_count":
            len(
                optional_skills
            ),

        "source":
            "European Commission - ESCO",

        "source_version":
            profile.get(
                "source_version",
                "1.2.1"
            ),
    }


def occupation_details(
    profile
):

    return {

        "esco_code":
            profile.get(
                "esco_code",
                ""
            ),

        "isco_group":
            profile.get(
                "isco_group",
                ""
            ),

        "occupation_name":
            profile.get(
                "occupation_name",
                ""
            ),

        "description":
            profile.get(
                "description",
                ""
            ),

        "alternative_labels":
            profile.get(
                "alternative_labels",
                []
            )
            or
            [],

        "essential_skills":
            profile.get(
                "essential_skills",
                []
            )
            or
            [],

        "optional_skills":
            profile.get(
                "optional_skills",
                []
            )
            or
            [],

        "occupation_uri":
            profile.get(
                "occupation_uri",
                ""
            ),

        "source":
            "European Commission - ESCO",

        "source_version":
            profile.get(
                "source_version",
                "1.2.1"
            ),
    }


# ============================================================
# FEATURED OCCUPATIONS
# ============================================================

def get_featured_occupations(
    limit=6
):

    profiles = (
        load_occupation_profiles()
    )


    selected = []

    selected_codes = set()


    for wanted_name in (
        FEATURED_OCCUPATION_NAMES
    ):

        for profile in profiles:

            occupation_name = str(
                profile.get(
                    "occupation_name",
                    ""
                )
            ).strip().lower()


            if (
                occupation_name
                ==
                wanted_name
            ):

                code = str(
                    profile.get(
                        "esco_code",
                        ""
                    )
                )


                selected.append(
                    occupation_summary(
                        profile
                    )
                )

                selected_codes.add(
                    code
                )

                break


        if len(
            selected
        ) >= limit:

            break


    # Fallback in case one of the selected names
    # does not exist in the ESCO version.
    if len(
        selected
    ) < limit:

        for profile in profiles:

            code = str(
                profile.get(
                    "esco_code",
                    ""
                )
            )


            if code in selected_codes:
                continue


            selected.append(
                occupation_summary(
                    profile
                )
            )


            if len(
                selected
            ) >= limit:

                break


    return selected[:limit]


# ============================================================
# SEARCH
# ============================================================

def search_occupations(
    search="",
    limit=8
):

    profiles = (
        load_occupation_profiles()
    )


    query = str(
        search
        or
        ""
    ).strip().lower()


    if not query:

        return (
            get_featured_occupations(
                limit=limit
            )
        )


    matches = []


    for profile in profiles:

        occupation_name = str(
            profile.get(
                "occupation_name",
                ""
            )
        ).strip()


        occupation_name_lower = (
            occupation_name.lower()
        )


        alternative_labels = (
            profile.get(
                "alternative_labels",
                []
            )
            or
            []
        )


        alternative_labels_lower = [
            str(label).lower()
            for label
            in alternative_labels
        ]


        match_rank = None


        # Exact occupation name
        if (
            occupation_name_lower
            ==
            query
        ):

            match_rank = 0


        # Occupation begins with search
        elif occupation_name_lower.startswith(
            query
        ):

            match_rank = 1


        # Search occurs in occupation title
        elif query in occupation_name_lower:

            match_rank = 2


        # Alternative occupation name
        elif any(
            label == query
            for label
            in alternative_labels_lower
        ):

            match_rank = 3


        elif any(
            label.startswith(
                query
            )
            for label
            in alternative_labels_lower
        ):

            match_rank = 4


        elif any(
            query in label
            for label
            in alternative_labels_lower
        ):

            match_rank = 5


        if match_rank is not None:

            matches.append(
                (
                    match_rank,
                    occupation_name_lower,
                    profile,
                )
            )


    matches.sort(
        key=lambda item: (
            item[0],
            item[1],
        )
    )


    return [
        occupation_summary(
            item[2]
        )
        for item
        in matches[:limit]
    ]


# ============================================================
# DETAILS
# ============================================================

def get_occupation_by_code(
    esco_code
):

    profiles = (
        load_occupation_profiles()
    )


    target_code = str(
        esco_code
        or
        ""
    ).strip()


    for profile in profiles:

        profile_code = str(
            profile.get(
                "esco_code",
                ""
            )
        ).strip()


        if (
            profile_code
            ==
            target_code
        ):

            return (
                occupation_details(
                    profile
                )
            )


    return None