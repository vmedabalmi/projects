import https from "https";
import http from "http";
import pino from "pino";

const logger = pino({ name: "ingestion-fetcher" });

const DEFAULT_MAX_RPS = 10;
const DEFAULT_MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

interface FetcherConfig {
  maxRequestsPerSecond: number;
}

interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

interface FetchResult<T> {
  data: T;
  status: number;
}

function getConfig(): FetcherConfig {
  return {
    maxRequestsPerSecond: parseInt(
      process.env.INGESTION_MAX_RPS ?? String(DEFAULT_MAX_RPS),
      10
    ),
  };
}

// --- Token-bucket rate limiter ---

class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private lastRefill: number;

  constructor(maxPerSecond: number) {
    this.maxTokens = maxPerSecond;
    this.tokens = maxPerSecond;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    // Wait until a token is available
    const waitMs = ((1 - this.tokens) / this.maxTokens) * 1000;
    await sleep(waitMs);
    this.refill();
    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.maxTokens);
    this.lastRefill = now;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const rateLimiter = new RateLimiter(getConfig().maxRequestsPerSecond);

// --- Core HTTP fetch ---

function httpGet(
  url: string,
  options: RequestOptions
): Promise<FetchResult<string>> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const req = transport.get(
      url,
      { headers: options.headers, signal: options.signal },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8");
          resolve({ data: body, status: res.statusCode ?? 0 });
        });
        res.on("error", reject);
      }
    );

    req.on("error", reject);
  });
}

// --- Fetch with retry ---

export async function fetchWithRetry<T>(
  url: string,
  options: RequestOptions = {},
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await rateLimiter.acquire();

    logger.info({ url, attempt }, "Fetching URL");

    try {
      const result = await httpGet(url, options);

      if (result.status === 429 || result.status === 503) {
        logger.warn(
          { url, attempt, status: result.status },
          "Rate limited or service unavailable, retrying"
        );
        lastError = new Error(`HTTP ${result.status}`);
        if (attempt < maxRetries) {
          await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
          continue;
        }
        throw lastError;
      }

      if (result.status < 200 || result.status >= 300) {
        throw new Error(
          `HTTP ${result.status}: ${result.data.substring(0, 200)}`
        );
      }

      const parsed = JSON.parse(result.data) as T;
      logger.info({ url, attempt, status: result.status }, "Fetch successful");
      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.error(
        { url, attempt, error: lastError.message },
        "Fetch attempt failed"
      );

      if (attempt < maxRetries) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}
