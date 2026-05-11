/**
 * Gamma Agent - Incident Manager
 * Orchestrates autonomous incident resolution workflow
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class GammaManager {
  constructor(ws, db, alpha, beta) {
    this.ws = ws;
    this.db = db;
    this.alpha = alpha;
    this.beta = beta;
    this.name = 'Gamma';
    this.role = 'incident_manager';
    this.isRunning = false;
    this.resolutionInterval = null;
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

    console.log(`[${level}] Gamma: ${message}`, context);
  }

  send(data) {
    if (this.ws?.readyState === 1) {
      this.ws.send(JSON.stringify(data));
    }
  }

  updateWs(ws) {
    this.ws = ws;
    // Also update alpha and beta ws references
    if (this.alpha) this.alpha.ws = ws;
    if (this.beta) this.beta.ws = ws;
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
   * Start autonomous incident resolution
   */
  startAutonomousMode(intervalMs = 30000) {
    if (this.isRunning) {
      this.log('WARN', 'Autonomous mode already running');
      return;
    }

    this.isRunning = true;
    this.log('INFO', 'Starting autonomous incident resolution', { intervalMs });

    this.resolutionInterval = setInterval(async () => {
      await this.processIncidents();
    }, intervalMs);

    this.processIncidents();
  }

  /**
   * Stop autonomous mode
   */
  stopAutonomousMode() {
    if (this.resolutionInterval) {
      clearInterval(this.resolutionInterval);
      this.resolutionInterval = null;
    }
    this.isRunning = false;
    this.log('INFO', 'Stopped autonomous mode');
  }

  /**
   * Process all active critical incidents
   */
  async processIncidents() {
    const criticalIncidents = this.query(`
      SELECT * FROM incidents
      WHERE status = 'active' AND severity = 'critical'
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    if (criticalIncidents.length === 0) {
      this.log('DEBUG', 'No critical incidents to process');
      return;
    }

    this.log('INFO', `Found ${criticalIncidents.length} critical incidents to process`);

    for (const incident of criticalIncidents) {
      await this.resolveIncident(incident);
    }
  }

  /**
   * Resolve a single incident through the full workflow
   */
  async resolveIncident(incident) {
    const startTime = Date.now();
    const workflow = [];

    try {
      this.log('INFO', 'Starting incident resolution', { incidentId: incident.id, service: incident.service_name });

      workflow.push({ step: 'detect', agent: 'Gamma', status: 'completed', timestamp: new Date().toISOString() });

      // Step 1: Alpha analyzes the incident
      this.log('INFO', 'Invoking Alpha (Debugger) for analysis', { incidentId: incident.id });
      workflow.push({ step: 'analyze', agent: 'Alpha', status: 'started', timestamp: new Date().toISOString() });

      const analysis = await this.alpha.analyzeIncident(incident);
      workflow.push({ step: 'analyze', agent: 'Alpha', status: 'completed', result: analysis.rootCause });

      // Step 2: Alpha generates a fix
      this.log('INFO', 'Invoking Alpha (Debugger) to generate fix', { incidentId: incident.id });
      workflow.push({ step: 'generate_fix', agent: 'Alpha', status: 'started', timestamp: new Date().toISOString() });

      const fixResult = await this.alpha.generateFix(incident, analysis);
      workflow.push({ step: 'generate_fix', agent: 'Alpha', status: 'completed', fixGenerated: fixResult.success });

      // Step 3: Beta creates regression tests
      this.log('INFO', 'Invoking Beta (QA) to create tests', { incidentId: incident.id });
      workflow.push({ step: 'create_tests', agent: 'Beta', status: 'started', timestamp: new Date().toISOString() });

      const testResult = await this.beta.createRegressionTests(incident, analysis);
      workflow.push({ step: 'create_tests', agent: 'Beta', status: 'completed', testsCreated: testResult.testsCreated });

      // Step 4: Beta runs regression tests
      this.log('INFO', 'Invoking Beta (QA) to run tests', { incidentId: incident.id });
      workflow.push({ step: 'run_tests', agent: 'Beta', status: 'started', timestamp: new Date().toISOString() });

      const runResult = await this.beta.runRegressionTests(incident.id);
      workflow.push({ step: 'run_tests', agent: 'Beta', status: 'completed', passed: runResult.passed, failed: runResult.failed });

      // Step 5: Generate and save incident report
      const resolutionTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
      const report = this.generateReport(incident, analysis, fixResult, testResult, runResult, resolutionTimeSeconds, workflow);

      this.log('INFO', 'Generating incident report', { incidentId: incident.id });
      const reportId = await this.saveReport(report);

      // Step 6: Update incident status
      this.run(`UPDATE incidents SET status = 'resolved' WHERE id = ?`, [incident.id]);

      this.log('INFO', 'Incident resolved successfully', {
        incidentId: incident.id,
        resolutionTime: `${resolutionTimeSeconds}s`,
        testsPassed: runResult.passed
      });

      this.broadcastResolution(incident, report);

      return {
        success: true,
        incidentId: incident.id,
        resolutionTime: resolutionTimeSeconds,
        testsPassed: runResult.passed,
        testsFailed: runResult.failed,
        reportId
      };

    } catch (error) {
      this.log('ERROR', 'Incident resolution failed', { incidentId: incident.id, error: error.message });
      workflow.push({ step: 'error', agent: 'Gamma', status: 'failed', error: error.message });

      return {
        success: false,
        incidentId: incident.id,
        error: error.message,
        workflow
      };
    }
  }

  /**
   * Generate incident report
   */
  generateReport(incident, analysis, fixResult, testResult, runResult, resolutionTimeSeconds, workflow) {
    return {
      incidentId: incident.id,
      title: `Incident ${incident.id}: ${incident.chaos_type} in ${incident.service_name}`,
      summary: this.generateSummary(incident, analysis, runResult),
      rootCause: analysis.rootCause,
      fixApplied: fixResult.success ? fixResult.fixDescription : 'No fix applied',
      testsCreated: testResult.testsCreated || 0,
      testsPassed: runResult.passed || 0,
      resolutionTime: resolutionTimeSeconds,
      workflow: JSON.stringify(workflow),
      content: this.generateDetailedReport(incident, analysis, fixResult, runResult, workflow)
    };
  }

  generateSummary(incident, analysis, runResult) {
    return `Resolved ${incident.chaos_type} incident in ${incident.service_name}. ` +
      `Root cause: ${analysis.rootCause}. ` +
      `Created ${runResult.totalTests || 0} tests, ${runResult.passed || 0} passed, ${runResult.failed || 0} failed.`;
  }

  generateDetailedReport(incident, analysis, fixResult, runResult, workflow) {
    return JSON.stringify({
      incident: {
        id: incident.id,
        service: incident.service_name,
        type: incident.chaos_type,
        severity: incident.severity,
        targetFile: incident.target_file,
        description: incident.description
      },
      analysis: {
        errorsFound: analysis.errorCount,
        rootCause: analysis.rootCause,
        suggestions: analysis.suggestions
      },
      fix: {
        generated: fixResult.success,
        description: fixResult.fixDescription,
        contentAvailable: !!fixResult.fixContent
      },
      tests: {
        created: runResult.totalTests || 0,
        passed: runResult.passed || 0,
        failed: runResult.failed || 0
      },
      workflow: workflow,
      resolutionTimeSeconds: runResult.resolutionTimeSeconds || 0
    }, null, 2);
  }

  /**
   * Save report to database
   */
  async saveReport(report) {
    this.send({
      action: 'run',
      sql: `INSERT INTO incident_reports
        (incident_id, title, summary, root_cause, fix_applied, tests_created, tests_passed, resolution_time_seconds, agent_workflow, report_content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        report.incidentId,
        report.title,
        report.summary,
        report.rootCause,
        report.fixApplied,
        report.testsCreated,
        report.testsPassed,
        report.resolutionTime,
        report.workflow,
        report.content
      ]
    });

    // Also append to incident-history.log
    this.appendToHistory(report);

    const result = this.db.exec('SELECT last_insert_rowid()');
    return result[0]?.values[0]?.[0] || 0;
  }

  /**
   * Append incident to history log
   */
  appendToHistory(report) {
    try {
      const historyPath = join(process.cwd(), 'docs', 'incident-history.log');
      const entry = `[${new Date().toISOString()}] ${report.testsPassed > 0 ? 'RESOLVED' : 'FAILED'} Incident #${report.incidentId}: ${report.title} | Tests: ${report.testsPassed}/${report.testsCreated} passed | Resolution: ${report.resolutionTime}s\n`;
      appendFileSync(historyPath, entry);
    } catch (error) {
      console.warn('Failed to write to incident history:', error.message);
    }
  }

  /**
   * Broadcast resolution to connected clients
   */
  broadcastResolution(incident, report) {
    this.send({
      type: 'incident_resolved',
      incident,
      report,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Manually trigger resolution for an incident
   */
  async resolveIncidentManually(incidentId) {
    const incident = this.query(`SELECT * FROM incidents WHERE id = ?`, [incidentId]);

    if (!incident || incident.length === 0) {
      return { success: false, error: 'Incident not found' };
    }

    return await this.resolveIncident(incident[0]);
  }

  /**
   * Get all reports
   */
  getReports(limit = 20) {
    return this.query(`SELECT * FROM incident_reports ORDER BY created_at DESC LIMIT ?`, [limit]);
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      status: this.isRunning ? 'autonomous' : 'idle',
      isRunning: this.isRunning,
      capabilities: [
        'incident_detection',
        'workflow_orchestration',
        'report_generation',
        'autonomous_resolution'
      ]
    };
  }

  /**
   * Generate post-mortem report for today
   */
  generatePostMortem() {
    const today = new Date().toISOString().split('T')[0];
    const reports = this.query(`
      SELECT * FROM incident_reports
      WHERE created_at >= ?
      ORDER BY created_at DESC
    `, [today]);

    const total = reports.length;
    const resolved = reports.filter(r => r.tests_passed > 0).length;
    const failed = total - resolved;
    const totalResolutionTime = reports.reduce((sum, r) => sum + (r.resolution_time_seconds || 0), 0);
    const avgResolutionTime = total > 0 ? Math.round(totalResolutionTime / total) : 0;

    const services = [...new Set(reports.map(r => {
      const match = r.title?.match(/in (.+)$/);
      return match ? match[1] : 'Unknown';
    }))];

    const chaosTypes = [...new Set(reports.map(r => {
      const match = r.title?.match(/#\d+: (.+) in/);
      return match ? match[1] : 'Unknown';
    }))];

    return {
      generatedAt: new Date().toISOString(),
      period: today,
      summary: {
        totalIncidents: total,
        resolved: resolved,
        failed: failed,
        resolutionRate: total > 0 ? `${Math.round((resolved / total) * 100)}%` : 'N/A',
        avgResolutionTimeSeconds: avgResolutionTime
      },
      affectedServices: services,
      incidentTypes: chaosTypes,
      reports: reports
    };
  }
}

export default GammaManager;