# backend/app/services/model_service.py

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap


# ============================================================
# LOGGING
# ============================================================

logger = logging.getLogger(__name__)


# ============================================================
# PATHS
# ============================================================

# Current file:
# backend/app/services/model_service.py
#
# parents[2] -> backend/

BACKEND_DIR = Path(__file__).resolve().parents[2]

MODELS_DIR = (
    BACKEND_DIR
    / "models"
)


MODEL_PATH = (
    MODELS_DIR
    / "employability_model_b_random_forest.pkl"
)


METADATA_PATH = (
    MODELS_DIR
    / "employability_model_metadata.json"
)


CATEGORIES_PATH = (
    MODELS_DIR
    / "canonical_categories.json"
)


# ============================================================
# VERIFY ARTIFACTS EXIST
# ============================================================

if not MODEL_PATH.exists():

    raise FileNotFoundError(
        f"Employability model not found: "
        f"{MODEL_PATH}"
    )


if not METADATA_PATH.exists():

    raise FileNotFoundError(
        f"Model metadata not found: "
        f"{METADATA_PATH}"
    )


if not CATEGORIES_PATH.exists():

    raise FileNotFoundError(
        f"Canonical categories file not found: "
        f"{CATEGORIES_PATH}"
    )


# ============================================================
# LOAD MODEL ARTIFACTS ONCE
# ============================================================

# Complete fitted sklearn Pipeline:
#
# ColumnTransformer
#       ↓
# preprocessing
#       ↓
# tuned Random Forest

model = joblib.load(
    MODEL_PATH
)


with open(
    METADATA_PATH,
    "r",
    encoding="utf-8"
) as f:

    model_metadata = json.load(
        f
    )


with open(
    CATEGORIES_PATH,
    "r",
    encoding="utf-8"
) as f:

    canonical_categories = json.load(
        f
    )


# ============================================================
# MODEL CONFIGURATION
# ============================================================

DECISION_THRESHOLD = float(
    model_metadata.get(
        "decision_threshold",
        0.52
    )
)


MODEL_FEATURES = (
    model_metadata.get(
        "features",
        []
    )
)


SKILL_FEATURES = (
    model_metadata.get(
        "skill_features",
        []
    )
)


if len(MODEL_FEATURES) != 26:

    raise ValueError(
        "Expected 26 Model B features, "
        f"but metadata contains "
        f"{len(MODEL_FEATURES)}."
    )


if len(SKILL_FEATURES) != 10:

    raise ValueError(
        "Expected 10 skill features, "
        f"but metadata contains "
        f"{len(SKILL_FEATURES)}."
    )


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

CATEGORICAL_FEATURES = [
    "gender",
    "marital_status",
    "education_level",
    "field_of_study",
    "time_since_studies",
    "province",
    "digital_access",
    "formal_training",
    "training_type",
    "training_field",
    "training_duration",
    "training_relevance",
]


# ============================================================
# TRAINING STRUCTURAL-MISSINGNESS HANDLING
# ============================================================

TRAINING_DETAIL_FEATURES = [
    "training_type",
    "training_field",
    "training_duration",
    "training_relevance",
]


NO_TRAINING_VALUE = (
    "NOT_APPLICABLE_NO_FORMAL_TRAINING"
)


# ============================================================
# EXTRACT PIPELINE COMPONENTS FOR SHAP
# ============================================================

try:

    preprocessor = (
        model.named_steps[
            "preprocessor"
        ]
    )

    classifier = (
        model.named_steps[
            "classifier"
        ]
    )

    transformed_feature_names = (
        preprocessor
        .get_feature_names_out()
    )

    # Random Forest → TreeExplainer
    shap_explainer = (
        shap.TreeExplainer(
            classifier
        )
    )


except Exception as e:

    logger.warning(
        "SHAP initialization failed: %s",
        e
    )

    preprocessor = None

    classifier = None

    transformed_feature_names = None

    shap_explainer = None


# ============================================================
# INPUT PREPARATION
# ============================================================

