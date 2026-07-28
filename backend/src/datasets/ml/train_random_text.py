"""Train the random/nonsensical text detector.

Loads the random-text dataset, vectorizes it with TF-IDF, trains a logistic
regression classifier, evaluates it on a held-out split, and saves the
fitted model and vectorizer to disk.
"""

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

from ml_utils import MODELS_DIR, VECTORIZER_DIR, load_labelled_csv, print_classification_metrics, save_artifact

RANDOM_STATE = 42
LABELS = ("normal", "random")


def load_dataset() -> pd.DataFrame:
    return load_labelled_csv("random_text_training.csv", ["text"], LABELS)


def main() -> None:
    df = load_dataset()
    print(f"Loaded {len(df)} samples (random text).")

    x_train, x_test, y_train, y_test = train_test_split(
        df["text"],
        df["label"],
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=df["label"],
    )

    vectorizer = TfidfVectorizer()
    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)

    model = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE, class_weight="balanced")
    model.fit(x_train_vec, y_train)

    y_pred = model.predict(x_test_vec)
    print_classification_metrics(y_test, y_pred, labels=LABELS, pos_label="random")

    save_artifact(model, MODELS_DIR / "random_text_model.pkl")
    save_artifact(vectorizer, VECTORIZER_DIR / "random_text_vectorizer.pkl")
    print(f"\nSaved model to {MODELS_DIR / 'random_text_model.pkl'}")
    print(f"Saved vectorizer to {VECTORIZER_DIR / 'random_text_vectorizer.pkl'}")


if __name__ == "__main__":
    main()
