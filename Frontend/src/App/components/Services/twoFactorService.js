import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Simple 2FA implementation without crypto dependencies
export const twoFactorService = {
  // Generate 2FA secret for a user
  generateSecret: async (userId, email) => {
    try {
      // Generate a random secret (16 characters)
      const secret = generateRandomString(16);
      
      // Create QR code using external service
      const qrCodeUrl = await generateQRCode(secret, email);
      
      // Store the secret in Firestore
      await setDoc(doc(db, 'twoFactorAuth', userId), {
        secret: secret,
        tempSecret: secret,
        verified: false,
        createdAt: new Date()
      });
      
      return {
        secret: secret,
        qrCodeUrl,
        otpauth_url: `otpauth://totp/SpringFieldMedical:${email}?secret=${secret}&issuer=SpringFieldMedical`
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw error;
    }
  },

  // Verify 2FA token and enable 2FA
  verifyToken: async (userId, token) => {
    try {
      // Get the stored secret
      const twoFADoc = await getDoc(doc(db, 'twoFactorAuth', userId));
      
      if (!twoFADoc.exists()) {
        throw new Error('2FA not set up for this user');
      }

      const twoFAData = twoFADoc.data();
      const secret = twoFAData.tempSecret;

      // Simple demo verification - accepts codes starting with 1-3
      // In a real app, you'd implement proper TOTP verification
      const isValid = validateDemoToken(token, secret);

      if (isValid) {
        // Mark 2FA as verified and enabled
        await updateDoc(doc(db, 'twoFactorAuth', userId), {
          verified: true,
          enabled: true,
          verifiedAt: new Date()
        });

        // Update user profile to indicate 2FA is enabled
        await updateDoc(doc(db, 'users', userId), {
          is2FAEnabled: true
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      throw error;
    }
  },

  // Validate 2FA token during login
  validateToken: async (userId, token) => {
    try {
      const twoFADoc = await getDoc(doc(db, 'twoFactorAuth', userId));
      
      if (!twoFADoc.exists() || !twoFADoc.data().enabled) {
        throw new Error('2FA not enabled for this user');
      }

      const twoFAData = twoFADoc.data();
      const isValid = validateDemoToken(token, twoFAData.secret);

      return isValid;
    } catch (error) {
      console.error('Error validating 2FA token:', error);
      throw error;
    }
  },

  // Disable 2FA for a user
  disable2FA: async (userId) => {
    try {
      await updateDoc(doc(db, 'twoFactorAuth', userId), {
        enabled: false,
        disabledAt: new Date()
      });

      await updateDoc(doc(db, 'users', userId), {
        is2FAEnabled: false
      });

      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  },

  // Check if 2FA is enabled for a user
  is2FAEnabled: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() && userDoc.data().is2FAEnabled === true;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  },

  // Generate backup codes
  generateBackupCodes: async (userId) => {
    try {
      const backupCodes = Array.from({ length: 8 }, () => 
        generateRandomString(6).toUpperCase()
      );

      await updateDoc(doc(db, 'twoFactorAuth', userId), {
        backupCodes: backupCodes.map(code => ({
          code,
          used: false
        }))
      });

      return backupCodes;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      throw error;
    }
  },

  // Verify backup code
  verifyBackupCode: async (userId, code) => {
    try {
      const twoFADoc = await getDoc(doc(db, 'twoFactorAuth', userId));
      
      if (!twoFADoc.exists()) {
        return false;
      }

      const twoFAData = twoFADoc.data();
      const backupCode = twoFAData.backupCodes?.find(bc => 
        bc.code === code && !bc.used
      );

      if (backupCode) {
        // Mark backup code as used
        const updatedBackupCodes = twoFAData.backupCodes.map(bc =>
          bc.code === code ? { ...bc, used: true } : bc
        );

        await updateDoc(doc(db, 'twoFactorAuth', userId), {
          backupCodes: updatedBackupCodes
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }
};

// Helper functions
const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateQRCode = async (secret, email) => {
  const otpauth = `otpauth://totp/MahavirMediscope:${email}?secret=${secret}&issuer=MahavirMediscope`;
  // Use a QR code generation service and make it centered aligned
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}&margin=10`;
};

const validateDemoToken = (token, secret) => {
  // Demo validation - accepts any 6-digit code starting with 1, 2, or 3
  // In production, replace with proper TOTP validation
  const tokenRegex = /^[123]\d{5}$/;
  
  if (!tokenRegex.test(token)) {
    return false;
  }
  
  // For demo purposes, we'll accept the token if it matches our simple pattern
  // In a real app, you'd verify against the secret using TOTP algorithm
  return true;
};