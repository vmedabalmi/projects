"""Schedule D — Capital Gains and Losses calculation engine."""

from backend.models.tax_config import TaxYearConfig
from backend.models.taxpayer import FilingStatus, ScheduleDData, TaxpayerProfile

# 2025 long-term capital gains brackets (0%, 15%, 20%)
LTCG_BRACKETS_SINGLE = [
    (48_350, 0.0),
    (533_400, 0.15),
    (float("inf"), 0.20),
]
LTCG_BRACKETS_MFJ = [
    (96_700, 0.0),
    (600_050, 0.15),
    (float("inf"), 0.20),
]
LTCG_BRACKETS_MFS = [
    (48_350, 0.0),
    (300_000, 0.15),
    (float("inf"), 0.20),
]
LTCG_BRACKETS_HOH = [
    (64_750, 0.0),
    (566_700, 0.15),
    (float("inf"), 0.20),
]


def get_ltcg_brackets(filing_status: FilingStatus) -> list[tuple[float, float]]:
    return {
        FilingStatus.SINGLE: LTCG_BRACKETS_SINGLE,
        FilingStatus.MARRIED_FILING_JOINTLY: LTCG_BRACKETS_MFJ,
        FilingStatus.MARRIED_FILING_SEPARATELY: LTCG_BRACKETS_MFS,
        FilingStatus.HEAD_OF_HOUSEHOLD: LTCG_BRACKETS_HOH,
    }[filing_status]


def calculate_capital_gains_tax(
    schedule_d: ScheduleDData,
    taxable_income: float,
    profile: TaxpayerProfile,
    config: TaxYearConfig,
) -> float:
    """Calculate capital gains tax.

    - Short-term gains are taxed as ordinary income (handled in income_tax module).
    - Long-term gains get preferential rates (0%, 15%, 20%).
    - Capital losses are limited to $3,000 deduction against ordinary income.
    """
    net_ltcg = schedule_d.net_long_term
    if net_ltcg <= 0:
        return 0.0

    brackets = get_ltcg_brackets(profile.filing_status)
    tax = 0.0
    prev = 0.0

    # The LTCG fills from the bottom of the bracket space,
    # offset by ordinary taxable income
    ordinary_income = max(taxable_income - net_ltcg, 0)

    for upper, rate in brackets:
        if ordinary_income >= upper:
            prev = upper
            continue
        start = max(ordinary_income, prev)
        end = min(ordinary_income + net_ltcg, upper)
        if end <= start:
            prev = upper
            continue
        taxable_at_rate = end - start
        tax += taxable_at_rate * rate
        if end >= ordinary_income + net_ltcg:
            break
        prev = upper

    return round(tax, 2)


def calculate_net_gain_for_agi(schedule_d: ScheduleDData) -> float:
    """Calculate the amount that flows to AGI from Schedule D.

    - Net gains are fully included.
    - Net losses are limited to $3,000 ($1,500 MFS) deduction.
    """
    total = schedule_d.total_gain_or_loss
    if total >= 0:
        return total
    # Loss limited to $3,000
    return max(total, -3_000)
