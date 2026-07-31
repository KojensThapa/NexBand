"""Train the speaking/writing relevance classifier.

Merges the speaking and writing relevance datasets, vectorizes the text with
TF-IDF, trains a logistic regression classifier, evaluates it on a held-out
split, and saves the fitted model and vectorizer to disk.
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

from ml_utils import MODELS_DIR, VECTORIZER_DIR, load_labelled_csv, print_classification_metrics, save_artifact

RANDOM_STATE = 42
LABELS = ("relevant", "irrelevant")
TOP_N_FEATURES = 20


def load_dataset() -> pd.DataFrame:
    speaking = load_labelled_csv("speaking_relevance_training.csv", ["question", "response"], LABELS)
    writing = load_labelled_csv("writing_relevance_training.csv", ["topic", "essay"], LABELS)
    return pd.concat([speaking, writing], ignore_index=True)


def print_top_features(model: LogisticRegression, vectorizer: TfidfVectorizer, top_n: int) -> None:
    """Print the strongest positive and negative words/phrases the model learned."""
    feature_names = vectorizer.get_feature_names_out()
    coefs = model.coef_[0]
    positive_class = model.classes_[1]

    ranked = np.argsort(coefs)
    top_positive = ranked[::-1][:top_n]
    top_negative = ranked[:top_n]

    print(f"\nTop {top_n} features pushing toward '{positive_class}':")
    for i in top_positive:
        print(f"  {feature_names[i]:<30} {coefs[i]:+.4f}")

    print(f"\nTop {top_n} features pushing away from '{positive_class}':")
    for i in top_negative:
        print(f"  {feature_names[i]:<30} {coefs[i]:+.4f}")


def main() -> None:
    df = load_dataset()
    print(f"Loaded {len(df)} samples (speaking + writing).")

    x_train, x_test, y_train, y_test = train_test_split(
        df["text"],
        df["label"],
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=df["label"],
    )

    vectorizer = TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.90,
        max_features=5000,
        strip_accents="unicode",
    )
    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)

    model = LogisticRegression(
        class_weight="balanced",
        max_iter=3000,
        C=2.0,
        random_state=RANDOM_STATE,
    )
    model.fit(x_train_vec, y_train)

    y_pred = model.predict(x_test_vec)
    print_classification_metrics(y_test, y_pred, labels=LABELS, pos_label="relevant")
    print_top_features(model, vectorizer, TOP_N_FEATURES)

    save_artifact(model, MODELS_DIR / "relevance_model.pkl")
    save_artifact(vectorizer, VECTORIZER_DIR / "relevance_vectorizer.pkl")
    print(f"\nSaved model to {MODELS_DIR / 'relevance_model.pkl'}")
    print(f"Saved vectorizer to {VECTORIZER_DIR / 'relevance_vectorizer.pkl'}")


if __name__ == "__main__":
    main()
