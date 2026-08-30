import json
import pandas as pd
from pathlib import Path

BASE = Path("knowledge_base/processed")

csv_path = BASE / "esco_occupation_profiles.csv"
jsonl_path = BASE / "esco_occupation_profiles.jsonl"

df = pd.read_csv(csv_path)

print("Rows:", len(df))
print("Unique occupations:", df["occupation_uri"].nunique())
print("Missing occupation names:", df["occupation_name"].isna().sum())
print("Missing descriptions:", df["description"].isna().sum())
print("Missing essential skills:", df["essential_skills"].isna().sum())

print("\nSample occupations:")
print(
    df[
        [
            "occupation_name",
            "isco_group",
            "essential_skill_count",
            "optional_skill_count",
        ]
    ].head(10)
)

with open(jsonl_path, "r", encoding="utf-8") as f:
    first = json.loads(f.readline())

print("\nFirst JSONL record:")
print(json.dumps(first, indent=2, ensure_ascii=False))