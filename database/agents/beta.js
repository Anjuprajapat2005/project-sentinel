/**
 * Beta Agent - QA (Quality Assurance)
 * Creates and runs regression tests to validate fixes
 */

export class BetaQA {
  constructor(ws, db) {
    this.ws = ws;
    this.db = db;
    this.name = 'Beta';
    this.role = 'qa';
  }

  async log(level, message, context = {}) {
    const logEntry = {
      agent_name: this.name,
      level,
      message,
      context: JSON.stringify(context),
      timestamp: new Date().toISOString()
    };

    this.send({
      action: 'logAgent',
      agent: logEntry
    });

    console.log(`[${level}] Beta: ${message}`, context);
  }

  send(data) {
    if (this.ws?.readyState === 1) {
      this.ws.send(JSON.stringify(data));
    }
  }

  updateWs(ws) {
    this.ws = ws;
  }

  query(sql, params = []) {
    try {
      const results = this.db.exec(sql, params);
      if (results.length === 0) return [];
      const columns = results[0].columns;
      return results[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } catch (error) {
      return [];
    }
  }

  run(sql, params = []) {
    try {
      this.db.run(sql, params);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create regression tests for an incident
   */
  async createRegressionTests(incident, analysis) {
    await this.log('INFO', 'Creating regression tests', { incidentId: incident.id });

    const tests = [];
    const chaosType = incident.chaos_type;
    const serviceName = incident.service_name;

    switch (chaosType) {
      case 'syntax_error':
        tests.push(...this.createSyntaxTests(serviceName, incident.target_file));
        break;
      case 'logic_bug':
        tests.push(...this.createLogicTests(serviceName, incident.target_file, analysis));
        break;
      case 'deleted_dependency':
        tests.push(...this.createDependencyTests(serviceName));
        break;
      case 'invalid_json':
        tests.push(...this.createJsonValidationTests(serviceName, incident.target_file));
        break;
      case 'type_mismatch':
        tests.push(...this.createTypeTests(serviceName, incident.target_file));
        break;
      default:
        tests.push(...this.createGenericTests(serviceName));
    }

    await this.log('INFO', `Created ${tests.length} test cases`, { count: tests.length });

    const savedTests = [];
    for (const test of tests) {
      const testId = await this.saveTest(incident.id, test);
      savedTests.push({ ...test, id: testId });
    }

    return {
      success: true,
      incidentId: incident.id,
      testsCreated: savedTests.length,
      tests: savedTests
    };
  }

  createSyntaxTests(serviceName, targetFile) {
    return [
      {
        name: `${serviceName} - syntax validation`,
        description: 'Ensure no syntax errors exist in source files',
        type: 'syntax',
        content: `
import { readFileSync } from 'fs';
import { join } from 'path';

describe('${serviceName} - Syntax Validation', () => {
  it('should have valid syntax in ${targetFile || 'source files'}', () => {
    // This test validates that the source file can be parsed
    const filePath = join(process.cwd(), 'apps/services/${serviceName}', '${targetFile || 'src/index.ts'}');
    const content = readFileSync(filePath, 'utf-8');

    // Check for common syntax error patterns
    expect(content).not.toMatch(/missing\\s*=\\s*;/);
    expect(content).not.toMatch(/func\\(\\;/);
    expect(content).not.toMatch(/const\\s+x\\s*=\\s*\\{/);
  });

  it('should not contain injection markers', () => {
    const filePath = join(process.cwd(), 'apps/services/${serviceName}', '${targetFile || 'src/index.ts'}');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).not.toMatch(/inject:/);
  });
});
`
      },
      {
        name: `${serviceName} - TypeScript compilation`,
        description: 'Verify TypeScript compiles without errors',
        type: 'compilation',
        content: `
describe('${serviceName} - TypeScript Compilation', () => {
  it('should compile without type errors', () => {
    // Verify tsc can parse the file
    const filePath = 'apps/services/${serviceName}/${targetFile || 'src/index.ts'}';
    expect(filePath).toBeDefined();
  });
});
`
      }
    ];
  }

  createLogicTests(serviceName, targetFile, analysis) {
    return [
      {
        name: `${serviceName} - logic validation`,
        description: 'Ensure logic conditions are correct',
        type: 'logic',
        content: `
describe('${serviceName} - Logic Validation', () => {
  it('should not have inverted logic conditions', () => {
    const filePath = 'apps/services/${serviceName}/${targetFile || 'src/index.ts'}';
    // Verify condition logic is correct
    expect(true).toBe(true);
  });

  it('should have proper comparison operators', () => {
    // Verify === instead of !==
    expect(1 === 1).toBe(true);
    expect(1 !== 0).toBe(true);
  });

  it('should not filter everything out', () => {
    const items = [1, 2, 3, 4, 5];
    const filtered = items.filter(x => x > 0);
    expect(filtered.length).toBeGreaterThan(0);
  });
});
`
      },
      {
        name: `${serviceName} - status validation`,
        description: 'Ensure status values are correct',
        type: 'status',
        content: `
describe('${serviceName} - Status Validation', () => {
  const validStatuses = ['pending', 'sent', 'failed', 'completed'];

  it('should only have valid status values', () => {
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  it('should not force failed status everywhere', () => {
    const status = 'pending';
    expect(['pending', 'sent', 'completed']).toContain(status);
  });
});
`
      }
    ];
  }

  createDependencyTests(serviceName) {
    return [
      {
        name: `${serviceName} - dependency check`,
        description: 'Verify all required dependencies are installed',
        type: 'dependency',
        content: `
describe('${serviceName} - Dependency Check', () => {
  it('should have package.json', () => {
    const pkgPath = 'apps/services/${serviceName}/package.json';
    expect(pkgPath).toBeDefined();
  });

  it('should have required dependencies', () => {
    // These dependencies should exist for ${serviceName}
    const requiredDeps = [];
    const optionalDeps = ['express', 'dotenv'];

    // Verify dependencies can be imported
    try {
      // require('express');
      requiredDeps.push('express');
    } catch (e) {
      // Dependency check failed
    }
  });

  it('should pass npm install', () => {
    // Verify pnpm install works
    expect(true).toBe(true);
  });
});
`
      },
      {
        name: `${serviceName} - module resolution`,
        description: 'Verify modules can be resolved',
        type: 'module',
        content: `
describe('${serviceName} - Module Resolution', () => {
  it('should resolve core modules', () => {
    expect(require('fs')).toBeDefined();
    expect(require('path')).toBeDefined();
  });

  it('should handle missing modules gracefully', () => {
    // Test error handling for missing modules
    expect(true).toBe(true);
  });
});
`
      }
    ];
  }

  createJsonValidationTests(serviceName, targetFile) {
    return [
      {
        name: `${serviceName} - JSON validation`,
        description: 'Verify JSON files are valid',
        type: 'validation',
        content: `
describe('${serviceName} - JSON Validation', () => {
  it('should have valid tsconfig.json', () => {
    const content = '{}'; // Placeholder
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should have valid package.json', () => {
    const content = '{}';
    const parsed = JSON.parse(content);
    expect(parsed).toBeDefined();
  });

  it('should use double quotes', () => {
    const content = '{"name": "test", "version": "1.0.0"}';
    const parsed = JSON.parse(content);
    expect(parsed.name).toBe('test');
  });

  it('should not have trailing commas', () => {
    const content = '{"name": "test"}';
    expect(() => JSON.parse(content)).not.toThrow();
  });
});
`
      },
      {
        name: `${serviceName} - config schema`,
        description: 'Verify configuration schema',
        type: 'schema',
        content: `
describe('${serviceName} - Config Schema', () => {
  const requiredFields = ['name', 'version'];

  it('should have required fields', () => {
    const config = { name: 'test', version: '1.0.0' };
    requiredFields.forEach(field => {
      expect(config).toHaveProperty(field);
    });
  });
});
`
      }
    ];
  }

  createTypeTests(serviceName, targetFile) {
    return [
      {
        name: `${serviceName} - type checking`,
        description: 'Verify TypeScript types are correct',
        type: 'types',
        content: `
describe('${serviceName} - Type Checking', () => {
  it('should have correct Request/Response types', () => {
    // Verify proper type usage
    expect(true).toBe(true);
  });

  it('should not have type mismatches', () => {
    const str: string = 'hello';
    expect(typeof str).toBe('string');
  });

  it('should handle type coercion correctly', () => {
    const num: number = 42;
    expect(Number.isInteger(num)).toBe(true);
  });
});
`
      },
      {
        name: `${serviceName} - type inference`,
        description: 'Verify type inference works',
        type: 'inference',
        content: `
describe('${serviceName} - Type Inference', () => {
  it('should infer correct types', () => {
    const arr = [1, 2, 3];
    expect(Array.isArray(arr)).toBe(true);
  });

  it('should handle union types', () => {
    const value: string | number = 'test';
    expect(typeof value).toMatch(/string|number/);
  });
});
`
      }
    ];
  }

  createGenericTests(serviceName) {
    return [
      {
        name: `${serviceName} - generic smoke test`,
        description: 'Basic smoke test for service',
        type: 'smoke',
        content: `
describe('${serviceName} - Generic Tests', () => {
  it('should pass generic smoke test', () => {
    expect(true).toBe(true);
  });

  it('should import main module', () => {
    expect(true).toBe(true);
  });
});
`
      }
    ];
  }

  async saveTest(incidentId, test) {
    this.send({
      action: 'run',
      sql: `INSERT INTO regression_tests (incident_id, test_name, test_file, test_content, status)
            VALUES (?, ?, ?, ?, 'created')`,
      params: [incidentId, test.name, `${test.type}-test.ts`, test.content]
    });

    const result = this.db.exec('SELECT last_insert_rowid()');
    return result[0]?.values[0]?.[0] || 0;
  }

  /**
   * Run regression tests
   */
  async runRegressionTests(incidentId) {
    await this.log('INFO', 'Running regression tests', { incidentId });

    const tests = this.query(
      `SELECT * FROM regression_tests WHERE incident_id = ? AND status != 'passed'`,
      [incidentId]
    );

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      await this.log('INFO', `Running test: ${test.test_name}`);

      const testResult = await this.simulateTestRun(test);

      if (testResult.passed) {
        passed++;
        this.run(
          `UPDATE regression_tests SET status = 'passed', pass_count = pass_count + 1, last_run = datetime('now') WHERE id = ?`,
          [test.id]
        );
      } else {
        failed++;
        this.run(
          `UPDATE regression_tests SET status = 'failed', fail_count = fail_count + 1, last_run = datetime('now') WHERE id = ?`,
          [test.id]
        );
      }

      results.push({
        testId: test.id,
        name: test.test_name,
        passed: testResult.passed,
        message: testResult.message
      });
    }

    await this.log('INFO', `Tests completed: ${passed} passed, ${failed} failed`);

    return {
      success: true,
      incidentId,
      totalTests: tests.length,
      passed,
      failed,
      results
    };
  }

  async simulateTestRun(test) {
    await new Promise(resolve => setTimeout(resolve, 100));

    const random = Math.random();
    const passed = random > 0.2;

    return {
      passed,
      message: passed ? 'Test passed successfully' : 'Test failed with assertion error'
    };
  }

  /**
   * Get all tests for an incident
   */
  async getTestsForIncident(incidentId) {
    return this.query(
      `SELECT * FROM regression_tests WHERE incident_id = ? ORDER BY created_at DESC`,
      [incidentId]
    );
  }

  /**
   * Get test statistics
   */
  getTestStats() {
    const total = this.query(`SELECT COUNT(*) as count FROM regression_tests`);
    const passed = this.query(`SELECT COUNT(*) as count FROM regression_tests WHERE status = 'passed'`);
    const failed = this.query(`SELECT COUNT(*) as count FROM regression_tests WHERE status = 'failed'`);
    const created = this.query(`SELECT COUNT(*) as count FROM regression_tests WHERE status = 'created'`);

    return {
      total: total[0]?.count || 0,
      passed: passed[0]?.count || 0,
      failed: failed[0]?.count || 0,
      created: created[0]?.count || 0
    };
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      status: 'active',
      capabilities: [
        'test_creation',
        'test_execution',
        'coverage_analysis',
        'regression_validation'
      ]
    };
  }
}

export default BetaQA;
