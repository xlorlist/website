/**
 * Email service for sending verification codes
 * This implementation stores verification codes in memory for easy access in development
 */
import nodemailer from 'nodemailer';

// Global variable to store verification codes by email
// This allows us to retrieve and display them in the UI for demonstration
export const verificationCodes: Map<string, { code: string, timestamp: number }> = new Map();

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Send an email
 * In development mode, this just logs the email to the console
 * and stores the verification code in memory for frontend display
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log(`
=============== EMAIL SERVICE ===============
To: ${options.to}
Subject: ${options.subject}
${options.text ? `\nText: ${options.text}` : ''}
${options.html ? `\nHTML: ${options.html}` : ''}
==============================================
`);
    
    // Try to extract verification code from the message for demonstration purposes
    const codeMatch = options.text?.match(/verification code is: (\d+)/) || 
                      options.html?.match(/letter-spacing: 5px[^>]*>(\d+)<\/div>/);
    
    if (codeMatch && codeMatch[1]) {
      // Store the code with the email for frontend retrieval
      verificationCodes.set(options.to, {
        code: codeMatch[1],
        timestamp: Date.now()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send a verification code email
 * @param email - The email address to send the verification code to
 * @param code - The verification code
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const subject = 'Your Discord Bot Hosting Verification Code';
  const text = `Your verification code is: ${code}. This code will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #8A2BE2, #4169E1); padding: 20px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Discord Bot Hosting</h1>
      </div>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
        <p>Hello there,</p>
        <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
        <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border: 1px solid #ddd;">
          ${code}
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <p>Thanks,<br>Discord Bot Hosting Team</p>
      </div>
    </div>
  `;

  // Log the verification code to the console
  console.log(`Verification code for ${email}: ${code}`);
  
  // Store in our global map
  verificationCodes.set(email, {
    code: code,
    timestamp: Date.now()
  });
  
  // Try to send the email (in this case, just simulate it)
  return await sendEmail({ to: email, subject, text, html });
}

/**
 * Generate a random verification code
 * @param length - The length of the verification code
 */
export function generateVerificationCode(length: number = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

/**
 * Get the current verification code for an email
 * @param email - The email to get the verification code for
 */
export function getVerificationCode(email: string): string | null {
  const record = verificationCodes.get(email);
  
  if (!record) {
    return null;
  }
  
  // Check if the code has expired (10 minutes)
  const now = Date.now();
  const expiryTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  if (now - record.timestamp > expiryTime) {
    // Code has expired, remove it
    verificationCodes.delete(email);
    return null;
  }
  
  return record.code;
}