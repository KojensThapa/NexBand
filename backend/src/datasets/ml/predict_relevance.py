"""Predict whether a response is relevant to a question.

Loads the trained logistic regression model and TF-IDF vectorizer, combines
the question and response the same way as during training, and prints a JSON
verdict with a confidence score to stdout.

Usage:
    python predict_relevance.py "<question>" "<response>"
"""

import json
import sys

import joblib

from ml_utils import MODELS_DIR, VECTORIZER_DIR

MODEL_PATH = MODELS_DIR / "relevance_model.pkl"
VECTORIZER_PATH = VECTORIZER_DIR / "relevance_vectorizer.pkl"


def main() -> None:
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Missing arguments"}))
        return

    question, response = sys.argv[1].strip(), sys.argv[2].strip()

    try:
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)

        text = f"{question} {response}"
        vectorized = vectorizer.transform([text])

        prediction = model.predict(vectorized)[0]
        probabilities = model.predict_proba(vectorized)[0]
        confidence = max(probabilities)

        print(json.dumps({
            "relevant": prediction == "relevant",
            "confidence": round(float(confidence), 4),
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()
