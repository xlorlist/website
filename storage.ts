import { 
  users, bots, logs, metrics,
  type User, type InsertUser,
  type Bot, type InsertBot,
  type Log, type InsertLog,
  type Metric, type InsertMetric
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bot operations
  getAllBots(): Promise<Bot[]>;
  getBotsByUserId(userId: number): Promise<Bot[]>;
  getBot(id: number): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, data: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: number): Promise<boolean>;
  
  // Log operations
  getLogs(limit: number): Promise<Log[]>;
  getLogsByBotId(botId: number, limit: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Metrics operations
  getLatestMetrics(): Promise<Metric | undefined>;
  createMetrics(metrics: InsertMetric): Promise<Metric>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bots: Map<number, Bot>;
  private logs: Log[];
  private metricsHistory: Metric[];
  
  private userCurrentId: number;
  private botCurrentId: number;
  private logCurrentId: number;
  private metricsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.bots = new Map();
    this.logs = [];
    this.metricsHistory = [];
    
    this.userCurrentId = 1;
    this.botCurrentId = 1;
    this.logCurrentId = 1;
    this.metricsCurrentId = 1;
    
    // Initialize with some default data
    this.initializeDefaultData();
  }

  // Initialize with some default data
  private initializeDefaultData() {
    // Create owner account (highest privilege level)
    const ownerUser: User = {
      id: this.userCurrentId++,
      username: "owner",
      password: "botmaster2025", // In production would be hashed
      role: "owner"
    };
    this.users.set(ownerUser.id, ownerUser);
    
    // Create admin user
    const adminUser: User = {
      id: this.userCurrentId++,
      username: "admin",
      password: "admin2025", // In production would be hashed
      role: "admin"
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create some sample bots for demo purposes
    const moderationBot: Bot = {
      id: this.botCurrentId++,
      name: "Moderation Bot",
      token: "placeholder-token", // This would be a real Discord bot token in production
      prefix: "!",
      userId: adminUser.id,
      isRunning: false,
      memory: 78,
      uptime: 0,
      serverCount: 12,
      commandCount: 24,
      lastStarted: null,
      botType: "MODERATION",
      iconType: "shield",
      status: "OFFLINE",
      permissions: "1099511627775", // Admin permissions
      inviteConfig: JSON.stringify({
        scopes: ["bot", "applications.commands"],
        permissions: ["ADMINISTRATOR", "MANAGE_GUILD", "KICK_MEMBERS", "BAN_MEMBERS"],
        description: "A powerful moderation bot"
      })
    };
    this.bots.set(moderationBot.id, moderationBot);
    
    const musicBot: Bot = {
      id: this.botCurrentId++,
      name: "DJ Bot",
      token: "placeholder-token", // This would be a real Discord bot token in production
      prefix: "!",
      userId: adminUser.id,
      isRunning: false,
      memory: 94,
      uptime: 0,
      serverCount: 18,
      commandCount: 15,
      lastStarted: null,
      botType: "MUSIC",
      iconType: "music",
      status: "OFFLINE",
      permissions: "36700160", // Music bot permissions
      inviteConfig: JSON.stringify({
        scopes: ["bot", "applications.commands"],
        permissions: ["CONNECT", "SPEAK", "SEND_MESSAGES", "EMBED_LINKS"],
        description: "A music bot for your Discord server"
      })
    };
    this.bots.set(musicBot.id, musicBot);
    
    // Create some sample logs
    this.createLog({
      botId: moderationBot.id,
      level: "info",
      message: "Moderation Bot registered successfully"
    });
    
    this.createLog({
      botId: musicBot.id,
      level: "info",
      message: "DJ Bot registered successfully"
    });
    
    // Create initial metrics
    const initialMetrics: Metric = {
      id: this.metricsCurrentId++,
      timestamp: new Date(),
      cpuUsage: 42,
      memoryUsage: 1200,
      memoryTotal: 2000,
      diskUsage: 18000,
      diskTotal: 50000,
      networkUsage: 2700
    };
    this.metricsHistory.push(initialMetrics);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    // Ensure role is not undefined
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user" // Default to "user" if role is not provided
    };
    this.users.set(id, user);
    return user;
  }

  // Bot operations
  async getAllBots(): Promise<Bot[]> {
    return Array.from(this.bots.values());
  }
  
  async getBotsByUserId(userId: number): Promise<Bot[]> {
    return Array.from(this.bots.values()).filter(
      (bot) => bot.userId === userId
    );
  }
  
  async getBot(id: number): Promise<Bot | undefined> {
    return this.bots.get(id);
  }
  
  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = this.botCurrentId++;
    
    // Create default invite config based on bot type
    let defaultPermissions = "268435456"; // Basic permissions by default
    let defaultInviteConfig = {
      scopes: ["bot", "applications.commands"],
      permissions: ["SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
      description: "A Discord bot"
    };
    
    // Set appropriate permissions based on bot type
    if (insertBot.botType === 'MUSIC') {
      defaultPermissions = "36700160"; // Music bot permissions
      defaultInviteConfig = {
        scopes: ["bot", "applications.commands"],
        permissions: ["CONNECT", "SPEAK", "SEND_MESSAGES", "EMBED_LINKS"],
        description: "A music bot for your Discord server"
      };
    } else if (insertBot.botType === 'MODERATION') {
      defaultPermissions = "1099511627775"; // Admin permissions
      defaultInviteConfig = {
        scopes: ["bot", "applications.commands"],
        permissions: ["ADMINISTRATOR", "MANAGE_GUILD", "KICK_MEMBERS", "BAN_MEMBERS"],
        description: "A powerful moderation bot"
      };
    } else if (insertBot.botType === 'GAMING') {
      defaultPermissions = "297273408"; // Gaming permissions
      defaultInviteConfig = {
        scopes: ["bot", "applications.commands"],
        permissions: ["SEND_MESSAGES", "READ_MESSAGE_HISTORY", "ADD_REACTIONS", "EMBED_LINKS"],
        description: "A gaming bot for your Discord server"
      };
    }
    
    const bot: Bot = { 
      ...insertBot, 
      id,
      isRunning: false,
      memory: 0,
      uptime: 0,
      serverCount: 0,
      commandCount: 0,
      lastStarted: null, // Use null instead of undefined
      prefix: insertBot.prefix || "!", // Ensure prefix is not undefined
      botType: insertBot.botType || null, // Ensure botType is not undefined
      iconType: insertBot.iconType || null, // Ensure iconType is not undefined
      status: "OFFLINE", // Default status is OFFLINE
      permissions: insertBot.permissions || defaultPermissions, 
      inviteConfig: insertBot.inviteConfig || JSON.stringify(defaultInviteConfig)
    };
    this.bots.set(id, bot);
    return bot;
  }
  
  async updateBot(id: number, data: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...data };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }
  
  async deleteBot(id: number): Promise<boolean> {
    return this.bots.delete(id);
  }
  
  // Log operations
  async getLogs(limit: number): Promise<Log[]> {
    return this.logs.slice(-limit).reverse();
  }
  
  async getLogsByBotId(botId: number, limit: number): Promise<Log[]> {
    return this.logs
      .filter(log => log.botId === botId)
      .slice(-limit)
      .reverse();
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logCurrentId++;
    const log: Log = {
      ...insertLog,
      id,
      timestamp: new Date(),
      botId: insertLog.botId || null, // Ensure botId is not undefined
      level: insertLog.level || "info" // Ensure level is not undefined, default to "info"
    };
    this.logs.push(log);
    
    // Trim logs if they get too large
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    return log;
  }
  
  // Metrics operations
  async getLatestMetrics(): Promise<Metric | undefined> {
    if (this.metricsHistory.length === 0) return undefined;
    return this.metricsHistory[this.metricsHistory.length - 1];
  }
  
  async createMetrics(insertMetrics: InsertMetric): Promise<Metric> {
    const id = this.metricsCurrentId++;
    const metric: Metric = {
      ...insertMetrics,
      id,
      timestamp: new Date(),
      // Ensure all fields are not undefined
      cpuUsage: insertMetrics.cpuUsage || null,
      memoryUsage: insertMetrics.memoryUsage || null,
      memoryTotal: insertMetrics.memoryTotal || null,
      diskUsage: insertMetrics.diskUsage || null,
      diskTotal: insertMetrics.diskTotal || null,
      networkUsage: insertMetrics.networkUsage || null
    };
    this.metricsHistory.push(metric);
    
    // Trim metrics history if it gets too large
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }
    
    return metric;
  }
}

export const storage = new MemStorage();
