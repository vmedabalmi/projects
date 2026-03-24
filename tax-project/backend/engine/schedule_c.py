"""Schedule C and self-employment tax calculation engine."""

from backend.models.tax_config import TaxYearConfig, get_config
from backend.models.taxpayer import FilingStatus, ScheduleCData, TaxpayerProfile


def calculate_home_office_deduction(schedule_c: ScheduleCData, config: TaxYearConfig) -> float:
    """Calculate home office deduction using the simplified method."""
    if schedule_c.home_office_sqft == 0:
        return 0.0
    sqft = min(schedule_c.home_office_sqft, config.home_office_max_sqft)
    return sqft * config.home_office_rate_per_sqft


def calculate_net_profit(schedule_c: ScheduleCData, config: TaxYearConfig) -> float:
    """Calculate Schedule C net profit after home office deduction."""
    home_office = calculate_home_office_deduction(schedule_c, config)
    return max(schedule_c.net_profit - home_office, 0)


def calculate_self_employment_tax(net_profit: float, config: TaxYearConfig) -> float:
    """Calculate self-employment tax (Social Security + Medicare).

    - 92.35% of net profit is subject to SE tax
    - Social Security: 12.4% up to wage base
    - Medicare: 2.9% on all SE earnings
    """
    if net_profit <= 0:
        return 0.0

    se_earnings = net_profit * 0.9235

    # Social Security portion (12.4%)
    ss_taxable = min(se_earnings, config.ss_wage_base)
    ss_tax = ss_taxable * 0.124

    # Medicare portion (2.9%)
    medicare_tax = se_earnings * 0.029

    return round(ss_tax + medicare_tax, 2)


def calculate_se_tax_deduction(se_tax: float) -> float:
    """Deductible portion of SE tax (50%) — goes on 1040 Schedule 1."""
    return round(se_tax * 0.5, 2)


def calculate_qbi_deduction(
    net_profit: float,
    taxable_income_before_qbi: float,
    profile: TaxpayerProfile,
    config: TaxYearConfig,
) -> float:
    """Calculate Qualified Business Income (QBI) deduction with phase-out.

    Below threshold: full 20% of QBI (capped at 20% of taxable income).
    In phase-out range: linearly reduced from full to zero.
    Above threshold + range: no deduction.

    Phase-out range is $50,000 for single/HoH/MFS, $100,000 for MFJ.
    """
    if net_profit <= 0:
        return 0.0

    if profile.filing_status == FilingStatus.MARRIED_FILING_JOINTLY:
        threshold = config.qbi_income_threshold_mfj
        phaseout_range = config.qbi_phaseout_range * 2  # $100k for MFJ
    else:
        threshold = config.qbi_income_threshold_single
        phaseout_range = config.qbi_phaseout_range  # $50k

    full_qbi = net_profit * config.qbi_deduction_rate
    # Cannot exceed 20% of taxable income before QBI
    max_deduction = taxable_income_before_qbi * config.qbi_deduction_rate
    full_qbi = min(full_qbi, max_deduction)

    if taxable_income_before_qbi <= threshold:
        return round(full_qbi, 2)

    if taxable_income_before_qbi >= threshold + phaseout_range:
        return 0.0

    # In phase-out range: linear reduction
    excess = taxable_income_before_qbi - threshold
    reduction_pct = excess / phaseout_range
    reduced_qbi = full_qbi * (1 - reduction_pct)
    return round(max(reduced_qbi, 0), 2)
