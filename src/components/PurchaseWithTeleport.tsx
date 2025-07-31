import React, { useState } from 'react';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import { RobloxTeleportService } from '../services/robloxTeleport';
import RobloxAccountLinker from './RobloxAccountLinker';
import './PurchaseWithTeleport.css';

interface PurchaseWithTeleportProps {
  petId: string;
  sellerId: string;
  sellerUsername: string;
  price: number;
  onPurchaseComplete?: () => void;
}

const PurchaseWithTeleport: React.FC<PurchaseWithTeleportProps> = ({
  petId,
  sellerId,
  sellerUsername,
  price,
  onPurchaseComplete
}) => {
  const { user, firebaseUser } = useTraditionalAuth();
  const [step, setStep] = useState<'verify' | 'confirm' | 'teleport' | 'complete'>('verify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teleportData, setTeleportData] = useState<any>(null);

  if (!user) {
    return (
      <div className="purchase-login-required">
        <p>Please login to your account to purchase pets.</p>
      </div>
    );
  }

  const handlePurchase = async () => {
    setLoading(true);
    setError('');

    try {
      // Create mock teleport data for now
      // In a real app, you'd process the payment here
      const data = {
        gameId: "8737899170", // Pet Simulator 99
        accessCode: `PET_${petId.substring(0, 8).toUpperCase()}`,
        sellerId,
        petId
      };
      setTeleportData(data);
      setStep('teleport');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleTeleport = async () => {
    if (!teleportData) return;

    try {
      // Use the existing teleportToGame method
      RobloxTeleportService.teleportToGame(teleportData.gameId);
      
      // Move to completion step
      setStep('complete');
      
      if (onPurchaseComplete) {
        onPurchaseComplete();
      }
    } catch (err: any) {
      setError('Failed to open Roblox. Please try again.');
    }
  };

  // Show verification if user hasn't linked their Roblox account
  if (!user.isRobloxVerified && step === 'verify') {
    return (
      <div className="purchase-container">
        <h3>Link Your Roblox Account</h3>
        <p>Please link your Roblox account to enable teleportation for trades.</p>
        <RobloxAccountLinker onLinked={() => setStep('confirm')} />
      </div>
    );
  }

  return (
    <div className="purchase-container">
      {step === 'confirm' && (
        <div className="purchase-confirm">
          <h3>Confirm Purchase</h3>
          <div className="purchase-details">
            <div className="detail-row">
              <span>Seller:</span>
              <strong>{sellerUsername}</strong>
            </div>
            <div className="detail-row">
              <span>Price:</span>
              <strong>${price.toFixed(2)}</strong>
            </div>
            <div className="detail-row">
              <span>Your Balance:</span>
              <strong>${user.balance.toFixed(2)}</strong>
            </div>
          </div>

          {user.balance < price && (
            <div className="insufficient-balance">
              <p>Insufficient balance. Please add funds to continue.</p>
            </div>
          )}

          {error && <div className="purchase-error">{error}</div>}

          <div className="purchase-actions">
            <button
              className="purchase-button"
              onClick={handlePurchase}
              disabled={loading || user.balance < price}
            >
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>

          <div className="purchase-info">
            <h4>What happens next?</h4>
            <ol>
              <li>Payment will be processed</li>
              <li>You'll be teleported to the seller's game</li>
              <li>The seller's bot will trade you the pet</li>
              <li>Transaction complete!</li>
            </ol>
          </div>
        </div>
      )}

      {step === 'teleport' && teleportData && (
        <div className="purchase-teleport">
          <h3>Ready to Receive Your Pet!</h3>
          
          <div className="teleport-info">
            <p>Click the button below to join {sellerUsername}'s game.</p>
            <p className="access-code">Access Code: <strong>{teleportData.accessCode}</strong></p>
          </div>

          <button
            className="teleport-button"
            onClick={handleTeleport}
          >
            🎮 Join Roblox Game
          </button>

          <div className="teleport-instructions">
            <h4>Instructions:</h4>
            <ol>
              <li>Click "Join Roblox Game" above</li>
              <li>Allow your browser to open Roblox</li>
              <li>Wait for the game to load</li>
              <li>The bot will automatically trade you the pet</li>
            </ol>
          </div>

          {error && <div className="purchase-error">{error}</div>}
        </div>
      )}

      {step === 'complete' && (
        <div className="purchase-complete">
          <div className="success-icon">✅</div>
          <h3>Purchase Initiated!</h3>
          <p>You should now be joining the seller's game.</p>
          
          <div className="complete-info">
            <h4>Didn't work?</h4>
            <p>If Roblox didn't open automatically:</p>
            <button
              className="retry-button"
              onClick={() => window.open(
                `https://www.roblox.com/games/${teleportData.gameId}`,
                '_blank'
              )}
            >
              Open in Browser
            </button>
          </div>

          <div className="support-info">
            <p>Need help? Contact our support team with access code:</p>
            <p className="access-code">{teleportData?.accessCode}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseWithTeleport;