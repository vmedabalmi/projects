# @patentproject/normalization

Validates, cleans, and coerces `Partial<PatentRecord>` from the ingestion module into fully typed `NormalizedPatentRecord` objects.

## Public API

### Single patent

```ts
import { normalize } from "@patentproject/normalization";

const result = await normalize("US10000000");
if (result.success) {
  console.log(result.record); // NormalizedPatentRecord
} else {
  console.log(result.errors); // ValidationError[]
}
```

### Batch normalization

```ts
import { normalizeAll } from "@patentproject/normalization";

const results = await normalizeAll();
results.forEach(r => console.log(r.patentId, r.success, r.errors.length));
```

### Pure normalization (no I/O)

```ts
import { normalizeRecord } from "@patentproject/normalization";

const result = normalizeRecord(partialPatent);
```

## Validation rules

### Required fields (fail if missing/invalid)
| Field | Source field | Rule |
|-------|-------------|------|
| `patentId` | `patentId` | Non-empty string |
| `patentType` | `patentType` | Coerced to `PatentType` enum |
| `filingDate` | `applicationDate` | Valid ISO date |
| `grantDate` | `patentDate` | Valid ISO date |

### Patent type mappings
| Input | Output |
|-------|--------|
| "utility", "1", "U" | `UTILITY` |
| "design", "2", "D" | `DESIGN` |
| "plant", "3", "P" | `PLANT` |
| unknown | `UTILITY` (with warning) |

### Optional fields (warn if missing/invalid)
| Field | Default | Notes |
|-------|---------|-------|
| `title` | `""` | |
| `assignees` | `[]` | |
| `inventors` | `[]` | |
| `cpcCodes` | `[]` | |
| `isInternational` | `false` | |
| `maintenanceFees` | `undefined` | Fee windows with invalid structure are dropped |
| `pta` | `undefined` | Day counts must be non-negative integers; missing defaults to 0 |
| `pte` | `undefined` | extensionDays capped at 1825 (5 years) |
| `terminalDisclaimer` | `undefined` | |

### PTE rules
- `extensionDays`: 0–1825 (clamped with warning)
- `granted` + `pendingApplication` both true: trust `granted`, set `pendingApplication=false`

## Storage

- Input: `ingestion/data/merged/{patentId}.json`
- Output: `data/normalized/{patentId}.json`
- Only successful normalizations are written
- Each output includes `_normalizedAt` ISO timestamp
- Atomic writes (`.tmp.json` → `.json`)

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NORMALIZATION_INPUT_DIR` | `../ingestion/data/merged` | Input directory |
| `NORMALIZATION_OUTPUT_DIR` | `./data/normalized` | Output directory |

## Development

```bash
npm install
npm run build
npm test
```
