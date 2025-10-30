#!/usr/bin/env node

/**
 * Public Monitoring Service for Deep Assistant APIs
 *
 * This service monitors API latency by sending minimal requests to various endpoints
 * and tracks response times for public visibility.
 */

import { performance } from 'perf_hooks';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

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
    {
      name: 'Telegram Bot',
      url: 'https://t.me/deep_assistant_bot',
      type: 'ping',
      timeout: 10000,
    },
    {
      name: 'Web Capture',
      url: 'https://web-capture.deep-assistant.com/health',
      type: 'http',
      method: 'GET',
      timeout: 10000,
    },
  ],

  // How often to check (in milliseconds)
  checkInterval: 60000, // 1 minute

  // How many historical records to keep
  historyLimit: 1440, // 24 hours at 1-minute intervals

  // Output directory for status data
  outputDir: './monitoring-data',
};

/**
 * Measures HTTP request latency
 */
async function measureHttpLatency(service) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), service.timeout);

  try {
    const startTime = performance.now();

    const response = await fetch(service.url, {
      method: service.method || 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Deep-Assistant-Monitor/1.0',
      },
    });

    const endTime = performance.now();
    clearTimeout(timeoutId);

    return {
      success: response.ok,
      latency: Math.round(endTime - startTime),
      status: response.status,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      latency: null,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Measures ping latency (for services without HTTP endpoints)
 */
async function measurePingLatency(service) {
  // For services that don't have a dedicated health endpoint,
  // we attempt a basic connection test
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), service.timeout);

  try {
    const startTime = performance.now();

    // Try to fetch the URL with HEAD method for minimal overhead
    const response = await fetch(service.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Deep-Assistant-Monitor/1.0',
      },
    });

    const endTime = performance.now();
    clearTimeout(timeoutId);

    return {
      success: true, // Connection successful
      latency: Math.round(endTime - startTime),
      status: response.status,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      latency: null,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check a single service
 */
async function checkService(service) {
  console.log(`Checking ${service.name}...`);

  let result;
  if (service.type === 'http') {
    result = await measureHttpLatency(service);
  } else if (service.type === 'ping') {
    result = await measurePingLatency(service);
  } else {
    throw new Error(`Unknown service type: ${service.type}`);
  }

  return {
    service: service.name,
    ...result,
  };
}

/**
 * Load historical monitoring data
 */
async function loadHistory() {
  const historyPath = join(MONITOR_CONFIG.outputDir, 'history.json');
  try {
    const data = await readFile(historyPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, start fresh
    return {};
  }
}

/**
 * Save monitoring results
 */
async function saveResults(results, history) {
  await mkdir(MONITOR_CONFIG.outputDir, { recursive: true });

  // Update history for each service
  for (const result of results) {
    if (!history[result.service]) {
      history[result.service] = [];
    }

    history[result.service].push({
      timestamp: result.timestamp,
      success: result.success,
      latency: result.latency,
      status: result.status,
      error: result.error,
    });

    // Keep only the last N records
    if (history[result.service].length > MONITOR_CONFIG.historyLimit) {
      history[result.service] = history[result.service].slice(-MONITOR_CONFIG.historyLimit);
    }
  }

  // Save history
  await writeFile(
    join(MONITOR_CONFIG.outputDir, 'history.json'),
    JSON.stringify(history, null, 2)
  );

  // Calculate and save current status
  const status = {
    lastUpdate: new Date().toISOString(),
    services: results.map(result => {
      const serviceHistory = history[result.service] || [];
      const recentChecks = serviceHistory.slice(-10); // Last 10 checks
      const successRate = recentChecks.length > 0
        ? (recentChecks.filter(c => c.success).length / recentChecks.length) * 100
        : 0;

      const recentLatencies = recentChecks
        .filter(c => c.success && c.latency !== null)
        .map(c => c.latency);

      const avgLatency = recentLatencies.length > 0
        ? Math.round(recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length)
        : null;

      const minLatency = recentLatencies.length > 0
        ? Math.min(...recentLatencies)
        : null;

      return {
        name: result.service,
        status: result.success ? 'operational' : 'down',
        latency: result.latency,
        avgLatency,
        minLatency,
        successRate: Math.round(successRate),
        lastCheck: result.timestamp,
        error: result.error,
      };
    }),
  };

  await writeFile(
    join(MONITOR_CONFIG.outputDir, 'status.json'),
    JSON.stringify(status, null, 2)
  );

  return status;
}

/**
 * Run a single monitoring check for all services
 */
async function runMonitoringCheck() {
  console.log(`\n=== Monitoring Check: ${new Date().toISOString()} ===`);

  const results = await Promise.all(
    MONITOR_CONFIG.services.map(service => checkService(service))
  );

  const history = await loadHistory();
  const status = await saveResults(results, history);

  // Display results
  console.log('\nCurrent Status:');
  for (const service of status.services) {
    const statusIcon = service.status === 'operational' ? '✅' : '❌';
    const latencyInfo = service.latency !== null
      ? `${service.latency}ms (avg: ${service.avgLatency}ms, min: ${service.minLatency}ms)`
      : 'N/A';
    console.log(`${statusIcon} ${service.name}: ${service.status} - ${latencyInfo} (${service.successRate}% uptime)`);
    if (service.error) {
      console.log(`   Error: ${service.error}`);
    }
  }

  return status;
}

/**
 * Run monitoring in continuous mode
 */
async function runContinuousMonitoring() {
  console.log('Starting Deep Assistant Public Monitoring Service...');
  console.log(`Checking every ${MONITOR_CONFIG.checkInterval / 1000} seconds`);
  console.log(`Monitoring ${MONITOR_CONFIG.services.length} services`);

  // Run initial check
  await runMonitoringCheck();

  // Schedule periodic checks
  setInterval(async () => {
    try {
      await runMonitoringCheck();
    } catch (error) {
      console.error('Error during monitoring check:', error);
    }
  }, MONITOR_CONFIG.checkInterval);

  console.log('\nMonitoring service is running. Press Ctrl+C to stop.');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--once')) {
    // Run a single check and exit
    await runMonitoringCheck();
    console.log('\nSingle check completed.');
  } else if (args.includes('--help')) {
    console.log(`
Deep Assistant Public Monitoring Service

Usage:
  node monitoring.mjs [options]

Options:
  --once     Run a single monitoring check and exit
  --help     Show this help message

Without options, runs in continuous monitoring mode.
    `);
  } else {
    // Run in continuous mode
    await runContinuousMonitoring();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runMonitoringCheck, MONITOR_CONFIG };
