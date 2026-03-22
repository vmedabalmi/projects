"""Unit tests for the tax calculation engine."""

import pytest

from backend.engine.calculator import calculate
from backend.models.taxpayer import (
    DeductionData,
    FilingStatus,
    IncomeData,
    ScheduleCData,
    TaxInput,
    TaxpayerProfile,
)


def test_simple_w2_single_filer():
    """Single filer with $75k W-2 wages, no other income."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=75_000),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.total_income == 75_000
    assert b.deduction_used == "standard"
    assert b.deduction_amount == 15_000
    assert b.taxable_income == 60_000
    assert b.self_employment_tax == 0
    assert b.total_tax > 0
    assert 0 < b.effective_rate < 0.25


def test_w2_with_children():
    """Single filer with $75k wages and 2 children under 17."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(
            filing_status=FilingStatus.SINGLE,
            dependents_under_17=2,
        ),
        income=IncomeData(w2_wages=75_000),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.child_tax_credit == 4_000  # 2 × $2,000
    assert b.total_tax < 75_000 * 0.15  # effective rate well below marginal


def test_child_tax_credit_phaseout():
    """High earner should see child credit phased out."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(
            filing_status=FilingStatus.SINGLE,
            dependents_under_17=1,
        ),
        income=IncomeData(w2_wages=250_000),
    )
    result = calculate(tax_input)
    b = result.breakdown

    # AGI of $250k is $50k over $200k threshold → $50 × 50 = $2,500 reduction
    # Full credit is $2,000, so it should be reduced to $0
    assert b.child_tax_credit == 0


def test_schedule_c_freelancer():
    """Freelancer with $120k gross income, various expenses."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(),
        schedule_c=ScheduleCData(
            gross_income=120_000,
            advertising=1_000,
            office_expense=2_000,
            supplies=500,
            travel=3_000,
            meals=2_000,  # only $1,000 deductible
            utilities=1_200,
            home_office_sqft=200,
        ),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.schedule_c_net_profit > 0
    assert b.self_employment_tax > 0
    assert b.se_tax_deduction > 0
    assert b.qbi_deduction > 0
    assert b.home_office_deduction == 1_000  # 200 sqft × $5


def test_itemized_deductions_chosen():
    """When itemized deductions exceed standard, itemized should be used."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=200_000),
        deductions=DeductionData(
            mortgage_interest=12_000,
            state_and_local_taxes=10_000,
            charitable_contributions=5_000,
        ),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.deduction_used == "itemized"
    # SALT capped at $10k → $12k + $10k + $5k = $27k
    assert b.itemized_deduction == 27_000


def test_salt_cap():
    """SALT should be capped at $10,000."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=100_000),
        deductions=DeductionData(state_and_local_taxes=25_000),
    )
    result = calculate(tax_input)
    b = result.breakdown

    # Only $10k should be counted, which is below $15k standard deduction
    assert b.itemized_deduction == 10_000
    assert b.deduction_used == "standard"


def test_zero_income():
    """Zero income should produce zero tax."""
    tax_input = TaxInput()
    result = calculate(tax_input)
    b = result.breakdown

    assert b.total_income == 0
    assert b.total_tax == 0
    assert b.effective_rate == 0


def test_married_filing_jointly():
    """MFJ couple with $150k W-2 wages."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.MARRIED_FILING_JOINTLY),
        income=IncomeData(w2_wages=150_000),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.deduction_amount == 30_000  # MFJ standard deduction
    assert b.taxable_income == 120_000
    assert b.total_tax > 0


def test_home_office_max_sqft():
    """Home office sqft should be capped at 300."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        schedule_c=ScheduleCData(
            gross_income=100_000,
            home_office_sqft=300,  # max allowed by Pydantic model
        ),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.home_office_deduction == 1_500  # 300 × $5


def test_marginal_rate_single_60k():
    """$60k taxable income for single filer should be in 22% bracket."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=75_000),
    )
    result = calculate(tax_input)

    # Taxable: $75k - $15k standard = $60k → in 22% bracket ($48,475–$103,350)
    assert result.breakdown.marginal_rate == 0.22


def test_medical_expense_threshold():
    """Medical expenses only deductible above 7.5% of AGI."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=100_000),
        deductions=DeductionData(
            medical_expenses=10_000,
            mortgage_interest=8_000,
            state_and_local_taxes=5_000,
        ),
    )
    result = calculate(tax_input)
    b = result.breakdown

    # Medical: $10k - 7.5% of $100k = $10k - $7,500 = $2,500
    # Total itemized: $5k SALT + $8k mortgage + $2,500 medical = $15,500
    assert b.itemized_deduction == 15_500
    assert b.deduction_used == "itemized"
