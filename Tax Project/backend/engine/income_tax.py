"""1040 income tax calculation engine."""

from backend.models.tax_config import TaxYearConfig, get_config
from backend.models.taxpayer import (
    DeductionData,
    FilingStatus,
    IncomeData,
    TaxpayerProfile,
)


def get_standard_deduction(profile: TaxpayerProfile, config: TaxYearConfig) -> float:
    """Return the standard deduction for the given filing status."""
    return {
        FilingStatus.SINGLE: config.standard_deduction_single,
        FilingStatus.MARRIED_FILING_JOINTLY: config.standard_deduction_mfj,
        FilingStatus.MARRIED_FILING_SEPARATELY: config.standard_deduction_mfs,
        FilingStatus.HEAD_OF_HOUSEHOLD: config.standard_deduction_hoh,
    }[profile.filing_status]


def get_brackets(profile: TaxpayerProfile, config: TaxYearConfig) -> list[tuple[float, float]]:
    """Return the tax brackets for the given filing status."""
    return {
        FilingStatus.SINGLE: config.brackets_single,
        FilingStatus.MARRIED_FILING_JOINTLY: config.brackets_mfj,
        FilingStatus.MARRIED_FILING_SEPARATELY: config.brackets_mfs,
        FilingStatus.HEAD_OF_HOUSEHOLD: config.brackets_hoh,
    }[profile.filing_status]


def calculate_itemized_deductions(
    deductions: DeductionData, agi: float, config: TaxYearConfig
) -> float:
    """Calculate total itemized deductions."""
    # SALT capped at $10,000
    salt = min(deductions.state_and_local_taxes, 10_000)

    # Medical expenses: only amount exceeding 7.5% of AGI
    medical = max(deductions.medical_expenses - (agi * 0.075), 0)

    return salt + deductions.mortgage_interest + deductions.charitable_contributions + medical


def compute_tax_from_brackets(
    taxable_income: float, brackets: list[tuple[float, float]]
) -> float:
    """Compute tax using progressive brackets."""
    tax = 0.0
    prev_bound = 0.0

    for upper_bound, rate in brackets:
        if taxable_income <= prev_bound:
            break
        taxed_at_this_rate = min(taxable_income, upper_bound) - prev_bound
        tax += taxed_at_this_rate * rate
        prev_bound = upper_bound

    return round(tax, 2)


def get_marginal_rate(taxable_income: float, brackets: list[tuple[float, float]]) -> float:
    """Return the marginal tax rate for the given taxable income."""
    prev_bound = 0.0
    for upper_bound, rate in brackets:
        if taxable_income <= upper_bound:
            return rate
        prev_bound = upper_bound
    return brackets[-1][1]


def calculate_child_tax_credit(
    profile: TaxpayerProfile, agi: float, config: TaxYearConfig
) -> float:
    """Calculate the child tax credit with phase-out."""
    if profile.dependents_under_17 == 0:
        return 0.0

    full_credit = profile.dependents_under_17 * config.child_tax_credit_amount

    if profile.filing_status == FilingStatus.MARRIED_FILING_JOINTLY:
        threshold = config.child_tax_credit_phaseout_mfj
    else:
        threshold = config.child_tax_credit_phaseout_single

    if agi <= threshold:
        return full_credit

    # Phase-out: $50 reduction per $1,000 (or fraction thereof) over threshold
    excess = agi - threshold
    reduction = (int(excess / 1_000) + (1 if excess % 1_000 > 0 else 0)) * 50
    return max(full_credit - reduction, 0)


def calculate_total_income(income: IncomeData, schedule_c_net_profit: float) -> float:
    """Calculate total income (line 9 of 1040)."""
    return (
        income.w2_wages
        + income.interest_income
        + income.dividend_income
        + income.other_income
        + schedule_c_net_profit
    )