def prepare_input(
    input_dict: dict
) -> pd.DataFrame:

    """
    Convert validated API input into the exact
    canonical Model B representation expected
    by the saved sklearn Pipeline.

    Important:
    No manual scaling or one-hot encoding is
    performed here.

    Those preprocessing steps already exist
    inside the fitted model pipeline.
    """

    data = input_dict.copy()


    # ========================================================
    # Handle Q14 = No
    #
    # If respondent has no formal training,
    # Q15-Q18 are structurally non-applicable.
    # ========================================================

    if (
        data.get(
            "formal_training"
        )
        == "No"
    ):

        for feature in (
            TRAINING_DETAIL_FEATURES
        ):

            data[
                feature
            ] = (
                NO_TRAINING_VALUE
            )


    # ========================================================
    # Check all required Model B features exist
    # ========================================================

    missing_features = [

        feature

        for feature
        in MODEL_FEATURES

        if feature not in data
    ]


    if missing_features:

        raise ValueError(
            "Missing required model features: "
            +
            ", ".join(
                missing_features
            )
        )


    # ========================================================
    # Keep exact 26 features in exact training order
    # ========================================================

    input_df = pd.DataFrame(
        [
            {
                feature:
                    data[feature]

                for feature
                in MODEL_FEATURES
            }
        ]
    )


    # ========================================================
    # Validate categorical values
    # ========================================================

    for feature in (
        CATEGORICAL_FEATURES
    ):

        value = str(
            input_df
            .iloc[0][feature]
        )


        allowed_values = (
            canonical_categories.get(
                feature
            )
        )


        if allowed_values is None:

            raise ValueError(
                "No canonical category "
                "definition found for "
                f"'{feature}'."
            )


        if (
            value
            not in allowed_values
        ):

            raise ValueError(
                f"Invalid value for "
                f"'{feature}': "
                f"'{value}'. "
                f"Allowed values: "
                f"{allowed_values}"
            )


    return input_df


# ============================================================
# PREDICTION
# ============================================================

def predict_employment_outcome(
    input_df: pd.DataFrame
):

    """
    Produce the model probability for class 1
    and apply the locked 0.52 decision threshold.

    Class 0:
        Active unemployed recent-search outcome

    Class 1:
        Employed outcome
    """

    probabilities = (
        model.predict_proba(
            input_df
        )
    )


    # ========================================================
    # Find the probability column corresponding
    # specifically to class label 1.
    # ========================================================

    model_classes = list(
        model.classes_
    )


    if 1 not in model_classes:

        raise ValueError(
            "Loaded model does not contain "
            "class label 1."
        )


    positive_class_index = (
        model_classes.index(
            1
        )
    )


    probability = float(
        probabilities[
            0,
            positive_class_index
        ]
    )


    # ========================================================
    # Apply locked threshold
    # ========================================================

    predicted_class = int(
        probability
        >=
        DECISION_THRESHOLD
    )


    return (
        probability,
        predicted_class
    )


# ============================================================
# SHAP FEATURE MAPPING
# ============================================================

def get_original_feature_name(
    transformed_name: str
) -> str:

    """
    Convert transformed pipeline feature names
    back to canonical original Model B keys.

    Examples:

    numeric__technological_literacy
        ↓
    technological_literacy


    categorical__province_Western
        ↓
    province
    """


    # ========================================================
    # Numeric
    # ========================================================

    if transformed_name.startswith(
        "numeric__"
    ):

        return (
            transformed_name.replace(
                "numeric__",
                "",
                1
            )
        )


    # ========================================================
    # One-hot categorical
    # ========================================================

    if transformed_name.startswith(
        "categorical__"
    ):

        clean_name = (
            transformed_name.replace(
                "categorical__",
                "",
                1
            )
        )


        # Use longest feature names first
        # to avoid accidental partial matches.

        for feature in sorted(
            CATEGORICAL_FEATURES,
            key=len,
            reverse=True
        ):

            prefix = (
                feature
                + "_"
            )


            if clean_name.startswith(
                prefix
            ):

                return feature


    return transformed_name


# ============================================================
# LOCAL SHAP EXPLANATION
# ============================================================

