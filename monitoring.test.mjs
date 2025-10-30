#!/usr/bin/env node

/**
 * Tests for the monitoring service
 */

import { strict as assert } from 'assert';
import { runMonitoringCheck, MONITOR_CONFIG } from './monitoring.mjs';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';

const TEST_OUTPUT_DIR = './test-monitoring-data';

// Override output directory for tests
MONITOR_CONFIG.outputDir = TEST_OUTPUT_DIR;

// Use a simple test service that should respond quickly
MONITOR_CONFIG.services = [
  {
    name: 'Test Service',
    url: 'https://httpbin.org/status/200',
    type: 'http',
    method: 'GET',
    timeout: 5000,
  },
];

/**
 * Clean up test data
 */
async function cleanup() {
  try {
    await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
}

/**
 * Test: Monitoring check runs successfully
 */
async function testMonitoringCheckRuns() {
  console.log('Test: Monitoring check runs successfully');

  await cleanup();

  const status = await runMonitoringCheck();

  assert.ok(status, 'Status should be returned');
  assert.ok(status.lastUpdate, 'Status should have lastUpdate');
  assert.ok(Array.isArray(status.services), 'Status should have services array');
  assert.strictEqual(status.services.length, 1, 'Should have one service');

  console.log('✅ Test passed');
}

/**
 * Test: Status file is created
 */
async function testStatusFileCreated() {
  console.log('Test: Status file is created');

  await cleanup();

  await runMonitoringCheck();

  const statusPath = join(TEST_OUTPUT_DIR, 'status.json');
  const statusContent = await readFile(statusPath, 'utf-8');
  const status = JSON.parse(statusContent);

  assert.ok(status.lastUpdate, 'Status file should contain lastUpdate');
  assert.ok(status.services, 'Status file should contain services');

  console.log('✅ Test passed');
}

/**
 * Test: History file is created
 */
async function testHistoryFileCreated() {
  console.log('Test: History file is created');

  await cleanup();

  await runMonitoringCheck();

  const historyPath = join(TEST_OUTPUT_DIR, 'history.json');
  const historyContent = await readFile(historyPath, 'utf-8');
  const history = JSON.parse(historyContent);

  assert.ok(history['Test Service'], 'History should contain Test Service');
  assert.ok(Array.isArray(history['Test Service']), 'Service history should be an array');
  assert.ok(history['Test Service'].length > 0, 'Service history should have at least one entry');

  console.log('✅ Test passed');
}

/**
 * Test: Service metrics are tracked
 */
async function testServiceMetricsTracked() {
  console.log('Test: Service metrics are tracked');

  await cleanup();

  const status = await runMonitoringCheck();
  const service = status.services[0];

  assert.ok(service.name, 'Service should have a name');
  assert.ok(service.status, 'Service should have a status');
  assert.ok(typeof service.latency === 'number' || service.latency === null, 'Service should have latency');
  assert.ok(typeof service.successRate === 'number', 'Service should have success rate');
  assert.ok(service.lastCheck, 'Service should have lastCheck timestamp');

  console.log('✅ Test passed');
}

/**
 * Test: Multiple checks accumulate history
 */
async function testMultipleChecksAccumulateHistory() {
  console.log('Test: Multiple checks accumulate history');

  await cleanup();

  // Run three checks
  await runMonitoringCheck();
  await runMonitoringCheck();
  await runMonitoringCheck();

  const historyPath = join(TEST_OUTPUT_DIR, 'history.json');
  const historyContent = await readFile(historyPath, 'utf-8');
  const history = JSON.parse(historyContent);

  assert.strictEqual(history['Test Service'].length, 3, 'Should have three historical records');

  console.log('✅ Test passed');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== Running Monitoring Service Tests ===\n');

  try {
    await testMonitoringCheckRuns();
    await testStatusFileCreated();
    await testHistoryFileCreated();
    await testServiceMetricsTracked();
    await testMultipleChecksAccumulateHistory();

    console.log('\n=== All tests passed! ===');
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await cleanup();
    process.exit(1);
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
