const { exec } = require('child_process');

exec('npx tsx server/index.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`stdout: ${stdout}`);
});