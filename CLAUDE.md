# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PatentProject — a modular patent data pipeline that ingests, normalizes, and analyzes USPTO patent data. Each module lives in `modules/` with its own package.json, TypeScript config, and test suite.

## Structure

- `modules/ingestion/` — Fetches raw patent data from USPTO APIs (PatentsView, Maintenance Fees, Patent Center)
- `modules/normalization/` — Validates, cleans, and coerces ingested data into typed PatentRecord objects
- `modules/expiration/` — (planned) Calculates patent expiration dates
- `modules/event-detection/` — (planned) Monitors patent lifecycle events

## Development

Each module is independent. To work on a module:
```bash
cd modules/<module>
npm install
npm run build    # TypeScript compile (strict mode)
npm test         # Jest tests
```

## Conventions

- TypeScript strict mode — no `any` types
- Jest + ts-jest for testing; nock for HTTP mocking (ingestion)
- pino for structured logging
- Atomic file writes (.tmp.json → .json) for all data persistence
- API base URLs and config via environment variables, never hardcoded
- Each module's `data/` directory is gitignored (runtime artifacts only)
- Do not modify other modules when working on one module
