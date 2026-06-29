"""
Unit tests for AI prediction services
"""
import pytest
from app.services.ai.prediction import HealthPredictionService


@pytest.fixture
def predictor():
    return HealthPredictionService()


class TestDiabetesPrediction:
    def test_low_risk(self, predictor):
        result = predictor.predict_diabetes({
            "glucose": 85, "bmi": 21, "age": 25,
            "blood_pressure": 70, "pregnancies": 0,
        })
        assert result["risk_level"] in ("low", "moderate")
        assert 0.0 <= result["risk_score"] <= 1.0
        assert isinstance(result["recommendations"], list)
        assert len(result["recommendations"]) > 0

    def test_high_risk(self, predictor):
        result = predictor.predict_diabetes({
            "glucose": 200, "bmi": 38, "age": 60,
            "blood_pressure": 90, "pregnancies": 5,
        })
        assert result["risk_level"] in ("high", "critical")
        assert result["risk_score"] > 0.4

    def test_missing_required_field_raises(self, predictor):
        with pytest.raises((ValueError, KeyError)):
            predictor.predict_diabetes({"glucose": 100})  # missing bmi, age, blood_pressure

    def test_result_structure(self, predictor):
        result = predictor.predict_diabetes({
            "glucose": 120, "bmi": 26, "age": 38,
            "blood_pressure": 78,
        })
        required_keys = ["prediction_type", "risk_level", "risk_score", "confidence", "recommendations", "model_version"]
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_risk_score_range(self, predictor):
        for glucose in [70, 100, 140, 200, 300]:
            result = predictor.predict_diabetes({
                "glucose": glucose, "bmi": 25, "age": 40, "blood_pressure": 80,
            })
            assert 0.0 <= result["risk_score"] <= 1.0


class TestHeartDiseasePrediction:
    def test_low_risk(self, predictor):
        result = predictor.predict_heart_disease({
            "age": 35, "sex": 0, "chest_pain_type": 0,
            "resting_bp": 115, "cholesterol": 190,
            "max_heart_rate": 170, "exercise_angina": 0,
        })
        assert result["risk_level"] in ("low", "moderate")
        assert result["prediction_type"] == "heart_disease"

    def test_high_risk(self, predictor):
        result = predictor.predict_heart_disease({
            "age": 65, "sex": 1, "chest_pain_type": 3,
            "resting_bp": 160, "cholesterol": 300,
            "max_heart_rate": 120, "exercise_angina": 1,
            "st_depression": 3.5,
        })
        assert result["risk_level"] in ("high", "critical")

    def test_result_has_recommendations(self, predictor):
        result = predictor.predict_heart_disease({
            "age": 50, "sex": 1, "chest_pain_type": 1,
            "resting_bp": 130, "cholesterol": 230,
        })
        assert len(result["recommendations"]) > 0
        assert all(isinstance(r, str) for r in result["recommendations"])


class TestGeneralHealthPrediction:
    def test_normal_vitals(self, predictor):
        result = predictor.predict_general_health({
            "age": 30, "blood_pressure_systolic": 118,
            "blood_pressure_diastolic": 76, "blood_glucose": 88, "bmi": 23,
        })
        assert result["risk_level"] == "low"

    def test_high_bp_increases_risk(self, predictor):
        normal = predictor.predict_general_health({
            "age": 40, "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80, "blood_glucose": 90, "bmi": 24,
        })
        high_bp = predictor.predict_general_health({
            "age": 40, "blood_pressure_systolic": 185,
            "blood_pressure_diastolic": 115, "blood_glucose": 90, "bmi": 24,
        })
        assert high_bp["risk_score"] > normal["risk_score"]

    def test_risk_to_level_mapping(self, predictor):
        assert predictor._score_to_risk(0.10) == "low"
        assert predictor._score_to_risk(0.35) == "moderate"
        assert predictor._score_to_risk(0.60) == "high"
        assert predictor._score_to_risk(0.80) == "critical"
