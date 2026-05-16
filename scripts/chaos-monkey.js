// Chaos Monkey - Entry point wrapper
// Run from: node chaos-monkey.js [command]
// Commands: incidents, rollback <id>, inject <service>, or empty for continuous mode

import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const scriptPath = path.join(__dirname, 'chaos-monkey', 'dist', 'index.js');
const projectRoot = 'C:\\Users\\praja\\project-sentinel';

const child = spawn('node', [scriptPath, ...args], {
  cwd: projectRoot,
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code ?? 0));
