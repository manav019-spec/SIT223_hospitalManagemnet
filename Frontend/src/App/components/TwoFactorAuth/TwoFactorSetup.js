// TwoFactorSetup.js - UPDATED
import React, { useState, useEffect } from 'react';
import './TwoFactorSetup.css';
import { useAuth } from '../Context/AuthContext';
import { twoFactorService } from '../Services/twoFactorService';

const TwoFactorSetup = ({ onClose }) => {
  const { currentUser, userData, fetchUserData, disable2FA } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState('initial'); // initial, qr, verified

  useEffect(() => {
    if (userData?.is2FAEnabled) {
      setStep('verified');
      setSuccess('Two-factor authentication is already enabled for your account.');
    }
  }, [userData]);

  const setup2FA = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await twoFactorService.generateSecret(currentUser.uid, currentUser.email);
      setQrCodeUrl(result.qrCodeUrl);
      setStep('qr');
      setSuccess('Scan the QR code with your authenticator app');
    } catch (error) {
      setError('Failed to setup 2FA: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    try {
      setVerifying(true);
      setError('');
      
      if (!token) {
        setError('Please enter the verification code');
        return;
      }

      const verified = await twoFactorService.verifyToken(currentUser.uid, token);
      
      if (verified) {
        setSuccess('Two-factor authentication enabled successfully!');
        
        // Generate backup codes
        const codes = await twoFactorService.generateBackupCodes(currentUser.uid);
        setBackupCodes(codes);
        setShowBackupCodes(true);
        setStep('verified');
        
        // Refresh user data
        await fetchUserData(currentUser.uid);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Verification failed: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setDisabling(true);
      setError('');
      
      await disable2FA();
      setSuccess('Two-factor authentication has been disabled.');
      setStep('initial');
      
      // Refresh user data
      await fetchUserData(currentUser.uid);
    } catch (error) {
      setError('Failed to disable 2FA: ' + error.message);
    } finally {
      setDisabling(false);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = `Mahavir Mediscope Eye Centre - Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can be used once.`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mahavir-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCloseBackupCodes = () => {
    setShowBackupCodes(false);
    if (onClose) onClose();
  };

  return (
    <div className="twofactor-setup-profile">
      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      {step === 'initial' && (
        <div className="setup-initial">
          <p>Enhance your account security by enabling two-factor authentication.</p>
          <button
            className="setup-button"
            onClick={setup2FA}
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {step === 'qr' && (
        <div className="setup-qr">
          <h3>Scan QR Code</h3>
          <p>Use an authenticator app like Google Authenticator or Authy to scan this QR code.</p>
          
          <div className="qr-container">
            <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
          </div>

          <div className="demo-note">
            <strong>Demo Note:</strong> For testing, enter any 6-digit code starting with 1, 2, or 3.
          </div>

          <input
            type="text"
            className="token-input"
            placeholder="Enter 6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength="6"
          />

          <div className="verification-actions">
            <button
              className="verify-button"
              onClick={verify2FA}
              disabled={verifying || token.length !== 6}
            >
              {verifying ? 'Verifying...' : 'Verify and Enable'}
            </button>
            <button
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'verified' && (
        <div className="setup-complete">
          <div className="success-icon">✅</div>
          <h3>2FA Enabled Successfully!</h3>
          <p>Two-factor authentication is now active on your account.</p>
          
          <div className="verification-actions">
            <button
              className="disable-button"
              onClick={handleDisable2FA}
              disabled={disabling}
            >
              {disabling ? 'Disabling...' : 'Disable 2FA'}
            </button>
            <button
              className="close-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Backup Codes</h3>
            </div>
            
            <div className="modal-body">
              <p>Save these backup codes in a secure location. Each code can be used once if you lose access to your authenticator app.</p>
              
              <div className="backup-codes-list">
                {backupCodes.map((code, index) => (
                  <div key={code} className="backup-code-item">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button onClick={downloadBackupCodes} className="download-button">
                Download Codes
              </button>
              <button onClick={handleCloseBackupCodes} className="confirm-button">
                I've Saved These
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;