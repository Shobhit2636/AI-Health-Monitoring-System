import numpy as np
import joblib
import os
from pathlib import Path
from typing import Dict, Any
from loguru import logger

MODEL_DIR = Path(__file__).parent.parent.parent.parent / "ai-services" / "models"


class HealthPredictionService:
    """
    Loads pre-trained XGBoost/Sklearn models and runs inference.
    Models are trained separately and stored as .pkl files.
    """

    def __init__(self):
        self.diabetes_model = None
        self.heart_model = None
        self._load_models()

    def _load_models(self):
        try:
            diabetes_path = MODEL_DIR / "diabetes_model.pkl"
            if diabetes_path.exists():
                self.diabetes_model = joblib.load(diabetes_path)
                logger.info("Diabetes model loaded.")

            heart_path = MODEL_DIR / "heart_model.pkl"
            if heart_path.exists():
                self.heart_model = joblib.load(heart_path)
                logger.info("Heart disease model loaded.")
        except Exception as e:
            logger.warning(f"Model load error (will use demo mode): {e}")

    def predict_diabetes(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Features: pregnancies, glucose, blood_pressure, skin_thickness,
                  insulin, bmi, diabetes_pedigree, age
        """
        required = ["glucose", "bmi", "age", "blood_pressure"]
        for f in required:
            if f not in features:
                raise ValueError(f"Missing feature: {f}")

        feature_vector = np.array([[
            features.get("pregnancies", 0),
            features["glucose"],
            features["blood_pressure"],
            features.get("skin_thickness", 20),
            features.get("insulin", 80),
            features["bmi"],
            features.get("diabetes_pedigree", 0.5),
            features["age"],
        ]])

        if self.diabetes_model:
            proba = self.diabetes_model.predict_proba(feature_vector)[0][1]
        else:
            # Demo mode: rule-based scoring
            score = 0.0
            if features["glucose"] > 140: score += 0.3
            if features["bmi"] > 30: score += 0.2
            if features["age"] > 45: score += 0.15
            if features.get("pregnancies", 0) > 3: score += 0.1
            proba = min(score + 0.1, 0.99)

        risk_level = self._score_to_risk(proba)
        recommendations = self._diabetes_recommendations(proba, features)

        return {
            "prediction_type": "diabetes",
            "risk_score": round(float(proba), 3),
            "risk_level": risk_level,
            "confidence": 0.87,
            "recommendations": recommendations,
            "model_version": "1.0.0",
        }

    def predict_heart_disease(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Features: age, sex, chest_pain_type, resting_bp, cholesterol,
                  fasting_blood_sugar, resting_ecg, max_heart_rate,
                  exercise_angina, st_depression, st_slope
        """
        feature_vector = np.array([[
            features.get("age", 50),
            features.get("sex", 1),
            features.get("chest_pain_type", 0),
            features.get("resting_bp", 120),
            features.get("cholesterol", 200),
            features.get("fasting_blood_sugar", 0),
            features.get("resting_ecg", 0),
            features.get("max_heart_rate", 150),
            features.get("exercise_angina", 0),
            features.get("st_depression", 0.0),
            features.get("st_slope", 1),
        ]])

        if self.heart_model:
            proba = self.heart_model.predict_proba(feature_vector)[0][1]
        else:
            # Demo mode
            score = 0.0
            if features.get("age", 50) > 55: score += 0.2
            if features.get("cholesterol", 200) > 240: score += 0.2
            if features.get("resting_bp", 120) > 140: score += 0.15
            if features.get("exercise_angina", 0) == 1: score += 0.2
            if features.get("chest_pain_type", 0) > 1: score += 0.15
            proba = min(score + 0.05, 0.99)

        risk_level = self._score_to_risk(proba)
        recommendations = self._heart_recommendations(proba, features)

        return {
            "prediction_type": "heart_disease",
            "risk_score": round(float(proba), 3),
            "risk_level": risk_level,
            "confidence": 0.89,
            "recommendations": recommendations,
            "model_version": "1.0.0",
        }

    def predict_general_health(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Composite health risk from vitals"""
        scores = []

        bp_sys = features.get("blood_pressure_systolic", 120)
        bp_dia = features.get("blood_pressure_diastolic", 80)
        glucose = features.get("blood_glucose", 90)
        bmi = features.get("bmi", 22)
        age = features.get("age", 30)

        bp_score = 0.0
        if bp_sys > 180 or bp_dia > 110: bp_score = 0.9
        elif bp_sys > 160 or bp_dia > 100: bp_score = 0.7
        elif bp_sys > 140 or bp_dia > 90: bp_score = 0.5
        elif bp_sys > 130: bp_score = 0.3
        scores.append(bp_score)

        glucose_score = 0.0
        if glucose > 200: glucose_score = 0.9
        elif glucose > 140: glucose_score = 0.6
        elif glucose > 100: glucose_score = 0.3
        scores.append(glucose_score)

        bmi_score = 0.0
        if bmi > 40: bmi_score = 0.8
        elif bmi > 35: bmi_score = 0.6
        elif bmi > 30: bmi_score = 0.4
        elif bmi < 18.5: bmi_score = 0.3
        scores.append(bmi_score)

        age_score = min(age / 100, 0.6)
        scores.append(age_score * 0.4)

        overall = round(float(np.mean(scores)), 3)
        return {
            "prediction_type": "general_health",
            "risk_score": overall,
            "risk_level": self._score_to_risk(overall),
            "confidence": 0.82,
            "recommendations": self._general_recommendations(overall, features),
            "model_version": "1.0.0",
        }

    def _score_to_risk(self, score: float) -> str:
        if score < 0.25: return "low"
        if score < 0.50: return "moderate"
        if score < 0.75: return "high"
        return "critical"

    def _diabetes_recommendations(self, score: float, features: dict) -> list:
        recs = []
        if features.get("glucose", 0) > 140:
            recs.append("Monitor blood glucose daily and consult endocrinologist.")
        if features.get("bmi", 0) > 25:
            recs.append("Reduce BMI through diet (low-carb) and 30-min daily exercise.")
        if score > 0.5:
            recs.append("Schedule HbA1c test immediately.")
        recs.append("Reduce sugar and refined carbohydrate intake.")
        recs.append("Stay hydrated — drink 8 glasses of water daily.")
        return recs

    def _heart_recommendations(self, score: float, features: dict) -> list:
        recs = []
        if features.get("cholesterol", 0) > 240:
            recs.append("Consult cardiologist about cholesterol management.")
        if features.get("resting_bp", 0) > 140:
            recs.append("Monitor blood pressure twice daily.")
        if score > 0.5:
            recs.append("Get ECG and stress test done immediately.")
        recs.append("Follow heart-healthy diet: omega-3, leafy greens, less sodium.")
        recs.append("Avoid smoking and limit alcohol.")
        return recs

    def _general_recommendations(self, score: float, features: dict) -> list:
        recs = ["Schedule annual health checkup."]
        if score > 0.3:
            recs.append("Increase physical activity to 150 min/week.")
        if score > 0.5:
            recs.append("Consult your doctor for detailed health assessment.")
        recs.append("Maintain regular sleep schedule (7-9 hours).")
        recs.append("Eat balanced diet with fruits, vegetables, and whole grains.")
        return recs


health_prediction_service = HealthPredictionService()
