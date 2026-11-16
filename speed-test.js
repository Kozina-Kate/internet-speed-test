#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const REQUEST_COUNT = 10;

export async function downloadOnce(url, fetchImpl = fetch, timeoutMs = 30_000) {
  const startedAt = performance.now();
  const response = await fetchImpl(url, {
    cache: "no-store",
    headers: { "user-agent": "internet-speed-test/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  }

  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.byteLength;
  }

  return { bytes, durationMs: performance.now() - startedAt };
}

export async function runSpeedTest(url, options = {}) {
  const {
    requestCount = REQUEST_COUNT,
    fetchImpl = fetch,
    timeoutMs = 30_000,
    onProgress = () => {},
  } = options;

  const results = [];
  for (let index = 0; index < requestCount; index += 1) {
    const result = await downloadOnce(url, fetchImpl, timeoutMs);
    results.push(result);
    onProgress(index + 1, requestCount, result);
  }

  const totalBytes = results.reduce((sum, result) => sum + result.bytes, 0);
  const totalDurationMs = results.reduce(
    (sum, result) => sum + result.durationMs,
    0,
  );

  return {
    requestCount,
    totalBytes,
    totalDurationMs,
    averageDurationMs: totalDurationMs / requestCount,
    megabitsPerSecond: (totalBytes * 8) / (totalDurationMs / 1_000) / 1_000_000,
  };
}

export function parseUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http:// and https:// URLs are supported');
  }
  return url;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node speed-test.js <url>');
    process.exitCode = 1;
    return;
  }

  try {
    const url = parseUrl(input);
    console.log(`Downloading ${url.href} ${REQUEST_COUNT} times sequentially...`);

    const result = await runSpeedTest(url, {
      onProgress: (current, total, request) => {
        console.log(
          `[${current}/${total}] ${(request.durationMs / 1_000).toFixed(3)} s, ${request.bytes} bytes`,
        );
      },
    });

    console.log('\nResults');
    console.log(`Average request time: ${(result.averageDurationMs / 1_000).toFixed(3)} s`);
    console.log(`Downloaded: ${(result.totalBytes / 1024 / 1024).toFixed(2)} MiB`);
    console.log(`Average download speed: ${result.megabitsPerSecond.toFixed(2)} Mbit/s`);
  } catch (error) {
    const message = error.name === 'TimeoutError'
      ? 'Request timed out after 30 seconds'
      : error.message;
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
