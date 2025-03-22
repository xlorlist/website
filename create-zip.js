const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, 'discord-bot-manager.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('Archive created successfully');
  console.log(archive.pointer() + ' total bytes');
});

// Handle warnings during archiving
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning during archival:', err);
  } else {
    throw err;
  }
});

// Handle errors during archiving
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Directories and files to include
const filesToInclude = [
  'client',
  'server',
  'shared',
  'bot-templates',
  'drizzle.config.ts',
  'package.json',
  'postcss.config.js',
  'tailwind.config.ts',
  'theme.json',
  'tsconfig.json',
  'vite.config.ts'
];

// Files to exclude
const excludeFiles = [
  'node_modules',
  '.git',
  '.replit',
  '.gitignore',
  'discord-bot-manager.zip'
];

// Helper function to check if path should be excluded
const shouldExclude = (filePath) => {
  return excludeFiles.some(excludePath => 
    filePath.includes(excludePath) || 
    path.basename(filePath) === excludePath
  );
};

// Function to add directory recursively
const addDirectoryToArchive = (directory, archivePath) => {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (shouldExclude(filePath)) {
      continue;
    }
    
    if (stats.isDirectory()) {
      // Recursively add subdirectories
      addDirectoryToArchive(filePath, path.join(archivePath, file));
    } else {
      // Add file to archive
      archive.file(filePath, { name: path.join(archivePath, file) });
      console.log(`Added file: ${path.join(archivePath, file)}`);
    }
  }
};

// Add files and directories to the archive
filesToInclude.forEach(fileOrDir => {
  const fullPath = path.join(__dirname, fileOrDir);
  
  if (fs.existsSync(fullPath)) {
    if (fs.statSync(fullPath).isDirectory()) {
      addDirectoryToArchive(fullPath, fileOrDir);
      console.log(`Added directory: ${fileOrDir}`);
    } else {
      archive.file(fullPath, { name: fileOrDir });
      console.log(`Added file: ${fileOrDir}`);
    }
  } else {
    console.warn(`Warning: ${fileOrDir} does not exist and will not be included in the archive`);
  }
});

// Create a README file with deployment instructions
const readmeContent = `# Discord Bot Manager

This is a full-stack application for managing Discord bots with 24/7 uptime.

## Deployment Instructions

1. Unzip this file to your deployment location
2. Install dependencies with \`npm install\`
3. Build the application with \`npm run build\`
4. Start the server with \`npm start\`

## Environment Variables

You may need to set the following environment variables:
- PORT: The port for the application to run on (default: 5000)
- DISCORD_CLIENT_ID: Your Discord application client ID for OAuth
- DISCORD_CLIENT_SECRET: Your Discord application client secret
- EMAIL_SERVICE: Email service provider (e.g., 'gmail')
- EMAIL_USER: Email username for sending verification emails
- EMAIL_PASSWORD: Email password or app password

## Default Account Credentials

- Owner account: username: 'owner', password: 'botmaster2025'
- Admin account: username: 'admin', password: 'admin2025'

## Customization

You can customize the appearance by modifying theme.json and tailwind.config.ts

## Features

- 24/7 Discord bot hosting
- Real-time monitoring and metrics
- Bot management with start/stop/restart functionality
- Customizable notification themes and sounds
- User account system with role-based access control

For any issues or questions, refer to the documentation or contact support.
`;

// Add README file to the archive
archive.append(readmeContent, { name: 'README.md' });
console.log('Added README.md with deployment instructions');

// Add a deployment script
const deployScriptContent = `#!/bin/bash
# Simple deployment script for Discord Bot Manager

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Starting server..."
npm start
`;

// Add deployment script to the archive
archive.append(deployScriptContent, { name: 'deploy.sh' });
console.log('Added deploy.sh script');

// Create a .env.example file
const envExampleContent = `# Environment Variables
PORT=5000
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
`;

// Add .env.example file to the archive
archive.append(envExampleContent, { name: '.env.example' });
console.log('Added .env.example file');

// Finalize the archive
archive.finalize();