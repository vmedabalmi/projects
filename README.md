# PatentProject

A modular patent data pipeline that ingests, normalizes, and analyzes USPTO patent data.

## Architecture

```
USPTO APIs ──► ingestion ──► normalization ──► expiration ──► event-detection
                  │               │                │               │
              data/merged/   data/normalized/   (calculates     (monitors
              raw partials   validated records   term dates)     changes)
```

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| `ingestion` | 🟢 Active | Fetches raw patent data from PatentsView, Maintenance Fee, and Patent Center APIs |
| `normalization` | 🟢 Active | Transforms merged partials into validated PatentRecord objects |
| `expiration` | 🔲 Planned | Calculates patent expiration dates from normalized records |
| `event-detection` | 🔲 Planned | Monitors patent lifecycle events and status changes |

## Quick start

```bash
# 1. Ingestion — fetch from USPTO APIs
cd modules/ingestion
npm install && npm run build
npx ts-node -e "
  import { fetchPatentById } from './src/index';
  fetchPatentById('US10000000').then(r => console.log(JSON.stringify(r, null, 2)));
"

# 2. Normalization — validate and clean
cd modules/normalization
npm install && npm run build
npx ts-node -e "
  import { normalize } from './src/index';
  normalize('US10000000').then(r => console.log(JSON.stringify(r, null, 2)));
"
```

## Development

Each module is independent with its own `package.json`. No monorepo tooling required.

```bash
cd modules/<module>
npm install
npm run build    # TypeScript compile
npm test         # Jest tests
```

## Data flow

1. **Ingestion** fetches from three USPTO sources, writes raw records to `data/raw/`, merges into `data/merged/{patentId}.json`
2. **Normalization** reads merged records, validates/coerces fields, writes to `data/normalized/{patentId}.json`
3. **Expiration** (planned) reads normalized records and calculates patent term expiration dates
4. **Event detection** (planned) monitors for lifecycle changes across patent portfolios
