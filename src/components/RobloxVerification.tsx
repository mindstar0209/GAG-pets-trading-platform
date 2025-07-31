import React, { useState } from 'react';
import { useRobloxAuth } from '../hooks/useFirebaseRobloxAuth';
import './RobloxVerification.css';

interface RobloxVerificationProps {
  onVerified?: () => void;
}

const RobloxVerification: React.FC<RobloxVerificationProps> = ({ onVerified }) => {
  const { user, firebaseUser, verifyRobloxAccount } = useRobloxAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  if (!user || user.isVerified) {
    return null;
  }

  const expectedCode = `STARPETS_${firebaseUser?.uid.substring(7, 15).toUpperCase()}`;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyRobloxAccount(verificationCode);
      if (onVerified) {
        onVerified();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="roblox-verification">
      <div className="verification-header">
        <h3>Verify Your Roblox Account</h3>
        <p>Complete verification to enable trading and teleportation features</p>
      </div>

      {showInstructions && (
        <div className="verification-instructions">
          <h4>How to verify:</h4>
          <ol>
            <li>
              <strong>Open Roblox</strong> and go to your profile settings
            </li>
            <li>
              <strong>Update your status</strong> to exactly:
              <div className="verification-code-display">
                {expectedCode}
              </div>
              <button 
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(expectedCode);
                  alert('Code copied to clipboard!');
                }}
              >
                📋 Copy Code
              </button>
            </li>
            <li>
              <strong>Save your status</strong> and wait a few seconds
            </li>
            <li>
              <strong>Enter the code below</strong> and click Verify
            </li>
          </ol>
        </div>
      )}

      <form onSubmit={handleVerify} className="verification-form">
        {error && <div className="verification-error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="verificationCode">Verification Code</label>
          <input
            type="text"
            id="verificationCode"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter the code from above"
            disabled={loading}
            required
          />
        </div>

        <div className="verification-actions">
          <button 
            type="submit" 
            className="verify-button"
            disabled={loading || !verificationCode}
          >
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
          
          <button
            type="button"
            className="toggle-instructions"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </button>
        </div>
      </form>

      <div className="verification-benefits">
        <h4>Why verify?</h4>
        <ul>
          <li>✅ Enable automatic teleportation to seller's game</li>
          <li>✅ Confirm your Roblox identity for secure trading</li>
          <li>✅ Access premium features and higher limits</li>
          <li>✅ Build trust with other traders</li>
        </ul>
      </div>
    </div>
  );
};

export default RobloxVerification;