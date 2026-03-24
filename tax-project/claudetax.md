# claudetax.md

This file provides guidance to Claude Code when working with the Tax Project.

## Project Overview

A hybrid tax planning application for consumer-facing personal (1040) and Schedule C tax calculations. The backend is built with FastAPI and Pydantic, with a rule-based tax engine parameterized by tax year.

## Structure

```
Tax Project/
├── pyproject.toml              # Project metadata and dependencies
├── claudetax.md                # This file
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── models/
│   │   ├── tax_config.py       # Tax year config (brackets, limits, thresholds)
│   │   └── taxpayer.py         # Pydantic models for input/output
│   ├── engine/
│   │   ├── income_tax.py       # 1040 income tax calculations
│   │   ├── schedule_c.py       # Schedule C, SE tax, QBI, home office
│   │   └── calculator.py       # Main orchestrator
│   ├── api/
│   │   └── routes.py           # FastAPI endpoints
│   ├── rag/                    # (Future) RAG-based tax guidance
│   └── tests/
│       └── test_calculator.py  # Unit tests
├── frontend/                   # (Future) UI
└── data/                       # (Future) Tax reference data
```

## Development

### Install dependencies
```bash
cd "Tax Project"
pip install -e ".[dev]"
```

### Run the API server
```bash
uvicorn backend.main:app --reload
```

### Run tests
```bash
cd "Tax Project"
pytest backend/tests/
```

## Conventions

- All monetary values are `float`, rounded to 2 decimal places in output
- Tax year configuration lives in `backend/models/tax_config.py` — update here for new tax years
- Engine modules are pure functions (no side effects, no DB) for easy testing
- Pydantic models enforce input validation (`Field(ge=0)` etc.)
- Meals are 50% deductible on Schedule C
- SALT is capped at $10,000
- Home office uses the simplified method ($5/sqft, max 300 sqft)
- QBI deduction is simplified (full 20% below threshold, $0 above)

## Key Tax Rules Implemented

| Rule | Module |
|------|--------|
| Progressive tax brackets (2025) | `engine/income_tax.py` |
| Standard vs. itemized deduction | `engine/income_tax.py` |
| Child tax credit + phase-out | `engine/income_tax.py` |
| Self-employment tax (12.4% SS + 2.9% Medicare) | `engine/schedule_c.py` |
| SE tax deduction (50%) | `engine/schedule_c.py` |
| QBI deduction (20%) | `engine/schedule_c.py` |
| Home office (simplified method) | `engine/schedule_c.py` |
