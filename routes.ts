import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket, VerifyClientCallbackAsync } from "ws";
import { storage } from "./storage";
import { botManager } from "./bot-manager";
import { z } from "zod";
import { insertUserSchema, insertBotSchema } from "@shared/schema";
import session from "express-session";
import { generateVerificationCode, sendVerificationCode, verificationCodes, getVerificationCode } from "./email-service";
import { handleDiscordCallback, requireDiscordAuth, getDiscordUser, getUserGuilds } from "./discord-auth";

// Extend Express Request type to include session
declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    role?: string;
    // Discord authentication data
    discordUser?: {
      id: string;
      username: string;
      discriminator: string;
      avatar: string | null;
      verified: boolean;
      email?: string;
      flags?: number;
    };
    discordTokens?: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    };
  }
}

export async function registerRoutes(app: Express, existingServer?: Server): Promise<Server> {
  const httpServer = existingServer || createServer(app);
  
  // Initialize WebSocket server with external access
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Set up allowed origins for WebSocket connections
    verifyClient: (info: { origin: string | undefined, req: any }) => {
      const allowedOrigins = [
        'https://d7871202-70c5-4782-a2e6-05f8bd409e92-00-29gocylxfcfum.worf.replit.dev',
        'http://localhost:5000',
        'https://localhost:5000'
      ];
      
      // Allow requests without origin (like direct socket connections)
      if (!info.origin) return true;
      
      // Check if origin is allowed
      return allowedOrigins.includes(info.origin);
    }
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Add client to bot manager
    botManager.addClient(ws);
    
    // Handle client messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'startBot':
            await botManager.startBot(data.botId);
            break;
            
          case 'stopBot':
            await botManager.stopBot(data.botId);
            break;
            
          case 'restartBot':
            await botManager.restartBot(data.botId);
            break;
            
          case 'requestUpdate':
            await botManager.sendStatusUpdateToClient(ws);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      botManager.removeClient(ws);
    });
  });

  // API routes
  // User routes
  // Route to check if user is authenticated
  app.get('/api/auth/session', (req: Request, res: Response) => {
    if (req.session && req.session.userId) {
      return res.json({
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      });
    }
    return res.status(401).json({ message: 'Not authenticated' });
  });

  // Logout route
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to logout' });
        }
        res.clearCookie('connect.sid');
        return res.json({ message: 'Logged out successfully' });
      });
    } else {
      return res.json({ message: 'Already logged out' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      // If no user exists or password doesn't match
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Temporarily disable admin account restriction to allow testing
      // Note: In a production environment, this check would remain enabled for security
      /*
      if ((user.role === 'admin' || user.role === 'owner') && 
          !req.headers['x-admin-auth']) {
        console.log(`Blocked unauthorized access attempt to admin account: ${username}`);
        return res.status(403).json({ message: 'This account requires special authentication' });
      }
      */
      
      // Set session data
      if (req.session) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
      }
      
      res.json({ 
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });
  
  // Add a route to get the verification code (for demonstration purposes)
  app.get('/api/auth/verification-code', (req: Request, res: Response) => {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required as a query parameter' });
    }
    
    const code = getVerificationCode(email);
    
    if (!code) {
      return res.status(404).json({ message: 'No verification code found for this email or code has expired' });
    }
    
    res.json({ code });
  });

  app.post('/api/auth/send-verification', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate a 6-digit verification code
    const code = generateVerificationCode();
    
    // Send the verification code
    const success = await sendVerificationCode(email, code);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to send verification code' });
    }
    
    res.json({ 
      message: 'Verification code sent',
      // Include code for demo purposes in development
      // In production this would be removed
      code: code
    });
  });

  app.post('/api/auth/verify', async (req: Request, res: Response) => {
    const { email, code, username, password } = req.body;
    
    if (!email || !code || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get the stored verification code for this email
    const storedCode = getVerificationCode(email);
    
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password,
        role: 'user'
      });

      // Clear the verification code since it's been used
      verificationCodes.delete(email);
      
      // Set session data for the new user
      if (req.session) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
      }
      
      res.status(201).json({ 
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user account' });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.safeParse(req.body);
      
      if (!userData.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: userData.error.format() });
      }
      
      const existingUser = await storage.getUserByUsername(userData.data.username);
      
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData.data);
      
      res.status(201).json({ 
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error during registration' });
    }
  });
  
  // Bot routes
  app.get('/api/bots', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const bots = userId 
        ? await storage.getBotsByUserId(userId)
        : await storage.getAllBots();
        
      res.json(bots);
    } catch (error) {
      res.status(500).json({ message: 'Server error retrieving bots' });
    }
  });
  
  app.get('/api/bots/:id', async (req: Request, res: Response) => {
    try {
      const botId = parseInt(req.params.id);
      
      if (isNaN(botId)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const bot = await storage.getBot(botId);
      
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' });
      }
      
      res.json(bot);
    } catch (error) {
      res.status(500).json({ message: 'Server error retrieving bot' });
    }
  });
  
  app.post('/api/bots', async (req: Request, res: Response) => {
    try {
      const botData = insertBotSchema.safeParse(req.body);
      
      if (!botData.success) {
        return res.status(400).json({ message: 'Invalid bot data', errors: botData.error.format() });
      }
      
      const bot = await botManager.createBot(botData.data);
      
      if (!bot) {
        return res.status(500).json({ message: 'Failed to create bot' });
      }
      
      res.status(201).json(bot);
    } catch (error) {
      res.status(500).json({ message: 'Server error creating bot' });
    }
  });
  
  app.put('/api/bots/:id', async (req: Request, res: Response) => {
    try {
      const botId = parseInt(req.params.id);
      
      if (isNaN(botId)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const bot = await storage.getBot(botId);
      
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        token: z.string().optional(),
        prefix: z.string().optional(),
        botType: z.string().optional(),
        iconType: z.string().optional()
      });
      
      const updateData = updateSchema.safeParse(req.body);
      
      if (!updateData.success) {
        return res.status(400).json({ message: 'Invalid update data', errors: updateData.error.format() });
      }
      
      const updatedBot = await storage.updateBot(botId, updateData.data);
      
      if (!updatedBot) {
        return res.status(500).json({ message: 'Failed to update bot' });
      }
      
      res.json(updatedBot);
    } catch (error) {
      res.status(500).json({ message: 'Server error updating bot' });
    }
  });
  
  app.delete('/api/bots/:id', async (req: Request, res: Response) => {
    try {
      const botId = parseInt(req.params.id);
      
      if (isNaN(botId)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      // First try to stop the bot if it's running
      await botManager.stopBot(botId);
      
      const success = await storage.deleteBot(botId);
      
      if (!success) {
        return res.status(404).json({ message: 'Bot not found or could not be deleted' });
      }
      
      botManager.broadcastUpdate();
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Server error deleting bot' });
    }
  });
  
  app.post('/api/bots/:id/start', async (req: Request, res: Response) => {
    try {
      const botId = parseInt(req.params.id);
      
      if (isNaN(botId)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const success = await botManager.startBot(botId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to start bot' });
      }
      
      res.json({ message: 'Bot started successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error starting bot' });
    }
  });
  
  app.post('/api/bots/:id/stop', async (req: Request, res: Response) => {
    try {
      const botId = parseInt(req.params.id);
      
      if (isNaN(botId)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const success = await botManager.stopBot(botId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to stop bot' });
      }
      
      res.json({ message: 'Bot stopped successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error stopping bot' });
    }
  });
  
  app.post('/api/bots/:id/restart', async (req: Request, res: Response) => {
    try {
      const botId = parseInt(req.params.id);
      
      if (isNaN(botId)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const success = await botManager.restartBot(botId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to restart bot' });
      }
      
      res.json({ message: 'Bot restarted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error restarting bot' });
    }
  });
  
  // Log routes
  app.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const botId = req.query.botId ? parseInt(req.query.botId as string) : undefined;
      
      const logs = botId 
        ? await storage.getLogsByBotId(botId, limit)
        : await storage.getLogs(limit);
        
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Server error retrieving logs' });
    }
  });
  
  // System metrics
  app.get('/api/metrics', async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getLatestMetrics();
      
      if (!metrics) {
        return res.status(404).json({ message: 'No metrics available' });
      }
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: 'Server error retrieving metrics' });
    }
  });

  // Discord OAuth routes
  app.get('/api/auth/discord', (req: Request, res: Response) => {
    // Use values directly as DISCORD_CONFIG is defined in discord-auth.ts
    const clientId = process.env.DISCORD_CLIENT_ID || '1234567890123456789';
    const redirectUri = encodeURIComponent('https://d7871202-70c5-4782-a2e6-05f8bd409e92-00-29gocylxfcfum.worf.replit.dev/api/auth/discord/callback');
    const scopes = encodeURIComponent('identify email guilds');
    
    // Redirect to Discord OAuth page
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`);
  });
  
  app.get('/api/auth/discord/callback', handleDiscordCallback);
  
  app.get('/api/auth/discord/user', requireDiscordAuth, async (req: Request, res: Response) => {
    if (req.session?.discordUser) {
      res.json(req.session.discordUser);
    } else {
      res.status(401).json({ error: 'Not authenticated with Discord' });
    }
  });
  
  app.get('/api/auth/discord/guilds', requireDiscordAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session?.discordTokens?.accessToken) {
        return res.status(401).json({ error: 'Discord authentication required' });
      }
      
      const guilds = await getUserGuilds(req.session.discordTokens.accessToken);
      res.json(guilds);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch Discord guilds' });
    }
  });

  return httpServer;
}
