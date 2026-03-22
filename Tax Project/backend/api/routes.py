"""API routes for the tax planner."""

from fastapi import APIRouter
from pydantic import BaseModel

from backend.engine.calculator import calculate
from backend.models.taxpayer import TaxInput, TaxResult

router = APIRouter()


class ScenarioRequest(BaseModel):
    scenario_a: TaxInput
    scenario_b: TaxInput


class ScenarioResponse(BaseModel):
    scenario_a: TaxResult
    scenario_b: TaxResult
    difference: float  # total_tax difference (a - b)


@router.post("/calculate", response_model=TaxResult)
def calculate_taxes(tax_input: TaxInput) -> TaxResult:
    """Calculate taxes for a single scenario."""
    return calculate(tax_input)


@router.post("/scenario", response_model=ScenarioResponse)
def compare_scenarios(request: ScenarioRequest) -> ScenarioResponse:
    """Compare two tax scenarios side by side."""
    result_a = calculate(request.scenario_a)
    result_b = calculate(request.scenario_b)
    difference = round(result_a.breakdown.total_tax - result_b.breakdown.total_tax, 2)
    return ScenarioResponse(
        scenario_a=result_a,
        scenario_b=result_b,
        difference=difference,
    )
