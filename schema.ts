import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Bot schema
export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  token: text("token").notNull(),
  prefix: text("prefix").default("!").notNull(),
  userId: integer("user_id").notNull(),
  isRunning: boolean("is_running").default(false).notNull(),
  memory: integer("memory").default(0),
  uptime: integer("uptime").default(0),
  serverCount: integer("server_count").default(0),
  commandCount: integer("command_count").default(0),
  lastStarted: timestamp("last_started"),
  botType: text("bot_type").default("custom"),
  iconType: text("icon_type").default("robot"),
  status: text("status").default("OFFLINE"),
  permissions: text("permissions").default("268435456"), // Default basic permission
  inviteConfig: text("invite_config").default("{}"), // JSON string for invite configuration
});

export const insertBotSchema = createInsertSchema(bots).pick({
  name: true,
  token: true,
  prefix: true,
  userId: true,
  botType: true,
  iconType: true,
}).extend({
  scriptContent: z.string().optional(),
  scriptFileName: z.string().optional(),
  description: z.string().optional(),
  permissions: z.string().optional(),
  inviteConfig: z.string().optional(),
  additionalFiles: z.array(z.object({
    name: z.string(),
    content: z.string()
  })).optional(),
});

// Log schema
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: text("level").default("info").notNull(),
  message: text("message").notNull(),
});

export const insertLogSchema = createInsertSchema(logs).pick({
  botId: true,
  level: true,
  message: true,
});

// System metrics schema
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  cpuUsage: integer("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0),
  memoryTotal: integer("memory_total").default(0),
  diskUsage: integer("disk_usage").default(0),
  diskTotal: integer("disk_total").default(0),
  networkUsage: integer("network_usage").default(0),
});

export const insertMetricsSchema = createInsertSchema(metrics).omit({
  id: true,
  timestamp: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Bot = typeof bots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricsSchema>;

// Status enum
export enum BotStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  WARNING = "WARNING",
}

// Bot type enum
export enum BotType {
  MUSIC = "MUSIC",
  MODERATION = "MODERATION",
  GAMING = "GAMING",
  CUSTOM = "CUSTOM",
}

// Icon type enum
export enum IconType {
  ROBOT = "robot",
  SHIELD = "shield-alt",
  GAMEPAD = "gamepad",
  MUSIC = "music",
  COG = "cog",
}

// Discord Bot Permission Flags
// These are the permission flags used by Discord API
// Values taken from Discord API docs
export enum DiscordPermissionFlags {
  // General Permissions
  ADMINISTRATOR = "8",
  VIEW_AUDIT_LOG = "128",
  VIEW_GUILD_INSIGHTS = "524288",
  MANAGE_GUILD = "32",
  MANAGE_ROLES = "268435456",
  MANAGE_CHANNELS = "16",
  KICK_MEMBERS = "2",
  BAN_MEMBERS = "4",
  CREATE_INSTANT_INVITE = "1",
  CHANGE_NICKNAME = "67108864",
  MANAGE_NICKNAMES = "134217728",
  MANAGE_EMOJIS = "1073741824",
  MANAGE_WEBHOOKS = "536870912",
  MANAGE_EVENTS = "8589934592",
  
  // Text Channel Permissions
  VIEW_CHANNEL = "1024",
  SEND_MESSAGES = "2048",
  SEND_TTS_MESSAGES = "4096",
  MANAGE_MESSAGES = "8192",
  EMBED_LINKS = "16384",
  ATTACH_FILES = "32768",
  READ_MESSAGE_HISTORY = "65536",
  MENTION_EVERYONE = "131072",
  USE_EXTERNAL_EMOJIS = "262144",
  ADD_REACTIONS = "64",
  USE_SLASH_COMMANDS = "2147483648",
  
  // Voice Channel Permissions
  CONNECT = "1048576",
  SPEAK = "2097152",
  STREAM = "512",
  MUTE_MEMBERS = "4194304",
  DEAFEN_MEMBERS = "8388608",
  MOVE_MEMBERS = "16777216",
  USE_VAD = "33554432",
  PRIORITY_SPEAKER = "256",
  
  // Permission Presets
  BASIC_BOT = "2147483648", // Use slash commands
  MUSIC_BOT = "36700160", // Connect, Speak, Send Messages, etc
  MODERATION_BOT = "1099511627775", // All permissions
  GAMING_BOT = "297273408", // Basic messaging and some extras
}

// Invite Config type
export interface InviteConfig {
  scopes: string[];
  permissions: string[];
  redirectUri?: string;
  description?: string;
}
