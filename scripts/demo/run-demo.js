/**
 * Demo Script - Full Incident Resolution Workflow
 * Demonstrates: chaos injection → detection → analysis → fix → validation
 * Uses the Next.js dashboard API for database access
 */

const API_BASE = 'http://localhost:3000/api';

function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}`;
  console.log(entry);
}

async function apiQuery(endpoint) {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    log(`API Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function demo() {
  log('========================================');
  log('Project Sentinel - Demo Workflow');
  log('========================================');

  log('\n[STEP 1] Checking dashboard connectivity...');
  const stats = await apiQuery('stats');
  if (stats.success) {
    log(`Dashboard connected. Active incidents: ${stats.data.activeIncidents}`);
  } else {
    log('Dashboard not accessible. Please start the dashboard first:');
    log('  pnpm --filter @sentinel/dashboard dev');
  }

  const incidents = await apiQuery('incidents');
  if (incidents.success && incidents.data) {
    log(`\nFound ${incidents.data.length} total incidents in database`);
    const active = incidents.data.filter(i => i.status === 'active');
    const resolved = incidents.data.filter(i => i.status === 'resolved');
    log(`  - Active: ${active.length}`);
    log(`  - Resolved: ${resolved.length}`);
  }

  const health = await apiQuery('health');
  if (health.success && health.data) {
    log(`\nSystem Health:`);
    log(`  - Healthy services: ${health.data.healthy}`);
    log(`  - Critical services: ${health.data.critical}`);
  }

  log('\n========================================');
  log('Demo Check Complete');
  log('========================================');
  log('\nTo run the full workflow:');
  log('1. Start MCP server: node scripts/mcp-server.js');
  log('2. Start dashboard: pnpm --filter @sentinel/dashboard dev');
  log('3. Access dashboard: http://localhost:3000/overview');
  log('4. Check Post-Mortem: http://localhost:3000/post-mortem');
  log('========================================');
}

demo().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
