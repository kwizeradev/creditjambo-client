import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const COLORS = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

// Check if we're on Windows to handle different shell behavior
const isWindows = os.platform() === 'win32';

const log = {
  info: (msg: string) => console.log(`${COLORS.yellow}ℹ${COLORS.reset} ${msg}`),
  success: (msg: string) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg: string) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  header: (msg: string) => {
    console.log(`${COLORS.blue}═══════════════════════════════════════════${COLORS.reset}`);
    console.log(`${COLORS.blue}  ${msg}${COLORS.reset}`);
    console.log(`${COLORS.blue}═══════════════════════════════════════════${COLORS.reset}\n`);
  },
};

function checkDocker() {
  try {
    log.info('Checking Docker installation...');
    const dockerVersion = execSync('docker --version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`   ${dockerVersion.trim()}`);
    
    log.info('Checking Docker daemon...');
    execSync('docker info', { stdio: ['pipe', 'ignore', 'pipe'] });
    log.success('Docker is installed and running');
  } catch (error) {
    log.error('Docker not installed or not running. Please start Docker Desktop.');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

function checkDockerCompose() {
  try {
    log.info('Checking Docker Compose...');
    const composeVersion = execSync('docker compose version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`   ${composeVersion.trim()}`);
    log.success('Docker Compose is available');
  } catch (error) {
    log.error('Docker Compose is missing.');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

function setupEnvFile() {
  const envPath = path.resolve('.env');
  const dockerEnv = path.resolve('.env.docker');
  if (!fs.existsSync(envPath)) {
    log.info('Creating .env from .env.docker...');
    fs.copyFileSync(dockerEnv, envPath);
    log.success('.env created');
  } else {
    log.info('.env already exists');
  }

  const ip = getLocalIP();
  let content = fs.readFileSync(envPath, 'utf8');
  const cors = `CORS_ORIGIN=http://localhost:5174,http://${ip}:8081,exp://${ip}:8081`;
  content = content.replace(/^CORS_ORIGIN=.*/m, cors);
  fs.writeFileSync(envPath, content);
  log.success(`Updated .env with current IP: ${ip}`);
}

function runDocker() {
  log.info('Building and starting Docker services...');
  console.log('This may take a few minutes on first run...\n');
  
  try {
    // Use inherit to show all Docker output in real-time
    execSync('docker compose up --build -d', { 
      stdio: 'inherit'
    });
    
    console.log(''); // Add spacing after Docker output
    log.info('Checking service status...');
    
    // Show container status
    const status = execSync('docker compose ps', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(status);
    
  } catch (error) {
    log.error('Failed to start Docker services');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

function main() {
  try {
    log.header('Credit Jambo Client - TypeScript Setup');
    
    console.log(`Platform: ${os.platform()} ${os.arch()}`);
    console.log(`Node.js: ${process.version}\n`);
    
    checkDocker();
    checkDockerCompose();
    setupEnvFile();
    runDocker();
    
    log.success('Setup completed successfully!');
    console.log('\n🚀 Services are now running:');
    console.log('   Backend: http://localhost:4000');
    console.log('\n💡 Use these commands to manage your services:');
    console.log('   npm run logs      - View live logs');
    console.log('   npm run teardown  - Stop all services');
    console.log('   npm run docker:restart - Restart services\n');
  } catch (error) {
    log.error('Setup failed');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Ensure we handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception occurred');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled promise rejection');
  console.error('At:', promise, 'reason:', reason);
  process.exit(1);
});

main();
