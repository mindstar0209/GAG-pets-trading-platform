import React, { useState, useEffect } from 'react';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import { BotTradingService } from '../services/botTradingService';
import { RobloxTeleportService } from '../services/robloxTeleport';
import './BotTradeFlow.css';

interface BotTradeFlowProps {
  petId: string;
  petName: string;
  sellerId: string;
  price: number;
  gameId?: string;
  onTradeComplete?: () => void;
}

const BotTradeFlow: React.FC<BotTradeFlowProps> = ({
  petId,
  petName,
  sellerId,
  price,
  gameId = '8737899170',
  onTradeComplete
}) => {
  const { user } = useTraditionalAuth();
  const [step, setStep] = useState<'confirm' | 'processing' | 'friend_request' | 'join_game' | 'trading' | 'complete' | 'error'>('confirm');
  const [tradeRequest, setTradeRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [statusPolling]);

  const handleInitiateTrade = async () => {
    if (!user) {
      setError('Please login to use bot trading.');
      return;
    }

    // Use username as fallback if no Roblox username is linked
    const robloxUsername = user.robloxUsername || user.username;

    setLoading(true);
    setError('');

    try {
      const trade = await BotTradingService.initiateBotTrade(
        user.uid,
        robloxUsername,
        sellerId,
        petId,
        petName,
        price,
        gameId
      );

      setTradeRequest(trade);
      setStep('processing');

      // Start status polling
      startStatusPolling(trade.id);

    } catch (err: any) {
      setError(err.message || 'Failed to initiate trade');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (tradeId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await BotTradingService.getTradeStatus(tradeId);
        setTradeRequest(status);

        switch (status.status) {
          case 'friend_request_sent':
            setStep('friend_request');
            break;
          case 'friend_accepted':
            setStep('join_game');
            break;
          case 'in_game':
          case 'trading':
            setStep('trading');
            break;
          case 'completed':
            setStep('complete');
            clearInterval(interval);
            if (onTradeComplete) onTradeComplete();
            break;
          case 'failed':
            setStep('error');
            setError('Trade failed. Please contact support.');
            clearInterval(interval);
            break;
        }
      } catch (err) {
        console.error('Error polling trade status:', err);
      }
    }, 3000); // Poll every 3 seconds

    setStatusPolling(interval);
  };

  const handleJoinGame = () => {
    if (!tradeRequest) return;
    
    // Teleport to game
    RobloxTeleportService.teleportToGame(gameId);
    
    // Notify backend that user is joining
    BotTradingService.joinBuyerServer(tradeRequest.id);
  };

  const handleSendFriendRequest = async () => {
    if (!tradeRequest) return;

    try {
      await BotTradingService.sendFriendRequest(tradeRequest.id);
    } catch (err: any) {
      setError(err.message || 'Failed to send friend request');
    }
  };

  if (!user) {
    return (
      <div className="bot-trade-error">
        <p>Please login to use bot trading.</p>
      </div>
    );
  }

  const botInfo = tradeRequest ? BotTradingService.getBotInfo(tradeRequest.botId) : null;
  const instructions = tradeRequest ? BotTradingService.generateBuyerInstructions(tradeRequest) : [];
  const estimatedWait = BotTradingService.getEstimatedWaitTime(gameId);

  return (
    <div className="bot-trade-flow">
      {step === 'confirm' && (
        <div className="trade-confirm">
          <div className="trade-header">
            <h3>🤖 Bot Trading System</h3>
            <p>Our bot will automatically deliver your pet!</p>
          </div>

          <div className="trade-details">
            <div className="detail-item">
              <span>Pet:</span>
              <strong>{petName}</strong>
            </div>
            <div className="detail-item">
              <span>Price:</span>
              <strong>${price.toFixed(2)}</strong>
            </div>
            <div className="detail-item">
              <span>Your Balance:</span>
              <strong>${user.balance.toFixed(2)}</strong>
            </div>
            {price === 0 && (
              <div className="detail-item test-pet">
                <span>🧪 Test Pet:</span>
                <strong>Free for Testing</strong>
              </div>
            )}
            <div className="detail-item">
              <span>Estimated Wait:</span>
              <strong>{estimatedWait} minutes</strong>
            </div>
          </div>

          {user.balance < price && price > 0 && (
            <div className="insufficient-balance">
              <p>⚠️ Insufficient balance. Please add funds to continue.</p>
            </div>
          )}

          {/* Roblox account linking is optional for testing */}

          <div className="how-it-works">
            <h4>How Bot Trading Works:</h4>
            <ol>
              <li>Our bot sends you a friend request</li>
              <li>Accept the friend request</li>
              <li>Join any Pet Simulator 99 server</li>
              <li>Bot joins your server automatically</li>
              <li>Bot trades you the pet instantly</li>
            </ol>
          </div>

          {error && <div className="trade-error">{error}</div>}

          <button
            className="initiate-trade-btn"
            onClick={handleInitiateTrade}
            disabled={loading || (user.balance < price && price > 0)}
          >
            {loading ? 'Processing...' : price === 0 ? 'Start Test Trade' : 'Start Bot Trade'}
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="trade-processing">
          <div className="loading-spinner">🔄</div>
          <h3>Setting Up Your Trade...</h3>
          <p>Finding available bot and preparing your pet delivery.</p>
          
          {tradeRequest && (
            <div className="trade-info">
              <p><strong>Trade ID:</strong> {tradeRequest.accessCode}</p>
              <p><strong>Status:</strong> Initializing...</p>
            </div>
          )}
        </div>
      )}

      {step === 'friend_request' && botInfo && (
        <div className="friend-request-step">
          <div className="step-header">
            <h3>📱 Friend Request Sent!</h3>
            <p>Accept the friend request to continue</p>
          </div>

          <div className="bot-info">
            <div className="bot-avatar">🤖</div>
            <div className="bot-details">
              <h4>{botInfo.robloxUsername}</h4>
              <p>Trading Bot • Online</p>
            </div>
          </div>

          <div className="friend-instructions">
            <h4>Next Steps:</h4>
            <ol>
              <li>Check your Roblox friend requests</li>
              <li>Accept request from <strong>{botInfo.robloxUsername}</strong></li>
              <li>The system will automatically detect when you accept</li>
            </ol>
          </div>

          <div className="manual-actions">
            <button
              className="open-roblox-btn"
              onClick={() => window.open('https://www.roblox.com/users/friends#!/friend-requests', '_blank')}
            >
              Open Roblox Friends
            </button>
            
            <button
              className="resend-request-btn"
              onClick={handleSendFriendRequest}
            >
              Resend Friend Request
            </button>
          </div>

          {tradeRequest && (
            <div className="trade-status">
              <p><strong>Trade ID:</strong> {tradeRequest.accessCode}</p>
              <p><strong>Status:</strong> Waiting for friend acceptance</p>
            </div>
          )}
        </div>
      )}

      {step === 'join_game' && (
        <div className="join-game-step">
          <div className="step-header">
            <h3>🎮 Ready to Trade!</h3>
            <p>Join Pet Simulator 99 and our bot will find you</p>
          </div>

          <div className="game-instructions">
            <h4>Instructions:</h4>
            <ol>
              <li>Click "Join Game" below</li>
              <li>Join any Pet Simulator 99 server</li>
              <li>Wait for <strong>{botInfo?.robloxUsername}</strong> to join</li>
              <li>Bot will automatically trade you the pet</li>
            </ol>
          </div>

          <button
            className="join-game-btn"
            onClick={handleJoinGame}
          >
            🚀 Join Pet Simulator 99
          </button>

          {tradeRequest && (
            <div className="trade-status">
              <p><strong>Trade ID:</strong> {tradeRequest.accessCode}</p>
              <p><strong>Status:</strong> Ready for game</p>
            </div>
          )}
        </div>
      )}

      {step === 'trading' && (
        <div className="trading-step">
          <div className="step-header">
            <h3>⚡ Trading in Progress!</h3>
            <p>Bot is delivering your pet now</p>
          </div>

          <div className="trading-animation">
            <div className="trade-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>

          <div className="trading-status">
            <p>🤖 <strong>{botInfo?.robloxUsername}</strong> is in your server</p>
            <p>⚡ Trading <strong>{petName}</strong> to you now...</p>
            <p>📦 Please accept the trade request in-game</p>
          </div>

          {tradeRequest && (
            <div className="trade-info">
              <p><strong>Trade ID:</strong> {tradeRequest.accessCode}</p>
              <p><strong>Status:</strong> {tradeRequest.status}</p>
            </div>
          )}
        </div>
      )}

      {step === 'complete' && (
        <div className="trade-complete">
          <div className="success-animation">
            <div className="success-icon">✅</div>
          </div>
          
          <h3>🎉 Trade Complete!</h3>
          <p>You have successfully received <strong>{petName}</strong>!</p>

          <div className="completion-details">
            <div className="detail-item">
              <span>Pet Received:</span>
              <strong>{petName}</strong>
            </div>
            <div className="detail-item">
              <span>Delivered By:</span>
              <strong>{botInfo?.robloxUsername}</strong>
            </div>
            <div className="detail-item">
              <span>Trade ID:</span>
              <strong>{tradeRequest?.accessCode}</strong>
            </div>
          </div>

          <div className="post-trade-actions">
            <button
              className="continue-shopping-btn"
              onClick={() => window.location.href = '/marketplace'}
            >
              Continue Shopping
            </button>
            
            <button
              className="view-orders-btn"
              onClick={() => window.location.href = '/orders'}
            >
              View My Orders
            </button>
          </div>

          <div className="trade-feedback">
            <p>How was your bot trading experience?</p>
            <div className="feedback-buttons">
              <button className="feedback-btn positive">👍 Great</button>
              <button className="feedback-btn neutral">👌 Good</button>
              <button className="feedback-btn negative">👎 Needs Work</button>
            </div>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="trade-error-step">
          <div className="error-icon">❌</div>
          <h3>Trade Failed</h3>
          <p>{error || 'Something went wrong with your trade.'}</p>

          <div className="error-actions">
            <button
              className="retry-btn"
              onClick={() => {
                setStep('confirm');
                setError('');
                setTradeRequest(null);
              }}
            >
              Try Again
            </button>
            
            <button
              className="support-btn"
              onClick={() => window.open('/support', '_blank')}
            >
              Contact Support
            </button>
          </div>

          {tradeRequest && (
            <div className="error-info">
              <p><strong>Trade ID:</strong> {tradeRequest.accessCode}</p>
              <p>Please provide this ID when contacting support.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BotTradeFlow;