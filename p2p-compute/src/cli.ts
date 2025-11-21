#!/usr/bin/env node

/**
 * CLI tool for P2P Compute Platform
 * Provides easy commands to start server and manage peers
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

function getLocalIPAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const details of iface) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
  return 'localhost';
}

program
  .name('p2p-compute')
  .description('P2P File Sharing & Compute Platform CLI')
  .version('2.0.0');

program
  .command('start')
  .description('Start the P2P signaling server')
  .option('-p, --port <number>', 'Port to run the server on', '3000')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action((options) => {
    const spinner = ora('Starting P2P server...').start();
    
    const port = options.port;
    const localIP = getLocalIPAddress();
    
    setTimeout(() => {
      spinner.succeed('P2P server started!');
      
      console.log('\n' + chalk.cyan('═══════════════════════════════════════════'));
      console.log(chalk.bold.cyan('  🌐 P2P Compute & File Sharing Platform'));
      console.log(chalk.cyan('═══════════════════════════════════════════\n'));
      
      console.log(chalk.white('📡 Server running on:\n'));
      console.log(`   ${chalk.green('Local:')}   ${chalk.underline(`http://localhost:${port}`)}`);
      console.log(`   ${chalk.green('Network:')} ${chalk.underline(`http://${localIP}:${port}`)}\n`);
      
      console.log(chalk.yellow('💡 Tips:'));
      console.log('   • Open the Local URL to connect from this computer');
      console.log('   • Share the Network URL with other devices on your network');
      console.log('   • Press Ctrl+C to stop the server\n');
      
      console.log(chalk.cyan('═══════════════════════════════════════════\n'));
    }, 500);
    
    // Start the actual server
    const serverPath = join(__dirname, 'server.js');
    const serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: port },
      stdio: options.verbose ? 'inherit' : 'ignore',
    });
    
    serverProcess.on('error', (error) => {
      spinner.fail('Failed to start server');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    });
    
    process.on('SIGINT', () => {
      console.log('\n\n' + chalk.yellow('Shutting down server...'));
      serverProcess.kill();
      process.exit(0);
    });
  });

program
  .command('info')
  .description('Display network information')
  .action(() => {
    const localIP = getLocalIPAddress();
    
    console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.bold.cyan('  Network Information'));
    console.log(chalk.cyan('═══════════════════════════════════════\n'));
    
    console.log(chalk.white('Your network addresses:\n'));
    console.log(`   ${chalk.green('Local IP:')}  ${localIP}`);
    console.log(`   ${chalk.green('Hostname:')}  ${os.hostname()}\n`);
    
    console.log(chalk.white('System information:\n'));
    console.log(`   ${chalk.green('Platform:')}  ${os.platform()} ${os.arch()}`);
    console.log(`   ${chalk.green('CPU Cores:')} ${os.cpus().length}`);
    console.log(`   ${chalk.green('Total RAM:')} ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\n`);
    
    console.log(chalk.cyan('═══════════════════════════════════════\n'));
  });

program
  .command('help-setup')
  .description('Display setup instructions')
  .action(() => {
    console.log('\n' + chalk.cyan('═══════════════════════════════════════════'));
    console.log(chalk.bold.cyan('  Setup Instructions'));
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));
    
    console.log(chalk.white('To share files between computers:\n'));
    
    console.log(chalk.yellow('1. On the HOST computer:'));
    console.log('   ' + chalk.white('npm start') + ' or ' + chalk.white('p2p-compute start\n'));
    
    console.log(chalk.yellow('2. Note the Network URL:'));
    console.log('   ' + chalk.green('http://192.168.1.X:3000\n'));
    
    console.log(chalk.yellow('3. On OTHER devices:'));
    console.log('   Open browser and navigate to the Network URL\n');
    
    console.log(chalk.yellow('4. Connect both devices:'));
    console.log('   • Enter your name');
    console.log('   • Click "Connect to Network"');
    console.log('   • Wait for peers to appear\n');
    
    console.log(chalk.yellow('5. Share files:'));
    console.log('   • Select a peer from the list');
    console.log('   • Drag & drop files or click to select');
    console.log('   • Click "Send"\n');
    
    console.log(chalk.cyan('═══════════════════════════════════════════\n'));
  });

program.parse();

