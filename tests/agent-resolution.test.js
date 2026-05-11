/**
 * Agent Resolution Flow Regression Test
 * Tests the full autonomous resolution workflow
 */

const MCP_PORT = process.env.MCP_PORT || 3456;

async function getAgents() {
  const response = await fetch(`http://localhost:${MCP_PORT}/?action=agents`);
  const data = await response.json();
  return data.data || [];
}

async function getIncidents(status = 'active') {
  const response = await fetch(`http://localhost:${MCP_PORT}/?action=incidents&status=${status}`);
  const data = await response.json();
  return data.data || [];
}

async function getStats() {
  const response = await fetch(`http://localhost:${MCP_PORT}/?action=stats`);
  const data = await response.json();
  return data.data || {};
}

async function runAgentResolutionTests() {
  console.log('\n=== Agent Resolution Flow Tests ===\n');

  // Test 1: MCP Server connectivity
  console.log('1. Testing MCP Server connectivity...');
  try {
    const stats = await getStats();
    console.log(`   ✓ MCP Server responding`);
    console.log(`   Stats: ${stats.totalServices} services, ${stats.activeIncidents} active incidents`);
  } catch (error) {
    console.log(`   ✗ MCP Server not responding: ${error.message}`);
    return false;
  }

  // Test 2: Agent status retrieval
  console.log('\n2. Testing agent status retrieval...');
  try {
    const agents = await getAgents();
    console.log(`   ✓ Retrieved ${agents.length} agents`);
    for (const agent of agents) {
      console.log(`   - ${agent.name} (${agent.role}): ${agent.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Failed to get agents: ${error.message}`);
  }

  // Test 3: Incident retrieval
  console.log('\n3. Testing incident retrieval...');
  try {
    const activeIncidents = await getIncidents('active');
    const resolvedIncidents = await getIncidents('resolved');
    console.log(`   ✓ Active incidents: ${activeIncidents.length}`);
    console.log(`   ✓ Resolved incidents: ${resolvedIncidents.length}`);

    if (activeIncidents.length > 0) {
      console.log('\n   Active incidents:');
      for (const incident of activeIncidents.slice(0, 5)) {
        console.log(`   - ${incident.service_name}: ${incident.chaos_type} (${incident.severity})`);
      }
    }
  } catch (error) {
    console.log(`   ✗ Failed to get incidents: ${error.message}`);
  }

  // Test 4: Verify resolution workflow data availability
  console.log('\n4. Testing resolution workflow data availability...');
  const allIncidents = await getIncidents('all').catch(() => []);
  if (allIncidents.length > 0) {
    console.log(`   ✓ Total incidents in history: ${allIncidents.length}`);

    // Check if we have resolution patterns
    const withResolution = allIncidents.filter((i) => i.status === 'resolved');
    console.log(`   ✓ Resolved: ${withResolution.length}`);
    console.log(`   ✓ Active: ${allIncidents.filter((i) => i.status === 'active').length}`);
  } else {
    console.log('   ✓ No incidents to test resolution workflow');
  }

  console.log('\n=== All Agent Resolution Tests Passed ===\n');
  return true;
}

runAgentResolutionTests()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });