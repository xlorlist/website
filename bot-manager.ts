import { storage } from "./storage";
import { BotStatus, type Bot, type InsertLog, type InsertBot } from "@shared/schema";
import { WebSocket } from "ws";
import { Client, GatewayIntentBits } from "discord.js";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface BotProcess {
  botId: number;
  discordClient?: Client;
  status: BotStatus;
  startTime?: Date;
  pid?: number;
  memory?: number;
}

class BotManager {
  private botProcesses: Map<number, BotProcess> = new Map();
  private clients: Set<WebSocket> = new Set();
  private botTemplates: Map<string, any> = new Map();

  constructor() {
    // Initialize error handling first
    this.initializeErrorHandling();
    
    // Load bot templates immediately but keep it lightweight
    this.loadBotTemplates();
    
    // Delay initialization of these components to improve startup time
    // This ensures that the server port is opened faster
    setTimeout(async () => {
      // Start metrics collection
      this.initializeMetricsCollection();
      
      // Start auto-recovery system
      this.initializePingMechanism();
      
      // Restore previously running bots at startup
      await this.recoverRunningBots();
      
      console.log('Bot manager fully initialized with metrics and ping mechanism');
    }, 2000);
  }
  
  private initializePingMechanism(): void {
    // Check for disconnected bots every 60 seconds and attempt to reconnect them
    // More frequent checks for better 24/7 uptime, ensuring bots stay online
    // even when users log out of their accounts
    
    console.log("Initializing 24/7 bot uptime monitoring system...");
    
    setInterval(async () => {
      try {
        console.log("Running bot ping mechanism to ensure 24/7 uptime...");
        
        // Get all bots regardless of user sessions
        const bots = await storage.getAllBots();
        
        for (const bot of bots) {
          const botProcess = this.botProcesses.get(bot.id);
          
          // Check if bot should be running but isn't or is in warning state
          if (bot.isRunning && (!botProcess || botProcess.status === BotStatus.WARNING || botProcess.status === BotStatus.OFFLINE)) {
            console.log(`Bot ${bot.name} (ID: ${bot.id}) detected as disconnected. Attempting to reconnect...`);
            
            await this.createLog({
              botId: bot.id,
              level: "warning",
              message: `Ping mechanism detected bot offline. Attempting automatic reconnection.`
            });
            
            // Try to restart the bot
            try {
              await this.restartBot(bot.id);
              
              // Log successful reconnection
              await this.createLog({
                botId: bot.id,
                level: "success",
                message: `Bot successfully reconnected by auto-recovery system.`
              });
            } catch (restartError) {
              console.error(`Error during automatic restart of bot ${bot.id}:`, restartError);
              
              // If restart fails, try stopping and then starting the bot (more thorough recovery)
              try {
                await this.stopBot(bot.id);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                await this.startBot(bot.id);
                
                await this.createLog({
                  botId: bot.id,
                  level: "success",
                  message: `Bot recovered after full stop/start cycle.`
                });
              } catch (recoveryError) {
                await this.createLog({
                  botId: bot.id,
                  level: "error",
                  message: `Failed to recover bot after multiple attempts. Manual intervention may be required.`
                });
              }
            }
          }
          
          // If the bot is marked as running in the process map but shows as offline in storage
          if (botProcess && botProcess.status === BotStatus.ONLINE && !bot.isRunning) {
            await this.updateBotStatus(bot.id, BotStatus.ONLINE);
            await this.updateBotMetrics(bot.id, { isRunning: true });
            
            await this.createLog({
              botId: bot.id,
              level: "info",
              message: `Ping mechanism corrected bot status to online.`
            });
          }
          
          // Check the process health for running bots
          if (botProcess && botProcess.discordClient && botProcess.status === BotStatus.ONLINE) {
            // Check if the Discord client is still responsive
            const isHealthy = botProcess.discordClient.ws.ping !== -1;
            
            if (!isHealthy) {
              console.log(`Bot ${bot.name} (ID: ${bot.id}) has an unresponsive WebSocket. Initiating recovery...`);
              await this.restartBot(bot.id);
            }
          }
        }
        
        // Send status updates to all clients after health check
        this.broadcastUpdate();
      } catch (error) {
        console.error("Error in bot ping mechanism:", error);
      }
    }, 60 * 1000); // Every 1 minute for 24/7 uptime as requested by user
  }

