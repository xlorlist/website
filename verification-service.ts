/**
 * Verification service to handle email verification codes
 */
import { generateVerificationCode, sendVerificationCode } from './email-service';

interface VerificationRecord {
  code: string;
  email: string;
  expiresAt: Date;
  verified: boolean;
}

class VerificationService {
  private verificationRecords: Map<string, VerificationRecord> = new Map();
  
  /**
   * Create and send a verification code to an email
   * @param email - The email address to send the verification code to
   */
  async createVerification(email: string): Promise<boolean> {
    try {
      // Generate a verification code
      const code = generateVerificationCode();
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      // Store the verification record
      this.verificationRecords.set(email, {
        code,
        email,
        expiresAt,
        verified: false
      });
      
      // Send verification code via email
      const success = await sendVerificationCode(email, code);
      
      return success;
    } catch (error) {
      console.error('Error creating verification:', error);
      return false;
    }
  }
  
  /**
   * Verify a code against a stored verification record
   * @param email - The email associated with the verification code
   * @param code - The verification code to verify
   */
  verifyCode(email: string, code: string): boolean {
    const record = this.verificationRecords.get(email);
    
    if (!record) {
      return false; // No verification record found
    }
    
    if (record.verified) {
      return false; // Already verified
    }
    
    if (new Date() > record.expiresAt) {
      this.verificationRecords.delete(email); // Delete expired record
      return false; // Expired
    }
    
    if (record.code !== code) {
      return false; // Invalid code
    }
    
    // Mark as verified
    record.verified = true;
    this.verificationRecords.set(email, record);
    
    return true;
  }
  
  /**
   * Check if an email has been verified
   * @param email - The email to check
   */
  isVerified(email: string): boolean {
    const record = this.verificationRecords.get(email);
    return record ? record.verified : false;
  }
  
  /**
   * Clear verification record after successful registration
   * @param email - The email to clear
   */
  clearVerification(email: string): void {
    this.verificationRecords.delete(email);
  }
}

export const verificationService = new VerificationService();