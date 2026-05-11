/**
 * Service Health Check Regression Tests
 * Tests all service health endpoints and their responses
 */

const SERVICES = [
  { name: 'MCP Server', port: 3456, healthPath: '/?action=health' },
  { name: 'Payment Service', port: 4002, healthPath: '/health' },
  { name: 'Monitoring Service', port: 4004, healthPath: '/health' },
];

async function checkServiceHealth(service) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const start = Date.now();
  try {
    const response = await fetch(`http://localhost:${service.port}${service.healthPath}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    const data = await response.json().catch(() => ({}));

    return {
      service: service.name,
      port: service.port,
      status: response.ok ? 'healthy' : 'degraded',
      latency,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      service: service.name,
      port: service.port,
      status: 'unreachable',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function runServiceHealthTests() {
  console.log('\n=== Service Health Check Tests ===\n');

  const results = [];
  for (const service of SERVICES) {
    const result = await checkServiceHealth(service);
    results.push(result);

    const icon = result.status === 'healthy' ? '✓' : '✗';
    console.log(`${icon} ${result.service} (Port ${result.port}): ${result.status}`);

    if (result.latency) {
      console.log(`  Latency: ${result.latency}ms`);
    }

    if (result.data && Object.keys(result.data).length > 0) {
      console.log(`  Response: ${JSON.stringify(result.data).slice(0, 100)}...`);
    }

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }

  const healthyCount = results.filter((r) => r.status === 'healthy').length;
  console.log(`--- Summary: ${healthyCount}/${results.length} services healthy ---`);

  return results.filter((r) => r.status === 'healthy').length === results.length;
}

runServiceHealthTests()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });