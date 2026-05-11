/**
 * Slack Notification Integration
 * Sends alerts to Slack when incidents are resolved
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, '..', '..', 'config', 'notifications.json');

export interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username: string;
  enabled: boolean;
}

export interface IncidentAlert {
  incidentId: number;
  service: string;
  chaosType: string;
  severity: string;
  rootCause: string;
  testsPassed: number;
  testsFailed: number;
  resolutionTime: number;
  status: 'resolved' | 'failed';
}

function loadConfig(): SlackConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      const data = readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load Slack config:', error);
  }
  return {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    channel: process.env.SLACK_CHANNEL || '#incidents',
    username: 'Project Sentinel',
    enabled: !!process.env.SLACK_WEBHOOK_URL
  };
}

export async function sendIncidentResolved(alert: IncidentAlert): Promise<boolean> {
  const config = loadConfig();
  if (!config.enabled || !config.webhookUrl) {
    console.log('Slack notifications disabled, skipping alert');
    return false;
  }

  const statusEmoji = alert.status === 'resolved' ? ':white_check_mark:' : ':x:';
  const severityColor = alert.severity === 'critical' ? '#dc2626' : '#f59e0b';

  const payload = {
    channel: config.channel,
    username: config.username,
    attachments: [
      {
        color: severityColor,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${statusEmoji} Incident ${alert.status === 'resolved' ? 'Resolved' : 'Failed'}: ${alert.chaosType}`,
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Service:*\n${alert.service}`
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${alert.severity.toUpperCase()}`
              },
              {
                type: 'mrkdwn',
                text: `*Incident ID:*\n#${alert.incidentId}`
              },
              {
                type: 'mrkdwn',
                text: `*Resolution Time:*\n${alert.resolutionTime}s`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Root Cause:*\n${alert.rootCause || 'N/A'}`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Tests Passed:*\n:white_check_mark: ${alert.testsPassed}`
              },
              {
                type: 'mrkdwn',
                text: `*Tests Failed:*\n:x: ${alert.testsFailed}`
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Sent by Project Sentinel | ${new Date().toISOString()}`
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

export async function sendSystemHealthAlert(
  healthyCount: number,
  criticalCount: number,
  services: { name: string; status: string }[]
): Promise<boolean> {
  const config = loadConfig();
  if (!config.enabled || !config.webhookUrl) {
    return false;
  }

  const criticalServices = services.filter(s => s.status === 'critical');

  const payload = {
    channel: config.channel,
    username: config.username,
    attachments: [
      {
        color: criticalCount > 0 ? '#dc2626' : '#22c55e',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: criticalCount > 0 ? ':warning: System Health Alert' : ':white_check_mark: System Healthy',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Healthy Services:*\n:white_check_mark: ${healthyCount}`
              },
              {
                type: 'mrkdwn',
                text: `*Critical Services:*\n:x: ${criticalCount}`
              }
            ]
          },
          ...(criticalServices.length > 0 ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Critical Services:*\n${criticalServices.map(s => `• ${s.name}`).join('\n')}`
            }
          }] : [])
        ]
      }
    ]
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send Slack health alert:', error);
    return false;
  }
}

export async function sendAutonomousModeAlert(mode: 'started' | 'stopped'): Promise<boolean> {
  const config = loadConfig();
  if (!config.enabled || !config.webhookUrl) {
    return false;
  }

  const emoji = mode === 'started' ? ':robot_face:' : ':stop_button:';
  const payload = {
    channel: config.channel,
    username: config.username,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *Autonomous Mode ${mode === 'started' ? 'Started' : 'Stopped'}*\nProject Sentinel incident resolution is now ${mode === 'started' ? 'running autonomously' : 'stopped'}.`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${new Date().toISOString()}`
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send Slack autonomous alert:', error);
    return false;
  }
}
