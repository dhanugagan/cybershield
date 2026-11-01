/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundlePath = path.join(__dirname, 'dist', 'server.bundle.mjs');

// 1. If pre-bundled production server exists, run it directly with pure Node.js!
if (fs.existsSync(bundlePath)) {
  await import(`file://${bundlePath}`);
} else if (
  process.env.__TSX_BOOTSTRAPPED__ === 'true' ||
  process.execArgv.some((arg) => arg.includes('tsx'))
) {
  // 2. Already running under tsx
  await import('./server.app.ts');
} else {
  // 3. Running under plain node without bundle: respawn with --import tsx
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: { ...process.env, __TSX_BOOTSTRAPPED__: 'true' },
    }
  );

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}
