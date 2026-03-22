"""Pydantic models for taxpayer input data and tax results."""

from enum import Enum

from pydantic import BaseModel, Field


class FilingStatus(str, Enum):
    SINGLE = "single"
    MARRIED_FILING_JOINTLY = "married_filing_jointly"
    MARRIED_FILING_SEPARATELY = "married_filing_separately"
    HEAD_OF_HOUSEHOLD = "head_of_household"


class TaxpayerProfile(BaseModel):
    filing_status: FilingStatus = FilingStatus.SINGLE
    age: int = Field(ge=0, le=120, default=30)
    dependents_under_17: int = Field(ge=0, default=0)
    tax_year: int = Field(default=2025)


class IncomeData(BaseModel):
    w2_wages: float = Field(ge=0, default=0)
    interest_income: float = Field(ge=0, default=0)
    dividend_income: float = Field(ge=0, default=0)
    other_income: float = Field(ge=0, default=0)


class ScheduleCData(BaseModel):
    gross_income: float = Field(ge=0, default=0)
    advertising: float = Field(ge=0, default=0)
    car_and_truck: float = Field(ge=0, default=0)
    commissions_and_fees: float = Field(ge=0, default=0)
    depreciation: float = Field(ge=0, default=0)
    insurance: float = Field(ge=0, default=0)
    interest_mortgage: float = Field(ge=0, default=0)
    interest_other: float = Field(ge=0, default=0)
    legal_and_professional: float = Field(ge=0, default=0)
    office_expense: float = Field(ge=0, default=0)
    rent_or_lease: float = Field(ge=0, default=0)
    repairs_and_maintenance: float = Field(ge=0, default=0)
    supplies: float = Field(ge=0, default=0)
    taxes_and_licenses: float = Field(ge=0, default=0)
    travel: float = Field(ge=0, default=0)
    meals: float = Field(ge=0, default=0)  # 50% deductible
    utilities: float = Field(ge=0, default=0)
    other_expenses: float = Field(ge=0, default=0)
    home_office_sqft: int = Field(ge=0, le=300, default=0)

    @property
    def total_expenses(self) -> float:
        return (
            self.advertising
            + self.car_and_truck
            + self.commissions_and_fees
            + self.depreciation
            + self.insurance
            + self.interest_mortgage
            + self.interest_other
            + self.legal_and_professional
            + self.office_expense
            + self.rent_or_lease
            + self.repairs_and_maintenance
            + self.supplies
            + self.taxes_and_licenses
            + self.travel
            + (self.meals * 0.5)  # Only 50% deductible
            + self.utilities
            + self.other_expenses
        )

    @property
    def net_profit(self) -> float:
        return self.gross_income - self.total_expenses


class DeductionData(BaseModel):
    mortgage_interest: float = Field(ge=0, default=0)
    state_and_local_taxes: float = Field(ge=0, default=0)  # SALT, capped at $10k
    charitable_contributions: float = Field(ge=0, default=0)
    medical_expenses: float = Field(ge=0, default=0)


class TaxInput(BaseModel):
    profile: TaxpayerProfile = TaxpayerProfile()
    income: IncomeData = IncomeData()
    schedule_c: ScheduleCData | None = None
    deductions: DeductionData = DeductionData()


class TaxBreakdown(BaseModel):
    # Income
    total_income: float
    schedule_c_net_profit: float
    adjusted_gross_income: float

    # Deductions
    standard_deduction: float
    itemized_deduction: float
    deduction_used: str  # "standard" or "itemized"
    deduction_amount: float

    # Taxable income
    taxable_income: float

    # Tax
    income_tax: float
    self_employment_tax: float
    se_tax_deduction: float
    child_tax_credit: float
    qbi_deduction: float
    home_office_deduction: float

    # Totals
    total_tax: float
    effective_rate: float
    marginal_rate: float


class TaxResult(BaseModel):
    breakdown: TaxBreakdown
    tax_year: int
    filing_status: str
