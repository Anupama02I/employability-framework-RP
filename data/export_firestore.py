import os
import pandas as pd
import firebase_admin

from firebase_admin import credentials, firestore


# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------

SERVICE_ACCOUNT_PATH = "firebase-service-account.json"
COLLECTION_NAME = "surveyResponses"

OUTPUT_DIR = "raw"
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "survey_responses_raw.csv"
)


# ---------------------------------------------------------
# INITIALIZE FIREBASE
# ---------------------------------------------------------

cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)

firebase_admin.initialize_app(cred)

db = firestore.client()


# ---------------------------------------------------------
# READ FIRESTORE RESPONSES
# ---------------------------------------------------------

documents = db.collection(COLLECTION_NAME).stream()

rows = []

for doc in documents:

    data = doc.to_dict()

    answers = data.get("answers", {})

    row = {
        "respondent_id": doc.id,
        "language": data.get("language"),
        "submitted_at": data.get("submittedAt"),
    }

    # Keep every possible survey question Q1-Q42.
    # Conditional questions that were not shown remain empty.
    for question_id in range(1, 43):

        value = answers.get(str(question_id))

        # Checkbox answers may be stored as arrays/lists.
        # Keep them intact in a reproducible string representation.
        if isinstance(value, list):
            value = " | ".join(str(item) for item in value)

        row[f"q{question_id}"] = value

    rows.append(row)


# ---------------------------------------------------------
# CREATE DATAFRAME
# ---------------------------------------------------------

df = pd.DataFrame(rows)


# ---------------------------------------------------------
# BASIC EXPORT INFORMATION
# ---------------------------------------------------------

print("\n--------------------------------")
print("FIRESTORE EXPORT")
print("--------------------------------")

print(f"Responses found: {len(df)}")

if not df.empty:

    print("\nLanguages:")
    print(
        df["language"]
        .value_counts(dropna=False)
    )

    print("\nSubmission date range:")

    submitted = pd.to_datetime(
        df["submitted_at"],
        errors="coerce",
        utc=True
    )

    print("Earliest:", submitted.min())
    print("Latest:  ", submitted.max())


# ---------------------------------------------------------
# SAVE RAW SNAPSHOT
# ---------------------------------------------------------

os.makedirs(OUTPUT_DIR, exist_ok=True)

df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print(f"\nSaved successfully:")
print(OUTPUT_FILE)

print("\nDataset shape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())