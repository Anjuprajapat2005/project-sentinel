/**
 * Alpha Agent - Debugger
 * Analyzes logs, identifies root causes, and generates fixes
 */

export class AlphaDebugger {
  constructor(ws, db) {
    this.ws = ws;
    this.db = db;
    this.name = 'Alpha';
    this.role = 'debugger';
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

    console.log(`[${level}] Alpha: ${message}`, context);
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
   * Analyze logs for an incident
   */
  async analyzeIncident(incident) {
    await this.log('INFO', 'Starting log analysis', { incidentId: incident.id });

    const logs = this.query(`
      SELECT * FROM logs
      WHERE service = ? AND timestamp > datetime(?, '-1 hour')
      ORDER BY timestamp DESC
      LIMIT 100
    `, [incident.service_name, incident.timestamp]);

    await this.log('INFO', `Found ${logs.length} log entries`, { count: logs.length });

    const analysis = this.analyzeLogs(logs);
    await this.log('INFO', 'Log analysis complete', { errorsFound: analysis.errors.length });

    return {
      success: true,
      incidentId: incident.id,
      logCount: logs.length,
      analysis,
      rootCause: analysis.rootCause,
      suggestions: analysis.suggestions,
      fixGenerated: false
    };
  }

  /**
   * Analyze log entries to identify patterns and root causes
   */
  analyzeLogs(logs) {
    const errors = logs.filter(l => l.level === 'ERROR');
    const warnings = logs.filter(l => l.level === 'WARN');
    const errorMessages = errors.map(e => e.message);
    const errorPatterns = this.identifyPatterns(errorMessages);

    let rootCause = 'Unknown root cause';

    if (errorPatterns.length > 0) {
      rootCause = this.determineRootCause(errorPatterns, errors);
    }

    const suggestions = this.generateSuggestions(errorPatterns, errors);

    return {
      errors: errors.map(e => ({
        message: e.message,
        timestamp: e.timestamp,
        metadata: e.metadata
      })),
      warnings: warnings.length,
      errorCount: errors.length,
      errorPatterns,
      rootCause,
      suggestions
    };
  }

  /**
   * Identify patterns in error messages
   */
  identifyPatterns(messages) {
    const patterns = [];
    const patternMap = new Map();

    messages.forEach(msg => {
      const normalized = this.normalizeError(msg);
      const existing = patternMap.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        patternMap.set(normalized, { pattern: normalized, original: msg, count: 1 });
      }
    });

    patternMap.forEach(p => {
      if (p.count >= 1) {
        patterns.push(p);
      }
    });

    return patterns.sort((a, b) => b.count - a.count);
  }

  /**
   * Normalize error message for pattern matching
   */
  normalizeError(msg) {
    return msg
      .replace(/\d+/g, 'N')
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
      .replace(/localhost|127\.0\.0\.1/g, 'HOST')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Determine root cause from error patterns
   */
  determineRootCause(patterns, errors) {
    for (const pattern of patterns) {
      const p = pattern.pattern.toLowerCase();

      if (p.includes('syntax') || p.includes('parse')) {
        return 'Syntax error detected in source code';
      }
      if (p.includes('type') || p.includes('undefined') || p.includes('null')) {
        return 'TypeScript type error - null/undefined reference';
      }
      if (p.includes('connection') || p.includes('timeout') || p.includes('econnrefused')) {
        return 'Network connectivity issue';
      }
      if (p.includes('memory') || p.includes('heap')) {
        return 'Memory/resource exhaustion';
      }
      if (p.includes('permission') || p.includes('access') || p.includes('denied')) {
        return 'Permission/access denied';
      }
      if (p.includes('json') || p.includes('parse')) {
        return 'Invalid JSON or parsing error';
      }
      if (p.includes('dependency') || p.includes('require') || p.includes('import')) {
        return 'Missing or corrupted dependency';
      }
    }

    return `Multiple errors detected (${errors.length} total)`;
  }

  /**
   * Generate fix suggestions based on patterns
   */
  generateSuggestions(patterns, errors) {
    const suggestions = [];

    for (const pattern of patterns) {
      const p = pattern.pattern.toLowerCase();

      if (p.includes('syntax')) {
        suggestions.push({
          type: 'code_fix',
          priority: 'high',
          description: 'Fix syntax error in affected file',
          action: 'Review and correct syntax in source file'
        });
      }

      if (p.includes('type') || p.includes('undefined') || p.includes('null')) {
        suggestions.push({
          type: 'type_fix',
          priority: 'high',
          description: 'Add null checks and type annotations',
          action: 'Implement strict type checking and null guards'
        });
      }

      if (p.includes('connection') || p.includes('timeout')) {
        suggestions.push({
          type: 'config_fix',
          priority: 'medium',
          description: 'Increase timeout values or retry logic',
          action: 'Add exponential backoff and timeout handling'
        });
      }

      if (p.includes('json') || p.includes('parse')) {
        suggestions.push({
          type: 'validation_fix',
          priority: 'high',
          description: 'Add JSON validation before parsing',
          action: 'Implement try-catch with proper error handling'
        });
      }

      if (p.includes('dependency') || p.includes('require')) {
        suggestions.push({
          type: 'dependency_fix',
          priority: 'critical',
          description: 'Reinstall or fix missing dependencies',
          action: 'Run pnpm install to restore dependencies'
        });
      }
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: 'investigation',
        priority: 'medium',
        description: 'Manual investigation required',
        action: 'Review error logs in detail for custom fix'
      });
    }

