# PatentProject

A modular patent data pipeline that ingests, normalizes, and analyzes USPTO patent data.

## Architecture

```
USPTO APIs ──► ingestion ──► normalization ──► expiration-pipeline ──► event-detection
                  │               │                    │                     │
              data/merged/   data/normalized/    data/expiration/       (monitors
              raw partials   validated records   enriched results        changes)
```

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| `ingestion` | 🟢 Active | Fetches raw patent data from PatentsView, Maintenance Fee, and Patent Center APIs |
| `normalization` | 🟢 Active | Transforms merged partials into validated PatentRecord objects |
| `expiration` | 🟢 Active | Core patent expiration date calculation logic |
| `expiration-pipeline` | 🟢 Active | Enriches expiration data with urgency labels, summaries, and lookahead windows |
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

# 3. Expiration pipeline — calculate and enrich
cd modules/expiration-pipeline
npm install && npm run build
npx ts-node -e "
  import { expireAll } from './src/index';
  expireAll().then(results => {
    results.forEach(r => console.log(r.patentId, r.editorial.urgencyLabel, r.daysUntilExpiration + ' days'));
  });
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
3. **Expiration pipeline** reads normalized records, calculates expiration dates, enriches with urgency labels/summaries/lookahead windows, writes to `data/expiration/{patentId}.json`
4. **Event detection** (planned) monitors for lifecycle changes across patent portfolios
