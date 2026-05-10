import joblib
import pandas as pd
import shap
import dice_ml
from dice_ml import Dice

# -----------------------------
# EDUCATION MAP
# -----------------------------
edu_map = {
    "G.C.E O/L": 1,
    "G.C.E A/L": 2,
    "Certificate / NVQ Level 3–4": 3,
    "Diploma / HND / NVQ Level 5–6": 4,
    "Bachelor's Degree": 5,
    "Postgraduate Qualification": 6
}

# -----------------------------
# LOAD MODELS & ARTIFACTS
# -----------------------------
best_model = joblib.load("models/best_model.pkl")
calibrated_model = joblib.load("models/calibrated_model.pkl")
feature_columns = joblib.load("models/feature_columns.pkl")

# -----------------------------
# RECREATE DiCE DATA
# -----------------------------
df_dice = pd.read_csv("models/employability_data.csv")

categorical_cols = ["Gender_Male", "Gender_Female"]
categorical_cols += [col for col in feature_columns if col.startswith("Field_")]

continuous_features = [col for col in feature_columns if col not in categorical_cols]

data_dice = dice_ml.Data(
    dataframe=df_dice,
    continuous_features=continuous_features,
    outcome_name="Target_Employed"
)

# -----------------------------
# EXPLAINERS
# -----------------------------
explainer = shap.Explainer(best_model)

dice_model = dice_ml.Model(model=calibrated_model, backend="sklearn")
dice = Dice(data_dice, dice_model)

# -----------------------------
# SKILL MAP
# -----------------------------
skill_map = {
    "Skill_Analytical": "Analytical thinking",
    "Skill_Resilience": "Resilience",
    "Skill_Leadership": "Leadership and social influence",
    "Skill_Creative": "Creative thinking",
    "Skill_Motivation": "Motivation and self-awareness",
    "Skill_Tech_Literacy": "Technological literacy",
    "Skill_Empathy": "Empathy and active listening",
    "Skill_Curiosity": "Curiosity and lifelong learning"
}

SKILL_COLUMNS = list(skill_map.keys())

# -----------------------------
# MAIN FUNCTION
# -----------------------------
def analyze_user(input_dict):

    # -----------------------------
    # 1. PREPROCESS INPUT
    # -----------------------------
    data = input_dict.copy()

    try:
        # ---------- Gender (One-Hot)
        data["Gender_Male"] = 1 if data["gender"] == "Male" else 0
        data["Gender_Female"] = 1 if data["gender"] == "Female" else 0
        del data["gender"]

        # ---------- Field (One-Hot)
        fields = [
            "Field_IT", "Field_Business", "Field_Engineering",
            "Field_Vocational", "Field_Arts", "Field_Science", "Field_General"
        ]

        for f in fields:
            data[f] = 0

        field_key = f"Field_{data['field_of_study']}"
        if field_key not in fields:
            raise ValueError("Invalid field_of_study")

        data[field_key] = 1
        del data["field_of_study"]

        # ---------- Education
        data["Edu_Level"] = edu_map[data["Edu_Level"]]

    except KeyError:
        raise ValueError("Invalid categorical input value")

    # Convert to DataFrame
    input_df = pd.DataFrame([data])

    # Ensure correct feature order
    input_df = input_df.reindex(columns=feature_columns, fill_value=0)

    # -----------------------------
    # 2. PREDICTION
    # -----------------------------
    prediction = calibrated_model.predict(input_df)[0]
    probability = calibrated_model.predict_proba(input_df)[0][1]

    status = "employable" if prediction == 1 else "not_employable"

    # -----------------------------
    # 3. SHAP EXPLANATIONS
    # -----------------------------
    shap_values = explainer(input_df)

    values = shap_values.values[0] if hasattr(shap_values, "values") else shap_values[0]
    shap_dict = dict(zip(feature_columns, values))

    sorted_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)

    positive_factors = []
    negative_factors = []

    for feature, value in sorted_features:

        if feature not in SKILL_COLUMNS:
            continue

        name = skill_map.get(feature, feature)

        if status == "employable" and value > 0:
            positive_factors.append(name)

        elif status == "not_employable" and value < 0:
            negative_factors.append(name)

    positive_factors = positive_factors[:3]
    negative_factors = negative_factors[:3]

    # -----------------------------
    # 4. COUNTERFACTUALS
    # -----------------------------
    recommendations = []

    if status == "not_employable":
        try:
            original = input_df.reset_index(drop=True)

            permitted_range = {
                skill: [original.iloc[0][skill], 5] for skill in SKILL_COLUMNS
            }

            dice_exp = dice.generate_counterfactuals(
                input_df,
                total_CFs=1,
                desired_class="opposite",
                features_to_vary=SKILL_COLUMNS,
                permitted_range=permitted_range
            )

            cf_df = dice_exp.cf_examples_list[0].final_cfs_df

            if not cf_df.empty:
                cf = cf_df.iloc[0]

                for skill in SKILL_COLUMNS:
                    old = original.iloc[0][skill]
                    new = cf[skill]

                    if new - old >= 1:
                        recommendations.append(
                            f"Improve {skill_map[skill]} from {int(old)} to {int(new)}"
                        )

        except Exception as e:
            print("DiCE error:", e)
            recommendations = ["Unable to generate recommendations"]

    # -----------------------------
    # 5. OUTPUT
    # -----------------------------
    return {
        "status": status,
        "probability": f"{float(probability)*100:.2f}%",
        "probability_score": float(probability),
        "positive_factors": positive_factors,
        "negative_factors": negative_factors,
        "recommendations": recommendations
    }