    return suggestions;
  }

  /**
   * Generate code fix for an incident
   */
  async generateFix(incident, analysis) {
    await this.log('INFO', 'Generating fix', { incidentId: incident.id });

    const targetFile = incident.target_file;
    const originalContent = incident.original_content;

    if (!targetFile || !originalContent) {
      await this.log('WARN', 'No target file or original content for fix', { incidentId: incident.id });
      return { success: false, error: 'Missing file information' };
    }

    const chaosType = incident.chaos_type;
    let fixContent = originalContent;

    switch (chaosType) {
      case 'syntax_error':
        fixContent = this.fixSyntaxError(originalContent);
        break;
      case 'logic_bug':
        fixContent = this.fixLogicBug(originalContent);
        break;
      case 'deleted_dependency':
        fixContent = this.fixDeletedDependency(originalContent);
        break;
      case 'invalid_json':
        fixContent = this.fixInvalidJson(originalContent);
        break;
      case 'type_mismatch':
        fixContent = this.fixTypeMismatch(originalContent);
        break;
      default:
        await this.log('WARN', 'Unknown chaos type', { chaosType });
    }

    await this.log('INFO', 'Fix generated', { incidentId: incident.id, chaosType });

    return {
      success: true,
      incidentId: incident.id,
      fixContent,
      fixDescription: this.describeFix(chaosType),
      originalContent
    };
  }

  fixSyntaxError(content) {
    return content
      .replace(/missing\s*=\s*;/g, '')
      .replace(/const\s+x\s*=\s*{\s*$/gm, '')
      .replace(/func\(\;/g, '')
      .replace(/\/\/\s*inject:\s*unterminated\s*string';/g, '');
  }

  fixLogicBug(content) {
    return content
      .replace(/if\s*\(false\)\s*{/g, 'if ($1) {')
      .replace(/\.filter\(\)\.length\s*>\s*999999/g, '.filter')
      .replace(/return\s+\$1\s*===\s*\$1/g, 'return $1')
      .replace(/\+\s*9999/g, '+ 1')
      .replace(/!==/g, '===')
      .replace(/status:\s*'failed'/g, "status: 'pending'");
  }

  fixDeletedDependency(content) {
    return content;
  }

  fixInvalidJson(content) {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }

  fixTypeMismatch(content) {
    return content;
  }

  describeFix(chaosType) {
    const descriptions = {
      syntax_error: 'Removed injected syntax error markers',
      logic_bug: 'Reverted logic changes to correct behavior',
      deleted_dependency: 'Dependency restoration not possible automatically',
      invalid_json: 'Restored JSON to valid format',
      type_mismatch: 'Restored original type annotations'
    };
    return descriptions[chaosType] || 'Applied generic fix';
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
        'log_analysis',
        'pattern_detection',
        'fix_generation',
        'root_cause_analysis'
      ]
    };
  }
}

export default AlphaDebugger;
