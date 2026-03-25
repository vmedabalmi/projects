# @patentproject/ingestion

Fetches raw patent data from three USPTO sources and produces `Partial<PatentRecord>` objects for downstream modules.

## Sources

| Source | Fields Provided | Adapter |
|--------|----------------|---------|
| **PatentsView API** | patentId, patentType, patentDate, applicationDate, title, assignees, inventors, cpcCodes | `src/sources/patentsview.ts` |
| **USPTO Maintenance Fee API** | patentId, maintenanceFeeStatus (feeWindows, smallEntityStatus, expired) | `src/sources/maintenanceFees.ts` |
| **USPTO Patent Center (ODP)** | patentId, ptaDays | `src/sources/patentCenter.ts` |

## Public API

### High-level

```ts
import { fetchPatentById } from "@patentproject/ingestion";

const result = await fetchPatentById("US10000000", {
  applicationNumber: "14644410", // optional, needed for PTA data
});
```

### Per-source

```ts
// PatentsView — paginated batches
import { fetchPatentsViewBatches, transformPatentsView } from "@patentproject/ingestion";

for await (const batch of fetchPatentsViewBatches({ query: { patent_type: "utility" } })) {
  const partials = batch.map(transformPatentsView);
}

// PatentsView — single patent
import { fetchPatentsViewById, transformPatentsView } from "@patentproject/ingestion";

const raw = await fetchPatentsViewById("10000000");
if (raw) {
  const partial = transformPatentsView(raw);
}

// Maintenance Fees
import { fetchMaintenanceFee, transformMaintenanceFee } from "@patentproject/ingestion";

const mfRaw = await fetchMaintenanceFee("10000000");
const mfPartial = transformMaintenanceFee(mfRaw);

// Patent Center
import { fetchPatentCenter, transformPatentCenter } from "@patentproject/ingestion";

const pcRaw = await fetchPatentCenter("14644410");
const pcPartial = transformPatentCenter(pcRaw);
```

### Merger

```ts
import { mergePartials } from "@patentproject/ingestion";

const merged = mergePartials([pvPartial, mfPartial, pcPartial]);
```

### Storage

```ts
import { writeRawRecord, readRawRecord, writeMergedRecord, readMergedRecord } from "@patentproject/ingestion";

await writeRawRecord("patentsview", "10000000", rawData);
const raw = await readRawRecord("patentsview", "10000000");
await writeMergedRecord("10000000", mergedPartial);
const merged = await readMergedRecord("10000000");
```

## Configuration

All settings via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PATENTSVIEW_API_URL` | `https://api.patentsview.org/patents` | PatentsView base URL |
| `USPTO_MAINTENANCE_FEE_API_URL` | `https://developer.uspto.gov/api/maintenance-fees` | Maintenance Fee API base URL |
| `USPTO_PATENT_CENTER_API_URL` | `https://developer.uspto.gov/api/patent-center` | Patent Center API base URL |
| `INGESTION_MAX_RPS` | `10` | Max requests per second (rate limit) |

## Development

```bash
npm install
npm run build   # TypeScript compile
npm test        # Run all tests
```
