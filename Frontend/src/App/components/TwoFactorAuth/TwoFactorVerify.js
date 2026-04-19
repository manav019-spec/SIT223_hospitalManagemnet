// TwoFactorVerify.js
import React, { useState } from 'react';
import './TwoFactorVerify.css';
import { twoFactorService } from '../Services/twoFactorService';

const TwoFactorVerify = ({ userId, onVerify, onBackupCode }) => {
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTokenVerify = async () => {
    try {
      setLoading(true);
      setError('');
      
      const verified = await twoFactorService.validateToken(userId, token);
      
      if (verified) {
        onVerify();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Verification failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodeVerify = async () => {
    try {
      setLoading(true);
      setError('');
      
      const verified = await twoFactorService.verifyBackupCode(userId, backupCode);
      
      if (verified) {
        onBackupCode();
      } else {
        setError('Invalid backup code. Please try again.');
      }
    } catch (error) {
      setError('Backup code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="twofactor-verify-container">
      <div className="twofactor-verify-card">
        <div className="security-icon">🔒</div>
        
        <h2>Two-Factor Authentication</h2>
        
        <p className="verify-description">
          {useBackupCode 
            ? 'Enter one of your backup codes' 
            : 'Enter the verification code from your authenticator app'
          }
        </p>

        {error && <div className="error-alert">{error}</div>}

        {!useBackupCode ? (
          <>
            <input
              type="text"
              className="token-input"
              placeholder="Enter 6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength="6"
            />
            
            <button
              className="verify-button"
              onClick={handleTokenVerify}
              disabled={loading || token.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              className="backup-toggle"
              onClick={() => setUseBackupCode(true)}
            >
              Use backup code instead
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              className="backup-input"
              placeholder="Enter backup code"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
            />
            
            <button
              className="verify-button"
              onClick={handleBackupCodeVerify}
              disabled={loading || !backupCode}
            >
              {loading ? 'Verifying...' : 'Verify with Backup Code'}
            </button>

            <button
              className="backup-toggle"
              onClick={() => setUseBackupCode(false)}
            >
              Use authenticator app instead
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFactorVerify;