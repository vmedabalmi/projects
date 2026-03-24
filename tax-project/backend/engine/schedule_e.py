"""Schedule E — Supplemental Income (Rental Real Estate) calculation engine."""

from backend.models.taxpayer import ScheduleEData


def calculate_net_rental_income(schedule_e: ScheduleEData) -> float:
    """Calculate total net rental income/loss from all properties.

    Rental losses may be limited by passive activity rules:
    - Up to $25,000 of rental losses can offset ordinary income
      if AGI is below $100,000.
    - Phase-out: $1 reduction per $2 of AGI over $100,000.
    - Fully phased out at $150,000 AGI.

    This function returns the raw net income; passive loss limitation
    is applied in the main calculator with knowledge of AGI.
    """
    return round(schedule_e.total_net_income, 2)


def apply_passive_loss_limit(net_rental_income: float, agi_before_rental: float) -> float:
    """Apply passive activity loss limitation to rental losses.

    Returns the amount that can be used against ordinary income.
    """
    if net_rental_income >= 0:
        return net_rental_income

    loss = abs(net_rental_income)

    if agi_before_rental >= 150_000:
        return 0.0  # No rental loss deduction

    if agi_before_rental <= 100_000:
        allowed = min(loss, 25_000)
    else:
        # Phase-out: reduce $25k allowance by $1 per $2 over $100k
        excess = agi_before_rental - 100_000
        reduced_allowance = max(25_000 - (excess * 0.5), 0)
        allowed = min(loss, reduced_allowance)

    return round(-allowed, 2)
