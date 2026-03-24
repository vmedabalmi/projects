"""Integration tests for the API endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_calculate_simple_w2():
    payload = {
        "profile": {"filing_status": "single", "dependents_under_17": 0},
        "income": {"w2_wages": 75000},
    }
    resp = client.post("/api/calculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    b = data["breakdown"]
    assert b["total_income"] == 75000
    assert b["deduction_used"] == "standard"
    assert b["total_tax"] > 0
    assert data["filing_status"] == "single"
    assert data["tax_year"] == 2025


def test_calculate_with_schedule_c():
    payload = {
        "profile": {"filing_status": "single"},
        "income": {},
        "schedule_c": {
            "gross_income": 100000,
            "office_expense": 2000,
            "supplies": 500,
            "home_office_sqft": 150,
        },
    }
    resp = client.post("/api/calculate", json=payload)
    assert resp.status_code == 200
    b = resp.json()["breakdown"]

    assert b["schedule_c_net_profit"] > 0
    assert b["self_employment_tax"] > 0
    assert b["qbi_deduction"] > 0
    assert b["home_office_deduction"] == 750  # 150 × $5


def test_calculate_mfj_with_children():
    payload = {
        "profile": {
            "filing_status": "married_filing_jointly",
            "dependents_under_17": 3,
        },
        "income": {"w2_wages": 120000},
    }
    resp = client.post("/api/calculate", json=payload)
    assert resp.status_code == 200
    b = resp.json()["breakdown"]

    assert b["child_tax_credit"] == 6000  # 3 × $2,000
    assert b["deduction_amount"] == 30000  # MFJ standard


def test_calculate_defaults():
    """Empty payload should use all defaults and return zero tax."""
    resp = client.post("/api/calculate", json={})
    assert resp.status_code == 200
    assert resp.json()["breakdown"]["total_tax"] == 0


def test_calculate_validation_error():
    """Negative wages should fail validation."""
    payload = {"income": {"w2_wages": -5000}}
    resp = client.post("/api/calculate", json=payload)
    assert resp.status_code == 422


def test_scenario_comparison():
    scenario_a = {
        "profile": {"filing_status": "single"},
        "income": {"w2_wages": 80000},
    }
    scenario_b = {
        "profile": {"filing_status": "single"},
        "income": {"w2_wages": 80000},
        "schedule_c": {"gross_income": 20000, "office_expense": 5000},
    }
    payload = {"scenario_a": scenario_a, "scenario_b": scenario_b}
    resp = client.post("/api/scenario", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "scenario_a" in data
    assert "scenario_b" in data
    assert "difference" in data
    # Scenario B has more income → higher tax → difference should be negative
    assert data["difference"] < 0


def test_scenario_same_inputs():
    """Identical scenarios should have zero difference."""
    scenario = {
        "profile": {"filing_status": "single"},
        "income": {"w2_wages": 50000},
    }
    payload = {"scenario_a": scenario, "scenario_b": scenario}
    resp = client.post("/api/scenario", json=payload)
    assert resp.status_code == 200
    assert resp.json()["difference"] == 0
