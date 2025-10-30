# Public Monitoring System

This repository includes a public monitoring system for tracking the health and latency of Deep Assistant services.

## Overview

The monitoring system tracks:
- **API Latency**: Minimum response times for the smallest possible requests
- **Service Availability**: Uptime percentage and operational status
- **Historical Data**: Trends over time (up to 24 hours of history)

## Components

### 1. Monitoring Service (`monitoring.mjs`)

A Node.js script that periodically checks service endpoints and measures latency.

**Features:**
- HTTP endpoint health checks
- Ping-style connectivity tests
- Configurable check intervals
- JSON data output for easy integration
- Historical data tracking (up to 1440 records = 24 hours at 1-minute intervals)

**Usage:**

```bash
# Run continuous monitoring (checks every 60 seconds)
node monitoring.mjs

# Run a single check and exit
node monitoring.mjs --once

# Show help
node monitoring.mjs --help
```

### 2. Status Dashboard (`status.html`)

A static HTML page that displays real-time monitoring data in a user-friendly format.

**Features:**
- Real-time status indicators
- Latency metrics (current, average, minimum)
- Success rate percentages
- Auto-refresh every 30 seconds
- Responsive design for mobile and desktop

**Usage:**

Simply open `status.html` in a web browser. The page will automatically load monitoring data from `monitoring-data/status.json`.

For production deployment, serve this HTML file along with the `monitoring-data` directory using any static file server.

### 3. Test Suite (`monitoring.test.mjs`)

Automated tests to verify monitoring functionality.

**Usage:**

```bash
node monitoring.test.mjs
```

## Configuration

Edit the `MONITOR_CONFIG` object in `monitoring.mjs` to customize:

```javascript
const MONITOR_CONFIG = {
  // Services to monitor
  services: [
    {
      name: 'API Gateway',
      url: 'https://api.deep-assistant.com/health',
      type: 'http',
      method: 'GET',
      timeout: 10000,
    },
    // Add more services...
  ],

  // Check interval (milliseconds)
  checkInterval: 60000, // 1 minute

  // Historical records to keep
  historyLimit: 1440, // 24 hours at 1-minute intervals

  // Output directory
  outputDir: './monitoring-data',
};
```

## Data Format

### Status Data (`monitoring-data/status.json`)

```json
{
  "lastUpdate": "2025-10-30T04:42:00.000Z",
  "services": [
    {
      "name": "API Gateway",
      "status": "operational",
      "latency": 45,
      "avgLatency": 48,
      "minLatency": 42,
      "successRate": 100,
      "lastCheck": "2025-10-30T04:42:00.000Z"
    }
  ]
}
```

### Historical Data (`monitoring-data/history.json`)

```json
{
  "API Gateway": [
    {
      "timestamp": "2025-10-30T04:42:00.000Z",
      "success": true,
      "latency": 45,
      "status": 200
    }
  ]
}
```

## Deployment

### Option 1: GitHub Pages

1. Enable GitHub Pages for this repository
2. Configure monitoring service to run on a server (e.g., GitHub Actions scheduled workflow)
3. Commit monitoring data to the repository (or use GitHub Actions artifacts)
4. Access the status page at: `https://deep-assistant.github.io/master-plan/status.html`

### Option 2: Standalone Server

1. Deploy `monitoring.mjs` to a server or cloud function
2. Run it in continuous mode or as a scheduled task
3. Serve `status.html` and `monitoring-data/` via a web server (nginx, Apache, etc.)

### Option 3: GitHub Actions (Recommended)

Create `.github/workflows/monitoring.yml`:

```yaml
name: Public Monitoring

on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch: # Allow manual triggers

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run monitoring check
        run: node monitoring.mjs --once

      - name: Commit monitoring data
        run: |
          git config user.name "Monitoring Bot"
          git config user.email "bot@deep-assistant.com"
          git add monitoring-data/
          git commit -m "Update monitoring data" || exit 0
          git push
```

## Monitored Services

Currently monitoring:
- **API Gateway**: OpenAI-compatible API gateway with multi-provider failover
- **Telegram Bot**: Deep Assistant Telegram bot
- **Web Capture**: Web page capture microservice

## Metrics Explained

- **Current Latency**: Time taken for the most recent check (in milliseconds)
- **Average Latency**: Average response time over the last 10 checks
- **Min Latency**: Fastest response time over the last 10 checks
- **Success Rate**: Percentage of successful checks out of the last 10 attempts
- **Status**:
  - `operational`: Service is responding normally
  - `down`: Service is not responding or returning errors

## Troubleshooting

### Monitoring service not starting

- Ensure Node.js v18+ is installed
- Check that all service URLs are accessible
- Review timeout settings if services are slow to respond

### Status page not loading data

- Verify `monitoring-data/status.json` exists and is valid JSON
- Check browser console for errors
- Ensure the page is served via HTTP/HTTPS (not `file://`)

### High latency values

- Check network connectivity
- Verify service endpoints are correct
- Consider adjusting timeout values
- Review service logs for performance issues

## Contributing

To add new services to monitor:

1. Edit `MONITOR_CONFIG.services` in `monitoring.mjs`
2. Add service details (name, URL, type, method, timeout)
3. Test with `node monitoring.mjs --once`
4. Update this documentation

## License

Same as the main repository.
