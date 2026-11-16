import assert from 'node:assert/strict';
import test from 'node:test';

import { parseUrl, runSpeedTest } from '../speed-test.js';

test('accepts HTTP and HTTPS URLs only', () => {
  assert.equal(parseUrl('https://example.com/file').protocol, 'https:');
  assert.throws(() => parseUrl('ftp://example.com/file'), /Only http/);
  assert.throws(() => parseUrl('not a url'));
});

test('runs requests sequentially and calculates totals', async () => {
  let activeRequests = 0;
  let maxActiveRequests = 0;
  let calls = 0;

  const fetchImpl = async () => {
    calls += 1;
    activeRequests += 1;
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests);

    const body = new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.enqueue(new Uint8Array(1_000));
          controller.close();
          activeRequests -= 1;
        }, 5);
      },
    });

    return new Response(body, { status: 200 });
  };

  const result = await runSpeedTest('https://example.com/file', {
    requestCount: 3,
    fetchImpl,
  });

  assert.equal(calls, 3);
  assert.equal(maxActiveRequests, 1);
  assert.equal(result.requestCount, 3);
  assert.equal(result.totalBytes, 3_000);
  assert.ok(result.totalDurationMs > 0);
  assert.ok(result.megabitsPerSecond > 0);
});

test('fails on a non-successful HTTP response', async () => {
  const fetchImpl = async () => new Response('Not found', {
    status: 404,
    statusText: 'Not Found',
  });

  await assert.rejects(
    runSpeedTest('https://example.com/missing', { requestCount: 1, fetchImpl }),
    /HTTP 404 Not Found/,
  );
});
