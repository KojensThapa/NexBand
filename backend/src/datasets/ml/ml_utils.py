"""Shared helpers for the relevance and random-text training/prediction scripts."""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
VECTORIZER_DIR = BASE_DIR / "vectorizer"

def load_labelled_csv(
    filename: str, text_columns: list[str], valid_labels: tuple[str, ...], label_column: str = "label"
) -> pd.DataFrame:
    """Load a training CSV and merge its text columns into one `text` field."""
    path = DATA_DIR / filename
    df = pd.read_csv(path)

    df[label_column] = df[label_column].astype(str).str.strip().str.lower()
    df = df[df[label_column].isin(valid_labels)]

    text = df[text_columns[0]].astype(str).str.strip()
    for col in text_columns[1:]:
        text = text + " " + df[col].astype(str).str.strip()

    result = pd.DataFrame({"text": text, "label": df[label_column]})
    return result.dropna().reset_index(drop=True)


def print_classification_metrics(y_true, y_pred, labels: tuple[str, ...], pos_label: str) -> None:
    print(f"Accuracy:  {accuracy_score(y_true, y_pred):.4f}")
    print(f"Precision: {precision_score(y_true, y_pred, pos_label=pos_label):.4f}")
    print(f"Recall:    {recall_score(y_true, y_pred, pos_label=pos_label):.4f}")
    print(f"F1 Score:  {f1_score(y_true, y_pred, pos_label=pos_label):.4f}")
    print("\nConfusion Matrix:")
    print(pd.DataFrame(
        confusion_matrix(y_true, y_pred, labels=labels),
        index=[f"true_{l}" for l in labels],
        columns=[f"pred_{l}" for l in labels],
    ))
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, labels=labels))


def save_artifact(obj, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(obj, path)
