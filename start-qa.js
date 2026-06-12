const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env.qa');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`No se pudo cargar .env.qa: ${result.error.message}`);
  process.exit(1);
}

const port = process.env.PORT || '3000';
const environment = process.env.QA_ENV || process.env.REACT_APP_ENV || 'qa';
const reactScripts = require.resolve('react-scripts/bin/react-scripts.js');

console.log(`Node.js ${process.version}`);
console.log(`🚀 Frontend running on port ${port}`);
console.log(`🌎 Environment: ${environment}`);

const child = spawn(process.execPath, [reactScripts, 'start'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code || 0);
});
