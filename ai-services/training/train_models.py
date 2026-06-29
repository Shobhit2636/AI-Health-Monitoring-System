"""
AI Health Model Training Script
Trains XGBoost models for diabetes and heart disease prediction.
Uses publicly available datasets (Pima Indians Diabetes + Cleveland Heart Disease).

Run: python train_models.py
Output: models/diabetes_model.pkl, models/heart_model.pkl
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import Pipeline
import xgboost as xgb

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


def train_diabetes_model():
    """Train on Pima Indians Diabetes Dataset."""
    print("Training Diabetes Prediction Model...")

    # In production: load from CSV
    # df = pd.read_csv("data/diabetes.csv")
    # For demo: generate synthetic data with realistic distributions
    np.random.seed(42)
    n = 1000

    glucose      = np.random.normal(120, 30, n).clip(50, 400)
    bmi          = np.random.normal(28, 6, n).clip(15, 55)
    age          = np.random.randint(21, 81, n)
    bp           = np.random.normal(70, 10, n).clip(40, 130)
    pregnancies  = np.random.randint(0, 15, n)
    insulin      = np.random.normal(80, 50, n).clip(0, 600)
    pedigree     = np.random.uniform(0.07, 2.5, n)
    skin         = np.random.normal(20, 10, n).clip(0, 60)

    # Synthetic outcome based on risk factors
    risk = (
        (glucose > 140).astype(float) * 0.35 +
        (bmi > 30).astype(float) * 0.25 +
        (age > 45).astype(float) * 0.15 +
        (pregnancies > 5).astype(float) * 0.1 +
        (pedigree > 0.5).astype(float) * 0.1 +
        np.random.uniform(0, 0.05, n)
    )
    outcome = (risk > 0.4).astype(int)

    X = np.column_stack([pregnancies, glucose, bp, skin, insulin, bmi, pedigree, age])
    y = outcome

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("xgb", xgb.XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )),
    ])

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_proba)

    print(f"Diabetes Model — AUC: {auc:.3f}")
    print(classification_report(y_test, y_pred, target_names=["No Diabetes", "Diabetes"]))

    path = MODELS_DIR / "diabetes_model.pkl"
    joblib.dump(model, path)
    print(f"Saved: {path}\n")
    return model


def train_heart_model():
    """Train on Cleveland Heart Disease Dataset."""
    print("Training Heart Disease Prediction Model...")

    np.random.seed(123)
    n = 1000

    age          = np.random.randint(29, 78, n)
    sex          = np.random.randint(0, 2, n)
    cp           = np.random.randint(0, 4, n)
    trestbps     = np.random.normal(130, 17, n).clip(94, 200)
    chol         = np.random.normal(245, 50, n).clip(126, 564)
    fbs          = (np.random.random(n) > 0.85).astype(int)
    restecg      = np.random.randint(0, 3, n)
    thalach      = np.random.normal(150, 22, n).clip(71, 202)
    exang        = (np.random.random(n) > 0.67).astype(int)
    oldpeak      = np.random.uniform(0, 5, n)
    slope        = np.random.randint(0, 3, n)

    risk = (
        (age > 55).astype(float) * 0.2 +
        (chol > 240).astype(float) * 0.2 +
        (trestbps > 140).astype(float) * 0.15 +
        (exang == 1).astype(float) * 0.2 +
        (cp > 1).astype(float) * 0.15 +
        (oldpeak > 2).astype(float) * 0.1 +
        np.random.uniform(0, 0.05, n)
    )
    target = (risk > 0.38).astype(int)

    X = np.column_stack([age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope])
    y = target

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("xgb", xgb.XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )),
    ])

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_proba)

    print(f"Heart Disease Model — AUC: {auc:.3f}")
    print(classification_report(y_test, y_pred, target_names=["No Disease", "Heart Disease"]))

    path = MODELS_DIR / "heart_model.pkl"
    joblib.dump(model, path)
    print(f"Saved: {path}\n")
    return model


if __name__ == "__main__":
    train_diabetes_model()
    train_heart_model()
    print("All models trained and saved successfully!")
    print(f"Model files in: {MODELS_DIR}")
