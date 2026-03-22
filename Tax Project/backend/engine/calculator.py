"""Main tax calculator — orchestrates all engine modules."""

from backend.models.tax_config import get_config
from backend.models.taxpayer import (
    TaxBreakdown,
    TaxInput,
    TaxResult,
)

from . import income_tax, schedule_c


def calculate(tax_input: TaxInput) -> TaxResult:
    """Run a full tax calculation and return the result."""
    config = get_config(tax_input.profile.tax_year)
    profile = tax_input.profile
    income = tax_input.income

    # --- Schedule C ---
    sc = tax_input.schedule_c
    if sc and sc.gross_income > 0:
        home_office = schedule_c.calculate_home_office_deduction(sc, config)
        sc_net_profit = schedule_c.calculate_net_profit(sc, config)
        se_tax = schedule_c.calculate_self_employment_tax(sc_net_profit, config)
        se_deduction = schedule_c.calculate_se_tax_deduction(se_tax)
    else:
        home_office = 0.0
        sc_net_profit = 0.0
        se_tax = 0.0
        se_deduction = 0.0

    # --- Total income & AGI ---
    total_income = income_tax.calculate_total_income(income, sc_net_profit)
    agi = total_income - se_deduction

    # --- Deductions ---
    standard_deduction = income_tax.get_standard_deduction(profile, config)
    itemized_deduction = income_tax.calculate_itemized_deductions(
        tax_input.deductions, agi, config
    )

    if itemized_deduction > standard_deduction:
        deduction_used = "itemized"
        deduction_amount = itemized_deduction
    else:
        deduction_used = "standard"
        deduction_amount = standard_deduction

    # --- Taxable income (before QBI) ---
    taxable_income_before_qbi = max(agi - deduction_amount, 0)

    # --- QBI deduction ---
    if sc and sc_net_profit > 0:
        qbi = schedule_c.calculate_qbi_deduction(
            sc_net_profit, taxable_income_before_qbi, profile, config
        )
    else:
        qbi = 0.0

    # --- Taxable income ---
    taxable_income = max(taxable_income_before_qbi - qbi, 0)

    # --- Income tax ---
    brackets = income_tax.get_brackets(profile, config)
    federal_tax = income_tax.compute_tax_from_brackets(taxable_income, brackets)
    marginal_rate = income_tax.get_marginal_rate(taxable_income, brackets)

    # --- Credits ---
    child_credit = income_tax.calculate_child_tax_credit(profile, agi, config)

    # --- Totals ---
    income_tax_after_credits = max(federal_tax - child_credit, 0)
    total_tax = round(income_tax_after_credits + se_tax, 2)
    effective_rate = round(total_tax / total_income, 4) if total_income > 0 else 0.0

    breakdown = TaxBreakdown(
        total_income=round(total_income, 2),
        schedule_c_net_profit=round(sc_net_profit, 2),
        adjusted_gross_income=round(agi, 2),
        standard_deduction=round(standard_deduction, 2),
        itemized_deduction=round(itemized_deduction, 2),
        deduction_used=deduction_used,
        deduction_amount=round(deduction_amount, 2),
        taxable_income=round(taxable_income, 2),
        income_tax=round(federal_tax, 2),
        self_employment_tax=round(se_tax, 2),
        se_tax_deduction=round(se_deduction, 2),
        child_tax_credit=round(child_credit, 2),
        qbi_deduction=round(qbi, 2),
        home_office_deduction=round(home_office, 2),
        total_tax=total_tax,
        effective_rate=effective_rate,
        marginal_rate=marginal_rate,
    )

    return TaxResult(
        breakdown=breakdown,
        tax_year=profile.tax_year,
        filing_status=profile.filing_status.value,
    )
