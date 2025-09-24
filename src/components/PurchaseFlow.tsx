import React, { useState } from 'react';
import { useSimplifiedRobloxAuth } from '../hooks/useRobloxAuth';
import { createTrade } from '../utils/tradingService';
import { Trade } from '../types/trading';
import { TransactionService } from '../services/transactionService';
import { MarketplaceService } from '../services/marketplaceService';
import { UserService } from '../services/userService';
import TradingFlow from './TradingFlow';
import './PurchaseFlow.css';

interface Pet {
  id: string;
  name: string;
  type: string;
  price: number;
  sellerRobloxUsername: string;
  sellerId: string;
  sellerName: string;
  imageUrl: string;
}

interface PurchaseFlowProps {
  pet: Pet;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

const PurchaseFlow: React.FC<PurchaseFlowProps> = ({ pet, onClose, onPurchaseComplete }) => {
  const { user } = useSimplifiedRobloxAuth();
  const [step, setStep] = useState<'confirm' | 'payment' | 'trading' | 'complete'>('confirm');
  const [loading, setLoading] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmPurchase = () => {
    setStep('payment');
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user has sufficient balance
      const totalCost = pet.price * 1.05; // Including 5% service fee
      if ((user?.balance || 0) < totalCost) {
        throw new Error('Insufficient funds');
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Record purchase transaction
      await TransactionService.recordPurchase(
        user?.uid || '',
        pet.id,
        pet.name,
        totalCost,
        pet.sellerId,
        pet.sellerName || 'Unknown Seller'
      );

      // Mark pet as sold and add credit to seller
      await MarketplaceService.markPetAsSold(
        pet.id,
        user?.uid || '',
        user?.displayName || 'Unknown Buyer'
      );

      // Add credit to seller account
      const sellerCreditAmount = pet.price; // Seller gets the full pet price (service fee goes to platform)
      await TransactionService.recordSale(
        pet.sellerId,
        pet.id,
        pet.name,
        pet.price, // Original price
        user?.uid || '',
        user?.displayName || 'Unknown Buyer',
        sellerCreditAmount // Credit amount (same as price in this case)
      );

      // Actually update the balances
      await UserService.addCredit(pet.sellerId, sellerCreditAmount);
      await UserService.deductBalance(user?.uid || '', totalCost);

      // Sale completed successfully
      
      // Create trade with bot
      const trade = await createTrade(
        user?.uid || '',
        user?.robloxUsername || '',
        pet.id,
        pet.name,
        pet.price
      );
      
      if (!trade) {
        throw new Error('Failed to create trade');
      }
      
      setCurrentTrade(trade);
      setStep('trading');
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleTradeComplete = () => {
    setStep('complete');
    onPurchaseComplete();
  };

  const handleTradeCancel = () => {
    setCurrentTrade(null);
    setStep('confirm');
  };

  return (
    <div className="purchase-flow-overlay">
      <div className="purchase-flow-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        {step === 'confirm' && (
          <div className="purchase-step">
            <h2>Confirm Purchase</h2>
            <div className="pet-summary">
              <img src={pet.imageUrl} alt={pet.name} className="pet-image" />
              <div className="pet-details">
                <h3>{pet.name}</h3>
                <p className="pet-type">{pet.type}</p>
                <p className="pet-price">${pet.price.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="seller-info">
              <h4>Seller Information</h4>
              <p><strong>Roblox Username:</strong> {pet.sellerRobloxUsername}</p>
              <p className="seller-note">You'll need to add this user as a friend to receive your pet</p>
            </div>

            <div className="purchase-actions">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmPurchase}>
                Confirm Purchase
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="purchase-step">
            <h2>Processing Payment</h2>
            <div className="payment-info">
              <div className="payment-summary">
                <div className="summary-row">
                  <span>Pet: {pet.name}</span>
                  <span>${pet.price.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Service Fee (5%)</span>
                  <span>${(pet.price * 0.05).toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span><strong>Total</strong></span>
                  <span><strong>${(pet.price * 1.05).toFixed(2)}</strong></span>
                </div>
              </div>
              
              <div className="balance-info">
                <p>Your Balance: ${user?.balance?.toFixed(2) || '0.00'}</p>
                {(user?.balance || 0) < (pet.price * 1.05) && (
                  <p className="insufficient-funds">
                    Insufficient funds. Please add money to your account.
                  </p>
                )}
              </div>
              
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div className="purchase-actions">
              <button className="btn-secondary" onClick={() => setStep('confirm')}>Back</button>
              <button 
                className="btn-primary" 
                onClick={handlePayment}
                disabled={loading || (user?.balance || 0) < (pet.price * 1.05)}
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        )}

        {step === 'trading' && currentTrade && (
          <TradingFlow 
            trade={currentTrade}
            onComplete={handleTradeComplete}
            onCancel={handleTradeCancel}
          />
        )}

        {step === 'complete' && (
          <div className="purchase-step">
            <h2>🎉 Purchase Complete!</h2>
            <div className="completion-message">
              <div className="success-icon">✅</div>
              <h3>Your {pet.name} is on the way!</h3>
              <p>You should receive your pet once the seller accepts your friend request and you meet in-game.</p>
              
              <div className="next-steps">
                <h4>What happens next:</h4>
                <ul>
                  <li>Your trade has been completed successfully</li>
                  <li>The pet has been delivered to your account</li>
                  <li>You can view your new pet in your inventory</li>
                  <li>Enjoy your new {pet.name}!</li>
                </ul>
              </div>

              <div className="support-info">
                <p><strong>Need help?</strong> Contact our support team with your trade ID: <code>#{currentTrade?.id.slice(-8) || Date.now().toString().slice(-6)}</code></p>
              </div>
            </div>

            <div className="purchase-actions">
              <button className="btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseFlow;