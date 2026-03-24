// Tax Engine — 2025 Federal Tax Calculator (1040 + Schedule C)
// Ported from Python backend for client-side use on static hosts (e.g. Netlify)

const TAX_CONFIG_2025 = {
  year: 2025,
  standardDeduction: {
    single: 15000,
    married_filing_jointly: 30000,
    married_filing_separately: 15000,
    head_of_household: 22500,
  },
  brackets: {
    single: [
      [11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24],
      [250525, 0.32], [626350, 0.35], [Infinity, 0.37],
    ],
    married_filing_jointly: [
      [23850, 0.10], [96950, 0.12], [206700, 0.22], [394600, 0.24],
      [501050, 0.32], [751600, 0.35], [Infinity, 0.37],
    ],
    married_filing_separately: [
      [11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24],
      [250525, 0.32], [375800, 0.35], [Infinity, 0.37],
    ],
    head_of_household: [
      [17000, 0.10], [64850, 0.12], [103350, 0.22], [197300, 0.24],
      [250500, 0.32], [626350, 0.35], [Infinity, 0.37],
    ],
  },
  seTaxRate: 0.153,
  ssWageBase: 176100,
  additionalMedicareThresholdSingle: 200000,
  additionalMedicareRate: 0.009,
  qbiDeductionRate: 0.20,
  qbiIncomeThreshold: { single: 191950, married_filing_jointly: 383900, married_filing_separately: 191950, head_of_household: 191950 },
  qbiPhaseoutRange: 50000,
  homeOfficeRatePerSqft: 5.0,
  homeOfficeMaxSqft: 300,
  childTaxCreditAmount: 2000,
  childTaxCreditPhaseout: { single: 200000, married_filing_jointly: 400000, married_filing_separately: 200000, head_of_household: 200000 },
};

function r2(n) { return Math.round(n * 100) / 100; }

// --- Schedule C ---
function calcHomeOfficeDeduction(sc, config) {
  if (!sc || !sc.home_office_sqft) return 0;
  const sqft = Math.min(sc.home_office_sqft, config.homeOfficeMaxSqft);
  return sqft * config.homeOfficeRatePerSqft;
}

function calcScheduleCExpenses(sc) {
  return (sc.advertising || 0) + (sc.car_and_truck || 0) + (sc.commissions_and_fees || 0)
    + (sc.depreciation || 0) + (sc.insurance || 0) + (sc.interest_mortgage || 0)
    + (sc.interest_other || 0) + (sc.legal_and_professional || 0) + (sc.office_expense || 0)
    + (sc.rent_or_lease || 0) + (sc.repairs_and_maintenance || 0) + (sc.supplies || 0)
    + (sc.taxes_and_licenses || 0) + (sc.travel || 0) + ((sc.meals || 0) * 0.5)
    + (sc.utilities || 0) + (sc.other_expenses || 0);
}

function calcNetProfit(sc, config) {
  const expenses = calcScheduleCExpenses(sc);
  const homeOffice = calcHomeOfficeDeduction(sc, config);
  return Math.max((sc.gross_income || 0) - expenses - homeOffice, 0);
}

function calcSelfEmploymentTax(netProfit, config) {
  if (netProfit <= 0) return 0;
  const seEarnings = netProfit * 0.9235;
  const ssTaxable = Math.min(seEarnings, config.ssWageBase);
  const ssTax = ssTaxable * 0.124;
  const medicareTax = seEarnings * 0.029;
  return r2(ssTax + medicareTax);
}

function calcSeTaxDeduction(seTax) {
  return r2(seTax * 0.5);
}

function calcQbiDeduction(netProfit, taxableIncomeBeforeQbi, filingStatus, config) {
  if (netProfit <= 0) return 0;
  const threshold = config.qbiIncomeThreshold[filingStatus] || config.qbiIncomeThreshold.single;
  const phaseoutRange = filingStatus === 'married_filing_jointly'
    ? config.qbiPhaseoutRange * 2 : config.qbiPhaseoutRange;

  let fullQbi = netProfit * config.qbiDeductionRate;
  const maxDeduction = taxableIncomeBeforeQbi * config.qbiDeductionRate;
  fullQbi = Math.min(fullQbi, maxDeduction);

  if (taxableIncomeBeforeQbi <= threshold) return r2(fullQbi);
  if (taxableIncomeBeforeQbi >= threshold + phaseoutRange) return 0;

  const excess = taxableIncomeBeforeQbi - threshold;
  const reductionPct = excess / phaseoutRange;
  return r2(Math.max(fullQbi * (1 - reductionPct), 0));
}

// --- Income Tax ---
function getStandardDeduction(filingStatus, config) {
  return config.standardDeduction[filingStatus] || config.standardDeduction.single;
}