def generate_shap_explanation(
    input_df: pd.DataFrame,
    top_n: int = 10
):

    """
    Produce language-neutral local SHAP
    explanation information.

    Instead of English labels such as:

        "Field of study"

    return:

        "field_of_study"


    Instead of translating values here:

        "Northern"

    is returned unchanged.

    The frontend's i18n layer is responsible
    for displaying:

        English
        Sinhala
        Tamil


    Important:
    SHAP explains the fitted model's behaviour.
    It does not establish causal effects.
    """

    if (
        shap_explainer is None
        or
        preprocessor is None
        or
        transformed_feature_names is None
    ):

        return (
            [],
            []
        )


    try:

        # ====================================================
        # 1. Apply fitted preprocessing
        # ====================================================

        transformed = (
            preprocessor.transform(
                input_df
            )
        )


        if hasattr(
            transformed,
            "toarray"
        ):

            transformed = (
                transformed.toarray()
            )


        # ====================================================
        # 2. Calculate SHAP values
        # ====================================================

        shap_output = (
            shap_explainer(
                transformed
            )
        )


        values = (
            shap_output.values
        )


        # ====================================================
        # 3. Extract class-1 SHAP contributions
        # ====================================================

        if values.ndim == 3:

            class_labels = list(
                classifier.classes_
            )


            if 1 not in class_labels:

                raise ValueError(
                    "Class label 1 "
                    "was not found in "
                    "the Random Forest."
                )


            class_one_index = (
                class_labels.index(
                    1
                )
            )


            local_values = (
                values[
                    0,
                    :,
                    class_one_index
                ]
            )


        elif values.ndim == 2:

            local_values = (
                values[0]
            )


        else:

            raise ValueError(
                "Unexpected SHAP "
                "output shape: "
                f"{values.shape}"
            )


        # ====================================================
        # 4. Aggregate one-hot features back to
        #    their original canonical variables
        # ====================================================

        aggregated = {}


        for (
            transformed_feature,
            shap_value
        ) in zip(
            transformed_feature_names,
            local_values
        ):

            original_feature = (
                get_original_feature_name(
                    transformed_feature
                )
            )


            aggregated[
                original_feature
            ] = (
                aggregated.get(
                    original_feature,
                    0.0
                )
                +
                float(
                    shap_value
                )
            )


        # ====================================================
        # 5. Rank factors by absolute SHAP magnitude
        # ====================================================

        ranked = sorted(
            aggregated.items(),
            key=lambda item:
                abs(
                    item[1]
                ),
            reverse=True
        )


        positive_factors = []

        negative_factors = []


        # ====================================================
        # 6. Build language-neutral API response
        # ====================================================

        for (
            feature_key,
            shap_value
        ) in ranked:

            # Only return original Model B inputs.
            if (
                feature_key
                not in input_df.columns
            ):

                continue


            user_value = (
                input_df
                .iloc[0][
                    feature_key
                ]
            )


            # Convert numpy scalar types
            # into normal Python values
            # for JSON serialization.

            if isinstance(
                user_value,
                np.generic
            ):

                user_value = (
                    user_value.item()
                )


            factor = {
                "feature_key":
                    feature_key,

                "value":
                    user_value
            }


            if shap_value > 0:

                positive_factors.append(
                    factor
                )


            elif shap_value < 0:

                negative_factors.append(
                    factor
                )


        # ====================================================
        # 7. Return strongest factors
        # ====================================================

        return (
            positive_factors[
                :top_n
            ],

            negative_factors[
                :top_n
            ]
        )


    except Exception as e:

        logger.exception(
            "SHAP explanation failed: %s",
            e
        )


        # Prediction is still returned even if
        # explanation generation unexpectedly fails.

        return (
            [],
            []
        )


# ============================================================
# MAIN API SERVICE FUNCTION
# ============================================================

def analyze_user(
    input_dict: dict
):

    """
    Main employability inference function
    called by POST /analyze.
    """


    # ========================================================
    # 1. Prepare canonical Model B input
    # ========================================================

    input_df = (
        prepare_input(
            input_dict
        )
    )


    # ========================================================
    # 2. Generate model prediction
    # ========================================================

    (
        probability,
        predicted_class
    ) = (
        predict_employment_outcome(
            input_df
        )
    )


    # ========================================================
    # 3. Language-neutral status key
    # ========================================================

    if predicted_class == 1:

        status = (
            "positive_employment_outcome"
        )

    else:

        status = (
            "negative_employment_outcome"
        )


    # ========================================================
    # 4. Local SHAP explanation
    # ========================================================

    (
        positive_factors,
        negative_factors
    ) = (
        generate_shap_explanation(
            input_df,
            top_n=10
        )
    )


    # ========================================================
    # 5. API RESPONSE
    # ========================================================

    # Raw probability is intentionally
    # NOT exposed to the frontend.
    #
    # It is only used internally to apply
    # DECISION_THRESHOLD = 0.52.

    return {

        "status":
            status,

        "predicted_class":
            predicted_class,

        "positive_factors":
            positive_factors,

        "negative_factors":
            negative_factors
    }