/**
 * Dashboard Health API Regression Tests
 * Tests the health endpoint port mappings and response format
 */

const HEALTH_PORTS = {
  'API Gateway': 4000,
  'Auth Service': 4001,
  'Payment Service': 4002,
  'Notification Service': 4003,
  'Monitoring Service': 4004,
};

async function testHealthEndpoint(serviceName, port) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { serviceName, port, status: 'unhealthy', error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      serviceName,
      port,
      status: 'healthy',
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      serviceName,
      port,
      status: 'unreachable',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function runHealthTests() {
  console.log('\n=== Dashboard Health Endpoint Tests ===\n');

  const results = [];
  for (const [serviceName, port] of Object.entries(HEALTH_PORTS)) {
    const result = await testHealthEndpoint(serviceName, port);
    results.push(result);

    const icon = result.status === 'healthy' ? '✓' : '✗';
    console.log(`${icon} ${serviceName} (Port ${port}): ${result.status}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  const healthyCount = results.filter((r) => r.status === 'healthy').length;
  console.log(`\n--- Summary: ${healthyCount}/${results.length} services healthy ---`);

  return results.every((r) => r.status === 'healthy');
}

runHealthTests()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });