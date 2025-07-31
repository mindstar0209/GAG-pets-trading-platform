import React, { useState, useEffect } from 'react';
import { Trade, TeleportStep } from '../types/trading';
import { updateTradeStatus } from '../utils/tradingService';
import './TradingFlow.css';

interface TradingFlowProps {
  trade: Trade;
  onComplete?: () => void;
  onCancel?: () => void;
}

const TradingFlow: React.FC<TradingFlowProps> = ({ trade, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, trade.expiresAt.getTime() - Date.now());
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        updateTradeStatus(trade.id, 'failed');
        if (onCancel) onCancel();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [trade, onCancel]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStepAction = async (step: TeleportStep) => {
    switch (step.actionType) {
      case 'copy':
        if (step.actionData) {
          await handleCopy(step.actionData);
        }
        break;
      case 'open_link':
        if (step.actionData) {
          window.open(step.actionData, '_blank');
        }
        break;
      case 'wait':
        // Auto advance after 3 seconds for wait steps
        setTimeout(() => {
          if (currentStep < (trade.teleportInstructions?.steps.length || 0) - 1) {
            setCurrentStep(currentStep + 1);
          }
        }, 3000);
        break;
      case 'confirm':
        updateTradeStatus(trade.id, 'completed');
        if (onComplete) onComplete();
        break;
    }
  };

  const handleNextStep = () => {
    if (currentStep < (trade.teleportInstructions?.steps.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
      
      // Update trade status based on step
      if (currentStep === 0) {
        updateTradeStatus(trade.id, 'bot_ready');
      } else if (currentStep === 2) {
        updateTradeStatus(trade.id, 'buyer_joined');
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!trade.teleportInstructions) {
    return <div>Error: No trading instructions available</div>;
  }

  const steps = trade.teleportInstructions.steps;
  const currentStepData = steps[currentStep];

  return (
    <div className="trading-flow">
      <div className="trading-header">
        <h2>Complete Your Trade</h2>
        <div className="trade-info">
          <div className="trade-pet">
            <span className="label">Pet:</span>
            <span className="value">{trade.petName}</span>
          </div>
          <div className="trade-price">
            <span className="label">Price:</span>
            <span className="value">${trade.price.toFixed(2)}</span>
          </div>
          <div className="trade-timer">
            <span>⏰</span>
            <span className={timeRemaining < 60000 ? 'urgent' : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="step-indicators">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`step-indicator ${
              index === currentStep ? 'active' : 
              index < currentStep ? 'completed' : ''
            }`}
            onClick={() => index <= currentStep && setCurrentStep(index)}
          >
            {index < currentStep ? '✓' : index + 1}
          </div>
        ))}
      </div>

      <div className="current-step">
        <h3>{currentStepData.title}</h3>
        <p>{currentStepData.description}</p>

        {currentStepData.imageUrl && (
          <img 
            src={currentStepData.imageUrl} 
            alt={currentStepData.title}
            className="step-image"
          />
        )}

        {currentStepData.actionType === 'copy' && currentStepData.actionData && (
          <div className="copy-section">
            <code className="copy-text">{currentStepData.actionData}</code>
            <button 
              className="copy-button"
              onClick={() => handleCopy(currentStepData.actionData!)}
            >
              <span>📋</span>
              {copiedText === currentStepData.actionData ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {currentStepData.actionType === 'open_link' && currentStepData.actionData && (
          <button 
            className="action-button primary"
            onClick={() => window.open(currentStepData.actionData, '_blank')}
          >
            <span>🔗</span>
            Join Trading Server
          </button>
        )}

        {currentStepData.actionType === 'wait' && (
          <div className="wait-indicator">
            <div className="spinner"></div>
            <span>Please wait...</span>
          </div>
        )}

        {currentStepData.actionType === 'confirm' && (
          <button 
            className="action-button success"
            onClick={() => handleStepAction(currentStepData)}
          >
            <span>✅</span>
            Mark Trade as Complete
          </button>
        )}
      </div>

      <div className="step-navigation">
        <button 
          className="nav-button"
          onClick={handlePreviousStep}
          disabled={currentStep === 0}
        >
          Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button 
            className="nav-button primary"
            onClick={handleNextStep}
          >
            Next Step
          </button>
        ) : currentStepData.actionType !== 'confirm' && (
          <button 
            className="nav-button primary"
            onClick={() => {
              updateTradeStatus(trade.id, 'completed');
              if (onComplete) onComplete();
            }}
          >
            Complete Trade
          </button>
        )}
      </div>

      <div className="trade-actions">
        <button 
          className="cancel-button"
          onClick={() => {
            updateTradeStatus(trade.id, 'cancelled');
            if (onCancel) onCancel();
          }}
        >
          Cancel Trade
        </button>
      </div>
    </div>
  );
};

export default TradingFlow;