  private loadBotTemplates() {
    try {
      console.log('Loading bot templates...');
      
      // Use default configurations for bot templates with minimal intents to avoid verification issues
      // These intents don't require special verification from Discord
      const publicIntents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ];
      
      // Basic template with minimal public intents
      this.botTemplates.set('simple', {
        createClient: () => new Client({
          intents: publicIntents
        })
      });
      
      // Add CUSTOM bot template (same as simple)
      this.botTemplates.set('CUSTOM', {
        createClient: () => new Client({
          intents: publicIntents
        })
      });
      
      // Add GAMING bot template
      this.botTemplates.set('GAMING', {
        createClient: () => new Client({
          intents: publicIntents
        })
      });
      
      // Add MUSIC bot template with voice state intent
      this.botTemplates.set('MUSIC', {
        createClient: () => new Client({
          intents: [
            ...publicIntents,
            GatewayIntentBits.GuildVoiceStates
          ]
        })
      });
      
      // Add MODERATION bot template with additional intents
      this.botTemplates.set('MODERATION', {
        createClient: () => new Client({
          intents: [
            ...publicIntents,
            // These may require verification in a real production app
            // We're using them for simulation only
            GatewayIntentBits.GuildBans
          ]
        })
      });
      
      // Add advanced template for special use cases
      this.botTemplates.set('advanced', {
        createClient: () => new Client({
          intents: [
            ...publicIntents,
            GatewayIntentBits.GuildVoiceStates
          ]
        })
      });
      
      console.log('Bot templates loaded successfully');
      
    } catch (error) {
      console.error('Failed to load bot templates:', error);
    }
  }

  private initializeErrorHandling() {
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught Exception:', error);
      await this.broadcastError('System error occurred');
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('Unhandled Rejection:', reason);
      await this.broadcastError('Async error occurred');
    });
  }

  async createBot(data: InsertBot): Promise<Bot | null> {
    try {
      // Use a default template type if none is provided
      const templateType = (data.botType as string) || 'simple';
      const template = this.botTemplates.get(templateType);
      if (!template) {
        console.warn(`Template ${templateType} not found, using default configuration`);
      }
      
      // Handle additional files if provided
      if (data.additionalFiles && data.additionalFiles.length > 0) {
        // Log information about additional files
        console.log(`Processing bot with ${data.additionalFiles.length} additional files`);
        
        // In a production environment, these files would be saved to disk
        // For this implementation, we'll just log that they're received
        const fileNames = data.additionalFiles.map(file => file.name).join(', ');
        await this.createLog({
          botId: -1, // Temporary ID until the bot is created
          level: "info",
          message: `Received additional files: ${fileNames}`
        });
      }

      // Create the bot record with proper typing
      const bot = await storage.createBot({
        ...data,
        // These properties will be added by the storage layer
        // as they're not part of the InsertBot schema
        // The as any cast is used to avoid TypeScript errors
        ...(({
          isRunning: false,
          serverCount: 0,
          commandCount: 0,
          memory: 0,
          uptime: 0
        } as any))
      });
      
      // If there were additional files, update the log with the correct bot ID
      if (data.additionalFiles && data.additionalFiles.length > 0 && bot) {
        await this.createLog({
          botId: bot.id,
          level: "info",
          message: `Bot created with ${data.additionalFiles.length} additional files`
        });
      }

      // Automatically start the bot if token is provided
      if (bot && data.token) {
        await this.startBot(bot.id);
      }

      return bot;
    } catch (error) {
      console.error('Failed to create bot:', error);
      return null;
    }
  }

  async startBot(botId: number): Promise<boolean> {
    try {
      const botData = await storage.getBot(botId);
      if (!botData?.token) {
        await this.createLog({
          botId,
          level: "error",
          message: "Bot token not found"
        });
        return false;
      }

      if (this.botProcesses.has(botId)) {
        await this.createLog({
          botId,
          level: "warning",
          message: "Bot is already running"
        });
        return true;
      }

      // Get the template or use the simple one as default
      const templateType = (botData.botType as string) || 'simple';
      const template = this.botTemplates.get(templateType);
      
      // Create a new client using the template's createClient function
      // If no template is found, use minimal intents to ensure it works without verification
      const client = template ? 
        template.createClient() : 
        new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages
          ]
        });

      client.once('ready', async () => {
        console.log(`Bot ${botData.name} is ready!`);
        await this.updateBotStatus(botId, BotStatus.ONLINE);
        await this.createLog({
          botId,
          level: "info",
          message: `Bot ${botData.name} is now online`
        });
        this.setupBotMetricsCollection(botId, client);
      });

      client.on('error', async (error: Error) => {
        console.error(`Bot ${botData.name} error:`, error);
        await this.createLog({
          botId,
          level: "error",
          message: `Discord error: ${error.message}`
        });
        await this.updateBotStatus(botId, BotStatus.WARNING);
      });

      client.on('disconnect', async () => {
        await this.createLog({
          botId,
          level: "warning",
          message: `Bot ${botData.name} disconnected`
        });
        await this.updateBotStatus(botId, BotStatus.WARNING);
      });

      client.on('reconnecting', async () => {
        await this.createLog({
          botId,
          level: "info",
          message: `Bot ${botData.name} is reconnecting`
        });
      });

      await client.login(botData.token);
      this.botProcesses.set(botId, {
        botId,
        discordClient: client,
        status: BotStatus.ONLINE,
        startTime: new Date(),
        pid: process.pid,
        memory: 100
      });

      return true;
    } catch (error: any) {
      console.error(`Failed to start bot ${botId}:`, error);
      await this.createLog({
        botId,
        level: "error",
        message: `Failed to start: ${error?.message || 'Unknown error'}`
      });
      return false;
    }
  }

  async stopBot(botId: number): Promise<boolean> {
    const botProcess = this.botProcesses.get(botId);
    if (!botProcess) return false;

    try {
      if (botProcess.discordClient) {
        await botProcess.discordClient.destroy();
      }
      this.botProcesses.delete(botId);
      await this.updateBotStatus(botId, BotStatus.OFFLINE);
      return true;
    } catch (error: any) {
      console.error(`Failed to stop bot ${botId}:`, error);
      await this.createLog({
        botId,
        level: "error",
        message: `Failed to stop: ${error?.message || 'Unknown error'}`
      });
      return false;
    }
  }

  async restartBot(botId: number): Promise<boolean> {
    await this.stopBot(botId);
    return this.startBot(botId);
  }

  private async updateBotStatus(botId: number, status: BotStatus) {
    await storage.updateBot(botId, { status });
    this.broadcastUpdate();
  }

  async broadcastError(message: string) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'error', message }));
      }
    });
  }

  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    this.sendStatusUpdateToClient(ws);
  }

  removeClient(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  async sendStatusUpdateToClient(ws: WebSocket) {
    try {
      const bots = await storage.getAllBots();
      const metrics = await storage.getLatestMetrics();
      ws.send(JSON.stringify({ type: 'statusUpdate', bots, metrics }));
    } catch (error) {
      console.error('Failed to send status update:', error);
    }
  }

  broadcastUpdate() {
    this.clients.forEach(client => this.sendStatusUpdateToClient(client));
  }

  async createLog(logData: InsertLog): Promise<void> {
    await storage.createLog(logData);
  }
  
  /**
   * Recovers all bots that were previously running
   * This ensures 24/7 operation even after server restarts
   */
  private async recoverRunningBots(): Promise<void> {
    try {
      console.log("Starting recovery of previously running bots...");
      
      // Get all bots from storage
      const bots = await storage.getAllBots();
      
      // Filter for bots that should be running
      const runningBots = bots.filter(bot => bot.isRunning || bot.status === BotStatus.ONLINE);
      
      if (runningBots.length === 0) {
        console.log("No previously running bots to recover.");
        return;
      }
      
      console.log(`Found ${runningBots.length} bots to recover...`);
      
      // Start each bot that was previously running
      for (const bot of runningBots) {
        console.log(`Recovering bot: ${bot.name} (ID: ${bot.id})`);
        
        try {
          await this.startBot(bot.id);
          await this.createLog({
            botId: bot.id,
            level: "info",
            message: "Bot automatically recovered after system restart."
          });
        } catch (error) {
          console.error(`Failed to recover bot ${bot.id}:`, error);
          await this.createLog({
            botId: bot.id,
            level: "error",
            message: "Failed to automatically recover bot after restart."
          });
        }
      }
      
      console.log("Bot recovery process completed.");
      
    } catch (error) {
      console.error("Error recovering running bots:", error);
    }
  }

  private setupBotMetricsCollection(botId: number, client: Client): void {
    const interval = setInterval(async () => {
      try {
        const process = this.botProcesses.get(botId);
        if (!process || process.status !== BotStatus.ONLINE) {
          clearInterval(interval);
          return;
        }

        const serverCount = client.guilds.cache.size;
        const commandCount = client.application?.commands.cache.size || 0;
        
        // Since we can't reliably get memory usage from Discord user ID,
        // we'll use the current process memory usage as an approximation
        const memoryUsage = process.pid ? 
          await this.getProcessMemoryUsage(process.pid) : 
          Math.round(process.memory || 100);
        const uptime = process.startTime ? Math.floor((Date.now() - process.startTime.getTime()) / 1000) : 0;
        
        // Check Discord API connection health
        const pingStatus = client.ws.ping;
        const isConnectionHealthy = pingStatus !== -1;
        
        // If connection isn't healthy, log it but don't change status yet
        // The ping mechanism will handle recovery if needed
        if (!isConnectionHealthy) {
          console.log(`Bot ${botId} connection appears unhealthy with ping status: ${pingStatus}`);
        }

        await this.updateBotMetrics(botId, {
          serverCount,
          commandCount,
          memory: memoryUsage,
          isRunning: true,
          uptime
        });

        this.broadcastUpdate();
      } catch (error) {
        console.error(`Error collecting metrics for bot ${botId}:`, error);
      }
    }, 60000);
  }

  private async getProcessMemoryUsage(pid: number): Promise<number> {
    try {
      const { stdout } = await execAsync(`ps -p ${pid} -o rss=`);
      return Math.round(parseInt(stdout.trim()) / 1024);
    } catch (error) {
      console.error(`Error getting memory usage for process ${pid}:`, error);
      return 100;
    }
  }

  private async updateBotMetrics(botId: number, metrics: Partial<Bot>): Promise<void> {
    try {
      await storage.updateBot(botId, metrics);
    } catch (error) {
      console.error(`Error updating bot metrics for ${botId}:`, error);
    }
  }

  private async getDiskUsage(): Promise<{ used: number; total: number }> {
    try {
      const { stdout } = await execAsync('df -k / | tail -1');
      const [, total, used] = stdout.split(/\s+/);
      return {
        used: Math.round(parseInt(used) / 1024), // Convert to MB
        total: Math.round(parseInt(total) / 1024) // Convert to MB
      };
    } catch (error) {
      console.error('Error getting disk usage:', error);
      return { used: 0, total: 0 };
    }
  }

  private async getNetworkUsage(): Promise<number> {
    try {
      const { stdout } = await execAsync('cat /proc/net/dev | grep eth0');
      const [, stats] = stdout.split(':');
      const [bytesReceived] = stats.trim().split(/\s+/);
      return Math.round(parseInt(bytesReceived) / (1024 * 1024)); // Convert to MB
    } catch (error) {
      console.error('Error getting network usage:', error);
      return 0;
    }
  }

  private initializeMetricsCollection(): void {
    setInterval(async () => {
      try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryTotal = Math.round(totalMem / (1024 * 1024));
        const memoryUsage = Math.round((totalMem - freeMem) / (1024 * 1024));
        const cpuUsage = Math.round(os.loadavg()[0] * 100);
        const { used: diskUsage, total: diskTotal } = await this.getDiskUsage();
        const networkUsage = await this.getNetworkUsage();

        await storage.createMetrics({
          cpuUsage,
          memoryUsage,
          memoryTotal,
          diskUsage,
          diskTotal,
          networkUsage
        });

        this.broadcastUpdate();
      } catch (error) {
        console.error("Error collecting system metrics:", error);
      }
    }, 30000);
  }
}

export const botManager = new BotManager();