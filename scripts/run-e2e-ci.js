const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCommand = 'npm';
const npxCommand = 'npx';
const frontendRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(frontendRoot, '..', 'Sistema-de-Rentabilidad-Backend-');

const frontendUrl = process.env.QA_FRONTEND_URL || 'http://localhost:3001';
const backendUrl = process.env.QA_BACKEND_URL || 'http://localhost:3000';
const backendHealthUrl = `${backendUrl}/health`;
const children = [];
let stopping = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const quoteWindowsArg = (arg) => {
  if (!/[\s"&<>|^]/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
};

const getSpawnCommand = (command, args) => {
  if (!isWindows) {
    return { command, args };
  }

  return {
    command: 'cmd.exe',
    args: ['/d', '/c', [command, ...args].map(quoteWindowsArg).join(' ')],
  };
};

const prefixOutput = (name, stream) => (chunk) => {
  const lines = chunk.toString().split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    stream.write(`[${name}] ${line}\n`);
  }
};

const runCommand = (name, command, args, options = {}) => new Promise((resolve, reject) => {
  const spawnCommand = getSpawnCommand(command, args);
  const child = spawn(spawnCommand.command, spawnCommand.args, {
    cwd: options.cwd || frontendRoot,
    env: options.env || process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  child.stdout.on('data', prefixOutput(name, process.stdout));
  child.stderr.on('data', prefixOutput(name, process.stderr));
  child.on('error', reject);
  child.on('exit', (code, signal) => {
    if (code === 0) {
      resolve();
      return;
    }

    reject(new Error(`${name} failed with ${signal || `exit code ${code}`}`));
  });
});

const startServer = (name, command, args, options = {}) => {
  const spawnCommand = getSpawnCommand(command, args);
  const child = spawn(spawnCommand.command, spawnCommand.args, {
    cwd: options.cwd || frontendRoot,
    env: options.env || process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: !isWindows,
    windowsHide: true,
  });

  const server = {
    name,
    child,
    exited: false,
    code: null,
    signal: null,
  };

  child.stdout.on('data', prefixOutput(name, process.stdout));
  child.stderr.on('data', prefixOutput(name, process.stderr));
  child.on('exit', (code, signal) => {
    server.exited = true;
    server.code = code;
    server.signal = signal;

    if (!stopping) {
      process.stderr.write(`[${name}] exited early with ${signal || `exit code ${code}`}\n`);
    }
  });

  children.push(server);
  return server;
};

const requestUrl = (url) => new Promise((resolve, reject) => {
  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;
  const request = client.get(parsedUrl, (response) => {
    response.resume();
    resolve(response.statusCode >= 200 && response.statusCode < 400);
  });

  request.setTimeout(5000, () => {
    request.destroy(new Error(`Timeout waiting for ${url}`));
  });

  request.on('error', reject);
});

const waitForUrl = async (name, url, server) => {
  const timeoutMs = 120000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (server?.exited) {
      throw new Error(`${server.name} exited before ${url} was ready`);
    }

    try {
      if (await requestUrl(url)) {
        console.log(`[wait] ${name} ready at ${url}`);
        return;
      }
    } catch {
      // Keep polling until timeout.
    }

    await sleep(2000);
  }

  throw new Error(`${name} was not ready after ${timeoutMs / 1000}s: ${url}`);
};

const stopServer = (server) => new Promise((resolve) => {
  if (!server || server.exited) {
    resolve();
    return;
  }

  const { child } = server;
  const timeout = setTimeout(resolve, 5000);

  child.once('exit', () => {
    clearTimeout(timeout);
    resolve();
  });

  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    }).on('exit', () => {});
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    resolve();
  }
});

const cleanup = async () => {
  stopping = true;

  for (const server of [...children].reverse()) {
    await stopServer(server);
  }
};

const shutdown = async () => {
  await cleanup();
  process.exit(130);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  try {
    await runCommand('seed', npmCommand, ['run', 'seed:qa'], { cwd: backendRoot });

    const backend = startServer('backend', npmCommand, ['run', 'dev:qa'], { cwd: backendRoot });
    await waitForUrl('backend', backendHealthUrl, backend);

    const frontend = startServer('frontend', npmCommand, ['run', 'start:qa'], { cwd: frontendRoot });
    await waitForUrl('frontend', frontendUrl, frontend);

    await runCommand('playwright', npxCommand, ['playwright', 'test', '--workers=1'], {
      cwd: frontendRoot,
      env: {
        ...process.env,
        PLAYWRIGHT_SKIP_WEB_SERVER: 'true',
      },
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
})();
