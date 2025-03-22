// Simple express server to start immediately
import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const app = express();
const port = 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple route that responds immediately
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Discord Bot Manager</title>
      <meta http-equiv="refresh" content="3;url=/" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background: #0f0f1a;
          color: #c0c0fa;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
          overflow: hidden;
        }
        .container {
          padding: 2rem;
          border-radius: 8px;
          background: rgba(20, 20, 40, 0.8);
          box-shadow: 0 0 20px 5px rgba(100, 100, 255, 0.2);
          max-width: 80%;
          z-index: 10;
        }
        h1 {
          color: #8080ff;
          font-size: 2.5rem;
          margin-bottom: 1rem;
          text-shadow: 0 0 10px rgba(128, 128, 255, 0.5);
        }
        p {
          font-size: 1.2rem;
          line-height: 1.5;
          max-width: 600px;
        }
        .loader {
          display: inline-block;
          width: 80px;
          height: 80px;
          margin-top: 2rem;
        }
        .loader:after {
          content: " ";
          display: block;
          width: 64px;
          height: 64px;
          margin: 8px;
          border-radius: 50%;
          border: 6px solid #8080ff;
          border-color: #8080ff transparent #8080ff transparent;
          animation: loader 1.2s linear infinite;
        }
        @keyframes loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(30, 30, 50, 0.2) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(30, 30, 50, 0.2) 1px, transparent 1px);
          background-size: 30px 30px;
          z-index: 1;
        }
        .glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(rgba(100, 100, 255, 0.2), transparent 70%);
          border-radius: 50%;
          animation: pulse 3s infinite;
          z-index: 2;
        }
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
        }
      </style>
    </head>
    <body>
      <div class="grid"></div>
      <div class="glow"></div>
      <div class="container">
        <h1>Discord Bot Manager</h1>
        <p>Starting your Discord bot hosting dashboard...</p>
        <p>The application is loading, please wait a moment.</p>
        <div class="loader"></div>
      </div>
    </body>
    </html>
  `);
});

// Create a route to serve the actual application
app.get('/_internal_redirect', (req, res) => {
  res.redirect('/');
});

// Start the server immediately
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Quick start server listening at http://0.0.0.0:${port}`);
  
  // Start the main application in the background
  setTimeout(() => {
    const child = spawn('tsx', [resolve(__dirname, 'index.ts')], {
      stdio: 'inherit'
    });
    
    child.on('error', (err) => {
      console.error('Failed to start application:', err);
    });
  }, 2000);
});