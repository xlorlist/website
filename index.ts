import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import MemoryStore from "memorystore";
import cors from "cors";

// Create a memory store for sessions
const MemorySessionStore = MemoryStore(session);

const app = express();

// Configure CORS to allow access from any origin
const corsOptions = {
  origin: ['https://d7871202-70c5-4782-a2e6-05f8bd409e92-00-29gocylxfcfum.worf.replit.dev', 'http://localhost:5000'],
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add additional headers for cross-origin access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://d7871202-70c5-4782-a2e6-05f8bd409e92-00-29gocylxfcfum.worf.replit.dev');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure session middleware with cross-domain access support
app.use(
  session({
    cookie: { 
      maxAge: 86400000, // 24 hours
      httpOnly: true,
      sameSite: 'none', // Allow cross-domain cookies
      secure: true, // Required for sameSite: 'none'
      domain: process.env.COOKIE_DOMAIN || undefined // Will be set based on request
    },
    store: new MemorySessionStore({
      checkPeriod: 86400000 // Clear expired sessions every 24 hours
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "discord-bot-manager-secret",
    proxy: true // Trust the reverse proxy when setting secure cookies
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Create the HTTP server first and start listening immediately
  const server = app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
  
  // Then register routes with the existing server
  // This ensures the port is open and responding before all routes are set up
  registerRoutes(app, server).catch(err => {
    console.error("Failed to register routes:", err);
  });

  // Add error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("API Error:", err);
  });

  // Immediate initialization of Vite
  (async () => {
    try {
      // Important: Set up Vite before registering API routes to avoid
      // the Vite middleware catching API requests
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }
      console.log("Vite frontend server initialized successfully");
    } catch (error) {
      console.error("Error initializing Vite frontend:", error);
    }
  })();
})();
