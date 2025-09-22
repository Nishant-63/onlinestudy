#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting OnlineStudy Backend with Database Migration...');

// Function to run a command and wait for it to complete
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${command} failed with exit code ${code}`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${command}:`, error);
      reject(error);
    });
  });
}

// Main startup function
async function startWithMigration() {
  try {
    console.log('🔧 Running database migrations...');
    await runCommand('npm', ['run', 'migrate']);
    
    console.log('🎯 Starting server...');
    await runCommand('npm', ['start']);
    
  } catch (error) {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the application
startWithMigration();
