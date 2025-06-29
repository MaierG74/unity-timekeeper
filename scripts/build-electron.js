const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Source directory for Electron TypeScript files
const sourceDir = path.join(__dirname, '..', 'electron');

// Output directory for compiled JavaScript
const outDir = path.join(__dirname, '..', 'electron');

// Create output directory if it doesn't exist
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Compiling Electron TypeScript files...');

try {
  // Compile TypeScript files
  execSync(`npx tsc --project ${path.join(__dirname, '..', 'tsconfig.electron.json')}`, {
    stdio: 'inherit'
  });
  
  console.log('Electron TypeScript files compiled successfully.');
} catch (error) {
  console.error('Error compiling Electron TypeScript files:', error);
  process.exit(1);
} 