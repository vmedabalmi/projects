"""Tests for Schedule D (Capital Gains) and Schedule E (Rental Income)."""

import pytest

from backend.engine.calculator import calculate
from backend.models.taxpayer import (
    CapitalGainEntry,
    FilingStatus,
    IncomeData,
    RentalProperty,
    ScheduleDData,
    ScheduleEData,
    TaxInput,
    TaxpayerProfile,
)


def test_long_term_capital_gain():
    """Long-term capital gain should be taxed at preferential rates."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=50_000),
        schedule_d=ScheduleDData(entries=[
            CapitalGainEntry(proceeds=30_000, cost_basis=10_000, is_long_term=True),
        ]),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.schedule_d_gain_or_loss == 20_000
    assert b.capital_gains_tax > 0
    assert b.total_income == 70_000


def test_short_term_capital_gain():
    """Short-term gains taxed as ordinary income (no separate cap gains tax)."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=50_000),
        schedule_d=ScheduleDData(entries=[
            CapitalGainEntry(proceeds=30_000, cost_basis=10_000, is_long_term=False),
        ]),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.schedule_d_gain_or_loss == 20_000
    assert b.capital_gains_tax == 0  # Short-term → ordinary rates
    assert b.total_income == 70_000


def test_capital_loss_limited_to_3000():
    """Net capital losses limited to $3,000 deduction."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=80_000),
        schedule_d=ScheduleDData(entries=[
            CapitalGainEntry(proceeds=5_000, cost_basis=20_000, is_long_term=True),
        ]),
    )
    result = calculate(tax_input)
    b = result.breakdown

    # Loss is $15,000 but capped at $3,000
    assert b.schedule_d_gain_or_loss == -3_000
    assert b.total_income == 77_000


def test_rental_income():
    """Rental income flows to AGI."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=60_000),
        schedule_e=ScheduleEData(properties=[
            RentalProperty(rents_received=24_000, mortgage_interest=8_000, taxes=3_000, insurance=1_500),
        ]),
    )
    result = calculate(tax_input)
    b = result.breakdown

    # Net rental: $24k - $12.5k = $11.5k
    assert b.schedule_e_net_income == 11_500
    assert b.total_income == 71_500


def test_rental_loss_passive_limit():
    """Rental losses limited by passive activity rules."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=90_000),
        schedule_e=ScheduleEData(properties=[
            RentalProperty(rents_received=12_000, mortgage_interest=15_000, depreciation=10_000, taxes=5_000),
        ]),
    )
    result = calculate(tax_input)
    b = result.breakdown

    # Net rental loss: $12k - $30k = -$18k, but limited to $25k (AGI < $100k)
    assert b.schedule_e_net_income == -18_000
    assert b.total_income == 72_000  # 90k - 18k


def test_rental_loss_phaseout():
    """Rental loss allowance phases out above $100k AGI."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=130_000),
        schedule_e=ScheduleEData(properties=[
            RentalProperty(rents_received=10_000, mortgage_interest=20_000, taxes=5_000),
        ]),
    )
    result = calculate(tax_input)
    b = result.breakdown

    # Net rental loss: -$15k
    # AGI before rental = $130k → excess over $100k = $30k
    # Allowance reduced by $30k * 0.5 = $15k → $25k - $15k = $10k allowed
    assert b.schedule_e_net_income == -10_000


def test_rental_loss_fully_phased_out():
    """Rental loss fully phased out at $150k+ AGI."""
    tax_input = TaxInput(
        profile=TaxpayerProfile(filing_status=FilingStatus.SINGLE),
        income=IncomeData(w2_wages=160_000),
        schedule_e=ScheduleEData(properties=[
            RentalProperty(rents_received=10_000, mortgage_interest=20_000),
        ]),
    )
    result = calculate(tax_input)
    b = result.breakdown

    assert b.schedule_e_net_income == 0  # Fully phased out
    assert b.total_income == 160_000


def test_qbi_phaseout_midrange():
    """QBI deduction partially reduced in phase-out range."""
    # Single threshold: $191,950; phase-out range: $50,000
    # Midpoint: ~$216,950 → should get ~50% of full QBI
    from backend.engine.schedule_c import calculate_qbi_deduction
    from backend.models.tax_config import get_config

    config = get_config(2025)
    profile = TaxpayerProfile(filing_status=FilingStatus.SINGLE)

    net_profit = 50_000
    taxable = 216_950  # $25k over threshold = 50% through phase-out

    qbi = calculate_qbi_deduction(net_profit, taxable, profile, config)

    # Full QBI would be 20% of $50k = $10k; at 50% phase-out → $5k
    assert qbi == 5_000


def test_qbi_fully_phased_out():
    """QBI deduction fully phased out above threshold + range."""
    from backend.engine.schedule_c import calculate_qbi_deduction
    from backend.models.tax_config import get_config

    config = get_config(2025)
    profile = TaxpayerProfile(filing_status=FilingStatus.SINGLE)

    qbi = calculate_qbi_deduction(50_000, 250_000, profile, config)
    assert qbi == 0.0


def test_qbi_mfj_phaseout():
    """MFJ has double the phase-out range ($100k)."""
    from backend.engine.schedule_c import calculate_qbi_deduction
    from backend.models.tax_config import get_config

    config = get_config(2025)
    profile = TaxpayerProfile(filing_status=FilingStatus.MARRIED_FILING_JOINTLY)

    # MFJ threshold: $383,900; phase-out range: $100,000
    # At $433,900 → $50k over = 50% through phase-out
    qbi = calculate_qbi_deduction(100_000, 433_900, profile, config)

    # Full QBI = 20% of $100k = $20k; at 50% → $10k
    assert qbi == 10_000
