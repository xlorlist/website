import { Request, Response, NextFunction } from "express";
import { log } from "./vite";
import nodeFetch from "node-fetch";

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  verified: boolean;
  email?: string;
  flags?: number;
  banner?: string | null;
  accent_color?: number | null;
  premium_type?: number;
  public_flags?: number;
}

const DISCORD_API_URL = 'https://discord.com/api/v10';

// This would be loaded from environment variables in production
const DISCORD_CONFIG = {
  clientId: process.env.DISCORD_CLIENT_ID || '1234567890123456789',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || 'your_client_secret',
  redirectUri: 'https://d7871202-70c5-4782-a2e6-05f8bd409e92-00-29gocylxfcfum.worf.replit.dev/api/auth/discord/callback'
};

/**
 * Exchange authorization code for access token
 */
export async function exchangeCode(code: string): Promise<DiscordTokenResponse> {
  const params = new URLSearchParams({
    client_id: DISCORD_CONFIG.clientId,
    client_secret: DISCORD_CONFIG.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: DISCORD_CONFIG.redirectUri,
    scope: 'identify email guilds'
  });

  try {
    const response = await nodeFetch(`${DISCORD_API_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Discord token exchange error: ${response.status} ${errorText}`, 'discord-auth');
      throw new Error(`Discord token exchange failed: ${response.status}`);
    }

    return await response.json() as DiscordTokenResponse;
  } catch (error) {
    log(`Discord token exchange error: ${error instanceof Error ? error.message : String(error)}`, 'discord-auth');
    throw error;
  }
}

/**
 * Refresh an expired access token
 */
export async function refreshToken(refreshToken: string): Promise<DiscordTokenResponse> {
  const params = new URLSearchParams({
    client_id: DISCORD_CONFIG.clientId,
    client_secret: DISCORD_CONFIG.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  try {
    const response = await nodeFetch(`${DISCORD_API_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Discord token refresh error: ${response.status} ${errorText}`, 'discord-auth');
      throw new Error(`Discord token refresh failed: ${response.status}`);
    }

    return await response.json() as DiscordTokenResponse;
  } catch (error) {
    log(`Discord token refresh error: ${error instanceof Error ? error.message : String(error)}`, 'discord-auth');
    throw error;
  }
}

/**
 * Get Discord user profile
 */
export async function getDiscordUser(accessToken: string): Promise<DiscordUserResponse> {
  try {
    const response = await nodeFetch(`${DISCORD_API_URL}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Discord user fetch error: ${response.status} ${errorText}`, 'discord-auth');
      throw new Error(`Discord user fetch failed: ${response.status}`);
    }

    return await response.json() as DiscordUserResponse;
  } catch (error) {
    log(`Discord user fetch error: ${error instanceof Error ? error.message : String(error)}`, 'discord-auth');
    throw error;
  }
}

/**
 * Get Discord user's guilds/servers
 */
export async function getUserGuilds(accessToken: string): Promise<any[]> {
  try {
    const response = await nodeFetch(`${DISCORD_API_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Discord guilds fetch error: ${response.status} ${errorText}`, 'discord-auth');
      throw new Error(`Discord guilds fetch failed: ${response.status}`);
    }

    return await response.json() as any[];
  } catch (error) {
    log(`Discord guilds fetch error: ${error instanceof Error ? error.message : String(error)}`, 'discord-auth');
    throw error;
  }
}

/**
 * Discord authorization callback handler
 */
export async function handleDiscordCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;
  
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  try {
    // Exchange the code for tokens
    const tokenData = await exchangeCode(code);
    
    // Get the user's profile
    const userData = await getDiscordUser(tokenData.access_token);
    
    // Calculate expiration timestamp
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    
    // Store tokens in session
    if (req.session) {
      req.session.discordUser = userData;
      req.session.discordTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt
      };
    }
    
    // Redirect to dashboard or intended destination
    res.redirect('/dashboard');
  } catch (error) {
    log(`Discord callback error: ${error instanceof Error ? error.message : String(error)}`, 'discord-auth');
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Helper to handle Discord authentication middleware
 */
export function requireDiscordAuth(req: Request, res: Response, next: NextFunction): void {
  // Check if user is authenticated with Discord
  if (!req.session?.discordTokens?.accessToken) {
    res.status(401).json({ error: 'Discord authentication required' });
    return;
  }
  
  // Check if token is expired
  const tokenData = req.session.discordTokens;
  if (Date.now() >= tokenData.expiresAt) {
    // Token is expired, need to refresh
    refreshToken(tokenData.refreshToken)
      .then(newTokens => {
        // Update session with new tokens
        if (req.session) {
          req.session.discordTokens = {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            expiresAt: Date.now() + newTokens.expires_in * 1000
          };
        }
        next();
      })
      .catch(error => {
        log(`Discord auth middleware error: ${error instanceof Error ? error.message : String(error)}`, 'discord-auth');
        res.status(401).json({ error: 'Discord session expired, please log in again' });
      });
    return;
  }
  
  // Token is valid
  next();
}