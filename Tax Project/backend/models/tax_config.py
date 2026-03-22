"""Tax year configuration — brackets, limits, and thresholds.

All values parameterized by tax year so annual updates are a single edit.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class TaxYearConfig:
    year: int

    # Standard deductions
    standard_deduction_single: float
    standard_deduction_mfj: float  # Married Filing Jointly
    standard_deduction_mfs: float  # Married Filing Separately
    standard_deduction_hoh: float  # Head of Household

    # Tax brackets: list of (upper_bound, rate) tuples.
    # The last entry should use float('inf') as upper bound.
    brackets_single: list[tuple[float, float]]
    brackets_mfj: list[tuple[float, float]]
    brackets_mfs: list[tuple[float, float]]
    brackets_hoh: list[tuple[float, float]]

    # Self-employment tax
    se_tax_rate: float  # Combined rate (12.4% SS + 2.9% Medicare)
    ss_wage_base: float  # Social Security wage base cap
    additional_medicare_threshold_single: float
    additional_medicare_rate: float  # 0.9%

    # QBI deduction
    qbi_deduction_rate: float  # 20%
    qbi_income_threshold_single: float
    qbi_income_threshold_mfj: float

    # Home office simplified method
    home_office_rate_per_sqft: float  # $5
    home_office_max_sqft: int  # 300

    # Child tax credit
    child_tax_credit_amount: float
    child_tax_credit_phaseout_single: float
    child_tax_credit_phaseout_mfj: float


# 2025 Tax Year (values based on IRS inflation adjustments)
TAX_YEAR_2025 = TaxYearConfig(
    year=2025,
    standard_deduction_single=15_000,
    standard_deduction_mfj=30_000,
    standard_deduction_mfs=15_000,
    standard_deduction_hoh=22_500,
    brackets_single=[
        (11_925, 0.10),
        (48_475, 0.12),
        (103_350, 0.22),
        (197_300, 0.24),
        (250_525, 0.32),
        (626_350, 0.35),
        (float("inf"), 0.37),
    ],
    brackets_mfj=[
        (23_850, 0.10),
        (96_950, 0.12),
        (206_700, 0.22),
        (394_600, 0.24),
        (501_050, 0.32),
        (751_600, 0.35),
        (float("inf"), 0.37),
    ],
    brackets_mfs=[
        (11_925, 0.10),
        (48_475, 0.12),
        (103_350, 0.22),
        (197_300, 0.24),
        (250_525, 0.32),
        (375_800, 0.35),
        (float("inf"), 0.37),
    ],
    brackets_hoh=[
        (17_000, 0.10),
        (64_850, 0.12),
        (103_350, 0.22),
        (197_300, 0.24),
        (250_500, 0.32),
        (626_350, 0.35),
        (float("inf"), 0.37),
    ],
    se_tax_rate=0.153,
    ss_wage_base=176_100,
    additional_medicare_threshold_single=200_000,
    additional_medicare_rate=0.009,
    qbi_deduction_rate=0.20,
    qbi_income_threshold_single=191_950,
    qbi_income_threshold_mfj=383_900,
    home_office_rate_per_sqft=5.0,
    home_office_max_sqft=300,
    child_tax_credit_amount=2_000,
    child_tax_credit_phaseout_single=200_000,
    child_tax_credit_phaseout_mfj=400_000,
)

CONFIGS = {2025: TAX_YEAR_2025}


def get_config(year: int = 2025) -> TaxYearConfig:
    if year not in CONFIGS:
        raise ValueError(f"Tax year {year} is not supported. Available: {list(CONFIGS.keys())}")
    return CONFIGS[year]
