"""Predict whether a piece of text is random/nonsensical or normal English.

Loads the trained logistic regression model and TF-IDF vectorizer, applies
the same preprocessing used during training, and prints a JSON verdict with
a confidence score to stdout.

Usage:
    python predict_random_text.py "<text>"
"""

import json
import sys

import joblib

from ml_utils import MODELS_DIR, VECTORIZER_DIR

MODEL_PATH = MODELS_DIR / "random_text_model.pkl"
VECTORIZER_PATH = VECTORIZER_DIR / "random_text_vectorizer.pkl"


def main() -> None:
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Missing arguments"}))
        return

    text = sys.argv[1].strip()
    if not text:
        print(json.dumps({"error": "Empty text"}))
        return

    if not MODEL_PATH.exists():
        print(json.dumps({"error": "Model not found"}))
        return

    if not VECTORIZER_PATH.exists():
        print(json.dumps({"error": "Vectorizer not found"}))
        return

    try:
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)

        vectorized = vectorizer.transform([text])

        prediction = model.predict(vectorized)[0]
        probabilities = model.predict_proba(vectorized)[0]
        confidence = max(probabilities)

        print(json.dumps({
            "random": prediction == "random",
            "confidence": round(float(confidence), 4),
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()
