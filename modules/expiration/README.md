# @patentproject/expiration

Core patent expiration date calculation library. Computes expiration dates from filing/grant dates, applies modifiers (PTA, PTE, terminal disclaimers, maintenance fee lapses), and returns a full breakdown with confidence scoring.

## Public API

```ts
import { calculateExpiration } from "@patentproject/expiration";
import type { PatentRecord, ExpirationResult } from "@patentproject/expiration";

const result: ExpirationResult = calculateExpiration(record);
console.log(result.expirationDate);
console.log(result.breakdown);
console.log(result.confidence);
```

## Calculation rules

### Base term by patent type

| Type | Filed | Rule |
|------|-------|------|
| Utility | >= June 8, 1995 (post-GATT) | 20 years from filing date |
| Utility | < June 8, 1995 (pre-GATT) | MAX(17yr from grant, 20yr from filing) |
| Design | >= May 13, 2015 | 15 years from filing date |
| Design | < May 13, 2015 | 14 years from grant date |
| Plant | Any | 20 years from grant date |

### Modifiers (applied in order)

1. **PTA** — adds `totalPTADays` to base (utility only)
2. **PTE** — adds `extensionDays`, capped at 1825 days (5 years)
3. **Terminal disclaimer** — MIN(current expiration, limitingDate)
4. **Maintenance fee lapse** — if any window unpaid and not revived, expiration = graceEnd

### Confidence levels

| Level | Condition |
|-------|-----------|
| `INDETERMINATE` | `isInternational === true` |
| `LOW` | `pte.pendingApplication === true` |
| `MEDIUM` | Terminal disclaimer present, or fee in grace period |
| `HIGH` | All other cases |

## Module structure

```
src/
  types/index.ts              — all types and enums
  utils/dates.ts              — date arithmetic helpers
  calculators/
    utilityExpiration.ts       — utility patent base term
    designExpiration.ts        — design patent base term
    plantExpiration.ts         — plant patent base term
  modifiers/
    pta.ts                     — Patent Term Adjustment
    pte.ts                     — Patent Term Extension
    terminalDisclaimer.ts      — terminal disclaimer cap
    maintenanceFee.ts          — maintenance fee lapse
  confidence.ts               — confidence scoring
  expirationCalculator.ts     — main orchestrator
  index.ts                    — public API
tests/
  expirationCalculator.test.ts
```

## Development

```bash
npm install
npm run build    # TypeScript compile
npm test         # Jest tests with coverage
```
