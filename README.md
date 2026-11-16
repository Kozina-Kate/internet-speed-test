# Internet Speed Test

Скрипт для теста скорости интернета.

A small command-line utility that downloads a resource 10 times sequentially and
reports the average request time, total amount of downloaded data, and average
download speed.

## Requirements

- Node.js 20 or newer
- No third-party dependencies

## Usage

Pass an HTTP or HTTPS URL to a reasonably large file:

```bash
node speed-test.js https://example.com/large-image.jpg
```

You can also use the npm script (the `--` passes the URL to the script):

```bash
npm start -- https://example.com/large-image.jpg
```

The requests are made one at a time. Each response body is read completely before
the next request begins. A request times out after 30 seconds.

Example output:

```text
Downloading https://example.com/large-image.jpg 10 times sequentially...
[1/10] 0.842 s, 4961024 bytes
...

Results
Average request time: 0.817 s
Downloaded: 47.31 MiB
Average download speed: 46.32 Mbit/s
```

## Units and calculation

- Request time is displayed in seconds (`s`).
- Total data is displayed in mebibytes (`MiB`), where 1 MiB = 1,048,576 bytes.
- Download speed is displayed in megabits per second (`Mbit/s`), where
  1 Mbit = 1,000,000 bits.

The average speed is calculated over all 10 requests:

```text
speed = total downloaded bytes * 8 / total request time / 1,000,000
```

The result measures transfer speed between this computer and the specified
server. It is not a universal measurement of the internet connection: server
performance, latency, caching, and network conditions can affect it.

## Tests

```bash
npm test
```

The tests verify URL validation, sequential execution, byte totals, calculations,
and HTTP error handling.
