# @patentproject/expiration-pipeline

Enriches patent expiration data with urgency labels, human-readable summaries, and configurable lookahead windows. Reads normalized records from the normalization module and calls `calculateExpiration()` from `@patentproject/expiration`.

## Public API

### Single patent

```ts
import { expire } from "@patentproject/expiration-pipeline";

const result = await expire("US10000000");
console.log(result.editorial.urgencyLabel); // "ACTIVE"
console.log(result.daysUntilExpiration);    // 3272
```

### Batch processing

```ts
import { expireAll } from "@patentproject/expiration-pipeline";

const results = await expireAll();
results.forEach(r => console.log(r.patentId, r.editorial.urgencyLabel));
```

### Direct record processing (no I/O)

```ts
import { expireRecord } from "@patentproject/expiration-pipeline";

const result = expireRecord(normalizedRecord);
```

## Output schema

```json
{
  "patentId": "10000000",
  "expirationDate": "2035-03-10",
  "baseExpirationDate": "2035-03-10",
  "adjustedDays": 0,
  "daysUntilExpiration": 3272,
  "confidence": "HIGH",
  "factors": [],
  "editorial": {
    "urgencyLabel": "ACTIVE",
    "summary": "Patent 10000000 is active, expiring on 2035-03-10 (3272 days remaining)"
  },
  "lookahead": [
    { "days": 30, "date": "2026-04-24", "isPastExpiration": false },
    { "days": 60, "date": "2026-05-24", "isPastExpiration": false },
    { "days": 90, "date": "2026-06-23", "isPastExpiration": false }
  ],
  "_calculatedAt": "2026-03-25T..."
}
```

## Urgency labels

| Label | Condition |
|-------|-----------|
| `EXPIRED` | Days until expiration <= 0 |
| `CRITICAL` | 1–30 days remaining |
| `WARNING` | 31–90 days remaining |
| `UPCOMING` | 91–365 days remaining |
| `ACTIVE` | > 365 days remaining |
| `INDETERMINATE` | Confidence is INDETERMINATE |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOOKAHEAD_DAYS` | `30,60,90` | Comma-separated lookahead window days |
| `EXPIRATION_INPUT_DIR` | `../normalization/data/normalized` | Input directory |
| `EXPIRATION_OUTPUT_DIR` | `./data/expiration` | Output directory |

## Storage

- Input: `modules/normalization/data/normalized/{patentId}.json`
- Output: `data/expiration/{patentId}.json`
- Atomic writes (`.tmp.json` → `.json`)
- `_calculatedAt` ISO timestamp on every output

## Development

```bash
npm install
npm run build
npm test
```
