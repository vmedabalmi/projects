# PatentProject

A modular patent data pipeline that ingests, normalizes, and analyzes USPTO patent data.

## Architecture

```
USPTO APIs ──► ingestion ──► normalization ──► expiration-pipeline ──► apps/web
                  │               │                    │                   │
              data/merged/   data/normalized/    data/expiration/     Prior Art
              raw partials   validated records   enriched results     news site
```

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| `expiration` | 🟢 Active | Core calculation library — PTA, PTE, terminal disclaimers, maintenance fees |
| `ingestion` | 🟢 Active | Fetches from USPTO PatentsView, Maintenance Fee, and Patent Center APIs |
| `normalization` | 🟢 Active | Validates and coerces merged partials into typed PatentRecord objects |
| `expiration-pipeline` | 🟢 Active | Enriches normalized records with urgency labels, summaries, and lookahead windows |
| `event-detection` | 🔜 Planned | Emits structured PatentEvents (EXPIRATION, NEW_ISSUANCE, etc.) |
| `enrichment` | 🔜 Planned | Adds company context, significance scores, technology classification |
| `newsletter` | 🔜 Planned | Subscriber matching and digest generation |

## Apps

| App | Status | Description |
|-----|--------|-------------|
| `apps/web` | 🟢 Active | Prior Art — Next.js news website, 4 pages, 10 real patents |

## Pipeline

Current working data flow with 10 patents (US6000000 through US11000000):

```
ingestion (3 USPTO sources)
    │
    ├── data/raw/patentsview/{id}.json
    ├── data/raw/maintenance-fees/{id}.json
    └── data/merged/{id}.json
            │
normalization (validate + coerce)
            │
    └── data/normalized/{id}.json
            │
expiration-pipeline (calculate + enrich)
            │
    └── data/expiration/{id}.json
            │
apps/web (Prior Art)
    └── Static pages: /, /browse, /about, /patents/[id]
```

## Test coverage

| Module | Tests |
|--------|-------|
| `ingestion` | 14 |
| `normalization` | 36 |
| `expiration-pipeline` | 32 |
| **Total** | **82** |

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

# 4. Web frontend
cd apps/web
npm install && npm run build
npm run dev
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
4. **Prior Art (web)** reads expiration pipeline output at build time, generates static pages
5. **Event detection** (planned) monitors for lifecycle changes across patent portfolios