function calcItemizedDeductions(deductions, agi) {
  const salt = Math.min(deductions.state_and_local_taxes || 0, 10000);
  const medical = Math.max((deductions.medical_expenses || 0) - (agi * 0.075), 0);
  return salt + (deductions.mortgage_interest || 0) + (deductions.charitable_contributions || 0) + medical;
}

function computeTaxFromBrackets(taxableIncome, brackets) {
  let tax = 0;
  let prevBound = 0;
  for (const [upperBound, rate] of brackets) {
    if (taxableIncome <= prevBound) break;
    const taxedAtRate = Math.min(taxableIncome, upperBound) - prevBound;
    tax += taxedAtRate * rate;
    prevBound = upperBound;
  }
  return r2(tax);
}

function getMarginalRate(taxableIncome, brackets) {
  for (const [upperBound, rate] of brackets) {
    if (taxableIncome <= upperBound) return rate;
  }
  return brackets[brackets.length - 1][1];
}

function calcChildTaxCredit(profile, agi, config) {
  if (!profile.dependents_under_17) return 0;
  const fullCredit = profile.dependents_under_17 * config.childTaxCreditAmount;
  const threshold = config.childTaxCreditPhaseout[profile.filing_status]
    || config.childTaxCreditPhaseout.single;
  if (agi <= threshold) return fullCredit;
  const excess = agi - threshold;
  const reduction = (Math.floor(excess / 1000) + (excess % 1000 > 0 ? 1 : 0)) * 50;
  return Math.max(fullCredit - reduction, 0);
}

function calcTotalIncome(income, scNetProfit) {
  return (income.w2_wages || 0) + (income.interest_income || 0)
    + (income.dividend_income || 0) + (income.other_income || 0) + scNetProfit;
}

// --- Main Calculator ---
function calculate(taxInput) {
  const config = TAX_CONFIG_2025;
  const profile = taxInput.profile || {};
  const income = taxInput.income || {};
  const deductions = taxInput.deductions || {};
  const sc = taxInput.schedule_c;
  const filingStatus = profile.filing_status || 'single';

  // Schedule C
  let homeOffice = 0, scNetProfit = 0, seTax = 0, seDeduction = 0;
  if (sc && (sc.gross_income || 0) > 0) {
    homeOffice = calcHomeOfficeDeduction(sc, config);
    scNetProfit = calcNetProfit(sc, config);
    seTax = calcSelfEmploymentTax(scNetProfit, config);
    seDeduction = calcSeTaxDeduction(seTax);
  }

  // Total income & AGI
  const totalIncome = calcTotalIncome(income, scNetProfit);
  const agi = totalIncome - seDeduction;

  // Deductions
  const standardDeduction = getStandardDeduction(filingStatus, config);
  const itemizedDeduction = calcItemizedDeductions(deductions, agi);
  let deductionUsed, deductionAmount;
  if (itemizedDeduction > standardDeduction) {
    deductionUsed = 'itemized';
    deductionAmount = itemizedDeduction;
  } else {
    deductionUsed = 'standard';
    deductionAmount = standardDeduction;
  }

  // Taxable income before QBI
  const taxableIncomeBeforeQbi = Math.max(agi - deductionAmount, 0);

  // QBI
  let qbi = 0;
  if (sc && scNetProfit > 0) {
    qbi = calcQbiDeduction(scNetProfit, taxableIncomeBeforeQbi, filingStatus, config);
  }

  // Taxable income
  const taxableIncome = Math.max(taxableIncomeBeforeQbi - qbi, 0);

  // Federal tax
  const brackets = config.brackets[filingStatus] || config.brackets.single;
  const federalTax = computeTaxFromBrackets(taxableIncome, brackets);
  const marginalRate = getMarginalRate(taxableIncome, brackets);

  // Credits
  const childCredit = calcChildTaxCredit(
    { filing_status: filingStatus, dependents_under_17: profile.dependents_under_17 || 0 },
    agi, config
  );

  // Totals
  const incomeTaxAfterCredits = Math.max(federalTax - childCredit, 0);
  const totalTax = r2(incomeTaxAfterCredits + seTax);
  const effectiveRate = totalIncome > 0 ? r2(totalTax / totalIncome * 10000) / 10000 : 0;

  return {
    breakdown: {
      total_income: r2(totalIncome),
      schedule_c_net_profit: r2(scNetProfit),
      adjusted_gross_income: r2(agi),
      standard_deduction: r2(standardDeduction),
      itemized_deduction: r2(itemizedDeduction),
      deduction_used: deductionUsed,
      deduction_amount: r2(deductionAmount),
      taxable_income: r2(taxableIncome),
      income_tax: r2(federalTax),
      self_employment_tax: r2(seTax),
      se_tax_deduction: r2(seDeduction),
      child_tax_credit: r2(childCredit),
      qbi_deduction: r2(qbi),
      home_office_deduction: r2(homeOffice),
      total_tax: totalTax,
      effective_rate: effectiveRate,
      marginal_rate: marginalRate,
    },
  };
}
