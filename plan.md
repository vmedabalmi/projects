# Tax Planning Application — Implementation Plan

## Overview
A consumer-facing tax planning application for personal (1040) and Schedule C taxes. Uses a hybrid architecture: structured rule engine for calculations, RAG over IRS publications for guidance, and Claude API for explanations and planning advice.

## Target Users
- Consumers filing personal income taxes (1040)
- Sole proprietors / freelancers filing Schedule C

---

## Phase 1: Project Setup & Tax Rule Engine

### 1.1 Project scaffolding
- Create `tax-planner/` directory
- Set up Python project with FastAPI
- Add `pyproject.toml` with dependencies: `fastapi`, `uvicorn`, `pydantic`
- Create folder structure:
  ```
  tax-planner/
  ├── backend/
  │   ├── main.py              # FastAPI app entry point
  │   ├── models/              # Pydantic models for tax data
  │   ├── engine/              # Tax calculation modules
  │   ├── rag/                 # RAG pipeline (Phase 2)
  │   ├── api/                 # API route handlers
  │   └── tests/
  ├── frontend/                # React or HTML frontend (Phase 4)
  └── data/                    # IRS publications (Phase 2)
  ```

### 1.2 Tax data models
- `TaxpayerProfile`: filing status, dependents, age, state
- `IncomeData`: W-2 wages, interest, dividends, other income
- `ScheduleCData`: business income, expense categories (advertising, car/truck, depreciation, insurance, supplies, home office, etc.)
- `DeductionData`: itemized deductions (mortgage interest, SALT, charitable, medical)
- `TaxResult`: computed tax, effective rate, marginal rate, refund/owed

### 1.3 1040 calculation engine
- Tax bracket computation (2025 brackets, indexed for inflation)
- Standard deduction vs. itemized deduction comparison
- Adjusted Gross Income (AGI) calculation
- Taxable income calculation
- Child tax credit, earned income credit (basic eligibility)
- Estimated tax owed / refund

### 1.4 Schedule C calculation engine
- Net profit/loss calculation from income and categorized expenses
- Self-employment tax (15.3% with SS wage base cap)
- SE tax deduction (50% of SE tax on 1040)
- Qualified Business Income (QBI) deduction (20%, with income phase-outs)
- Home office deduction (simplified method: $5/sq ft up to 300 sq ft)

### 1.5 Tests
- Unit tests for each calculation module using known tax scenarios
- Edge cases: zero income, losses, phase-out boundaries

---

## Phase 2: RAG Pipeline over IRS Publications

### 2.1 Document ingestion
- Download IRS publications as PDFs:
  - Pub 334 (Small Business Tax Guide)
  - Pub 535 (Business Expenses)
  - Pub 505 (Estimated Tax)
  - Pub 17 (Your Federal Income Tax — for individuals)
- Extract text from PDFs using `pymupdf` or `pdfplumber`

### 2.2 Chunking strategy
- Chunk by section headings within each publication
- Keep chunks ~500 tokens with ~50 token overlap
- Preserve section title and publication source as metadata

### 2.3 Embedding and vector store
- Use `sentence-transformers` with `all-MiniLM-L6-v2` for embeddings
- Store in ChromaDB (lightweight, file-based, no server needed)
- Index metadata: publication number, section title, topic tags

### 2.4 Retrieval function
- Query function: takes a user question, returns top-k relevant chunks
- Add a reranking step if retrieval quality is insufficient
- Expose as internal module used by the API layer

---

## Phase 3: Claude API Integration

### 3.1 Core LLM service
- Set up Anthropic Python SDK (`anthropic`)
- Create a service module that takes:
  - User question
  - Tax calculation results (from engine)
  - Retrieved publication context (from RAG)
- Constructs a prompt with system instructions:
  - "You are a tax planning assistant for consumers"
  - "Use the provided IRS publication excerpts as your source"
  - "Never invent tax rules — if unsure, say so"
  - "Include disclaimers that this is not professional tax advice"

### 3.2 Planning scenarios
- "What if" analysis: user changes inputs, sees tax impact
  - Example: "What if I increase my home office from 100 to 300 sq ft?"
  - Engine recalculates, Claude explains the difference
- Quarterly estimated tax projection based on YTD income
- Deduction optimization: Claude suggests commonly missed Schedule C deductions based on business type

### 3.3 API endpoints
- `POST /api/calculate` — run the tax engine, return results
- `POST /api/ask` — ask a tax question (RAG + Claude)
- `POST /api/scenario` — run a "what if" comparison
- `GET /api/profile` — get/save taxpayer profile (in-memory or SQLite for MVP)

---

## Phase 4: Frontend

### 4.1 Tax input wizard
- Step-by-step form: filing status → income → Schedule C → deductions → review
- Client-side validation for numeric fields
- Progress indicator

### 4.2 Results dashboard
- Summary: total tax, effective rate, refund/owed
- Breakdown: income, deductions, credits, SE tax
- Side-by-side "what if" comparison view

### 4.3 Chat interface
- Simple chat panel for asking tax questions
- Shows retrieved IRS publication sources with each answer
- Suggested questions based on the user's tax situation

### 4.4 Tech choice
- React with a component library (e.g., shadcn/ui) for quick UI
- Or vanilla HTML/JS if keeping it minimal

---

## Phase 5: Polish & Safeguards

### 5.1 Disclaimers and guardrails
- Prominent disclaimer: "This is not professional tax advice"
- Claude system prompt prevents giving advice on audit defense, tax evasion, or complex situations (partnerships, S-corps, estates)
- Redirect complex scenarios: "You should consult a tax professional for this"

### 5.2 Tax year handling
- Parameterize all brackets, limits, and thresholds by tax year
- Store as config/JSON so annual updates are easy

### 5.3 Testing and validation
- Validate calculations against IRS Tax Withholding Estimator results
- Test with several real-world-like scenarios across filing statuses

---

## Suggested Starting Point
Begin with **Phase 1** — the rule engine is the foundation. Once calculations are solid and tested, the RAG and Claude layers add value on top. Phase 2 and 3 can be developed in parallel once Phase 1 is complete.
