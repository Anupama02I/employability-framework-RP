#!/usr/bin/env python
"""
Analyze the fixed final chatbot evaluation results.

Input:
  chatbot_final_evaluation_results.csv

Outputs (under analysis/ by default):
  automatic_evaluation_summary.csv
  rag_routing_metrics.csv
  rag_routing_confusion_matrix.csv
  evaluation_area_summary.csv
  multilingual_summary.csv
  document_handling_summary.csv
  routing_mismatch_cases.csv

This script uses only Python's standard library so the reported metrics are
fully reproducible without notebook-specific dependencies.
"""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from pathlib import Path


def as_bool(value) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes", "y"}


def safe_div(num: int, den: int) -> float:
    return num / den if den else 0.0


def pct(value: float) -> str:
    return f"{value * 100:.2f}"


def write_csv(path: Path, headers, rows) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)


def load_results(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise ValueError("The results CSV is empty.")
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default="evaluation/final_chatbot_evaluation/chatbot_final_evaluation_results.csv",
        help="Path to the final evaluation results CSV.",
    )
    parser.add_argument(
        "--output-dir",
        default="evaluation/final_chatbot_evaluation/analysis",
        help="Directory for generated analysis CSV files.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output_dir)
    rows = load_results(input_path)

    total = len(rows)
    intent_correct = sum(as_bool(r["intent_match"]) for r in rows)
    rag_correct = sum(as_bool(r["rag_match"]) for r in rows)
    http_success = sum(str(r["http_status"]).strip() == "200" for r in rows)
    completed = sum(str(r["run_status"]).strip().upper() == "COMPLETED" for r in rows)

    # RAG confusion matrix.
    tp = sum(as_bool(r["expected_rag"]) and as_bool(r["actual_rag_used"]) for r in rows)
    fn = sum(as_bool(r["expected_rag"]) and not as_bool(r["actual_rag_used"]) for r in rows)
    fp = sum(not as_bool(r["expected_rag"]) and as_bool(r["actual_rag_used"]) for r in rows)
    tn = sum(not as_bool(r["expected_rag"]) and not as_bool(r["actual_rag_used"]) for r in rows)

    rag_precision = safe_div(tp, tp + fp)
    rag_recall = safe_div(tp, tp + fn)
    rag_specificity = safe_div(tn, tn + fp)
    rag_accuracy = safe_div(tp + tn, total)

    # Retrieval execution: when RAG actually ran, did it return at least one / three items?
    rag_used_rows = [r for r in rows if as_bool(r["actual_rag_used"])]
    rag_with_any = sum(int(r.get("actual_rag_retrieved_count") or 0) >= 1 for r in rag_used_rows)
    rag_with_three = sum(int(r.get("actual_rag_retrieved_count") or 0) >= 3 for r in rag_used_rows)

    summary = [
        ["Total fixed evaluation cases", total, total, "100.00"],
        ["HTTP/API execution success", http_success, total, pct(safe_div(http_success, total))],
        ["Run completion", completed, total, pct(safe_div(completed, total))],
        ["Intent-routing accuracy", intent_correct, total, pct(safe_div(intent_correct, total))],
        ["RAG-routing accuracy", rag_correct, total, pct(safe_div(rag_correct, total))],
        ["RAG-required recall", tp, tp + fn, pct(rag_recall)],
        ["No-RAG specificity", tn, tn + fp, pct(rag_specificity)],
        ["RAG precision", tp, tp + fp, pct(rag_precision)],
        ["RAG calls returning >=1 evidence item", rag_with_any, len(rag_used_rows), pct(safe_div(rag_with_any, len(rag_used_rows)))],
        ["RAG calls returning Top-3 evidence", rag_with_three, len(rag_used_rows), pct(safe_div(rag_with_three, len(rag_used_rows)))],
    ]
    write_csv(
        output_dir / "automatic_evaluation_summary.csv",
        ["metric", "correct_or_count", "denominator", "percentage"],
        summary,
    )

    write_csv(
        output_dir / "rag_routing_metrics.csv",
        ["metric", "value", "percentage"],
        [
            ["True positives", tp, ""],
            ["False negatives", fn, ""],
            ["False positives", fp, ""],
            ["True negatives", tn, ""],
            ["Precision", f"{rag_precision:.4f}", pct(rag_precision)],
            ["Recall / sensitivity", f"{rag_recall:.4f}", pct(rag_recall)],
            ["Specificity", f"{rag_specificity:.4f}", pct(rag_specificity)],
            ["Accuracy", f"{rag_accuracy:.4f}", pct(rag_accuracy)],
        ],
    )

    write_csv(
        output_dir / "rag_routing_confusion_matrix.csv",
        ["", "Actual RAG = Yes", "Actual RAG = No"],
        [
            ["Expected RAG = Yes", tp, fn],
            ["Expected RAG = No", fp, tn],
        ],
    )

    # By evaluation area.
    by_area = defaultdict(list)
    for r in rows:
        by_area[r["evaluation_area"]].append(r)

    area_rows = []
    for area, group in sorted(by_area.items()):
        n = len(group)
        iok = sum(as_bool(r["intent_match"]) for r in group)
        rok = sum(as_bool(r["rag_match"]) for r in group)
        area_rows.append([
            area, n, iok, pct(safe_div(iok, n)), rok, pct(safe_div(rok, n))
        ])
    write_csv(
        output_dir / "evaluation_area_summary.csv",
        ["evaluation_area", "cases", "intent_correct", "intent_accuracy_pct", "rag_correct", "rag_accuracy_pct"],
        area_rows,
    )

    # Multilingual subset.
    multi = [r for r in rows if r["evaluation_area"] == "Multilingual Consistency"]
    by_lang = defaultdict(list)
    for r in multi:
        by_lang[r["language"]].append(r)

    multi_rows = []
    for language, group in sorted(by_lang.items()):
        n = len(group)
        iok = sum(as_bool(r["intent_match"]) for r in group)
        rok = sum(as_bool(r["rag_match"]) for r in group)
        multi_rows.append([language, n, iok, pct(safe_div(iok, n)), rok, pct(safe_div(rok, n))])
    if multi:
        n = len(multi)
        iok = sum(as_bool(r["intent_match"]) for r in multi)
        rok = sum(as_bool(r["rag_match"]) for r in multi)
        multi_rows.append(["OVERALL", n, iok, pct(safe_div(iok, n)), rok, pct(safe_div(rok, n))])

    write_csv(
        output_dir / "multilingual_summary.csv",
        ["language", "cases", "intent_correct", "intent_accuracy_pct", "rag_correct", "rag_accuracy_pct"],
        multi_rows,
    )

    # Dedicated document-aware cases.
    docs = [r for r in rows if r["evaluation_area"] == "Document-Aware Guidance"]
    doc_type_correct = sum(
        str(r["uploaded_document_type"]).strip() == str(r["actual_uploaded_document_type"]).strip()
        for r in docs
    )
    doc_intent_correct = sum(as_bool(r["intent_match"]) for r in docs)
    doc_rag_correct = sum(as_bool(r["rag_match"]) for r in docs)

    doc_summary = [
        ["Document-aware cases", len(docs), len(docs), "100.00"],
        ["Document type/context recognition", doc_type_correct, len(docs), pct(safe_div(doc_type_correct, len(docs)))],
        ["Intent-routing accuracy", doc_intent_correct, len(docs), pct(safe_div(doc_intent_correct, len(docs)))],
        ["RAG-routing accuracy", doc_rag_correct, len(docs), pct(safe_div(doc_rag_correct, len(docs)))],
    ]
    write_csv(
        output_dir / "document_handling_summary.csv",
        ["metric", "correct_or_count", "denominator", "percentage"],
        doc_summary,
    )

    # Exact routing mismatches for auditability.
    mismatch_rows = []
    for r in rows:
        if not as_bool(r["intent_match"]) or not as_bool(r["rag_match"]):
            mismatch_rows.append([
                r["case_id"],
                r["evaluation_area"],
                r["language"],
                r["expected_intent"],
                r["actual_intent"],
                r["intent_match"],
                r["expected_rag"],
                r["actual_rag_used"],
                r["rag_match"],
                r["user_message"],
            ])
    write_csv(
        output_dir / "routing_mismatch_cases.csv",
        [
            "case_id", "evaluation_area", "language",
            "expected_intent", "actual_intent", "intent_match",
            "expected_rag", "actual_rag_used", "rag_match", "user_message"
        ],
        mismatch_rows,
    )

    print("=" * 68)
    print("FINAL CHATBOT AUTOMATED EVALUATION")
    print("=" * 68)
    print(f"Input: {input_path}")
    print(f"Cases: {total}")
    print(f"HTTP success:            {http_success}/{total} ({pct(safe_div(http_success,total))}%)")
    print(f"Intent-routing accuracy: {intent_correct}/{total} ({pct(safe_div(intent_correct,total))}%)")
    print(f"RAG-routing accuracy:    {rag_correct}/{total} ({pct(safe_div(rag_correct,total))}%)")
    print()
    print("RAG confusion matrix")
    print(f"TP={tp}  FN={fn}  FP={fp}  TN={tn}")
    print(f"Precision:   {pct(rag_precision)}%")
    print(f"Recall:      {pct(rag_recall)}%")
    print(f"Specificity: {pct(rag_specificity)}%")
    print()
    print(f"Generated analysis files in: {output_dir}")
    print("=" * 68)


if __name__ == "__main__":
    main()
