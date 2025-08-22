import React, { useState, useEffect } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { BotTradingService } from "../services/botTradingService";
import { RobloxTeleportService } from "../services/robloxTeleport";
import "./PetCustodyFlow.css";

interface PetCustodyFlowProps {
  petData: {
    name: string;
    type: string;
    rarity: string;
    age: string;
    price: number;
    fly: boolean;
    ride: boolean;
    neon: boolean;
    mega: boolean;
    description: string;
    imageUrl: string;
  };
  onCustodyComplete: (custodyData: any) => void;
  onCancel: () => void;
}

const PetCustodyFlow: React.FC<PetCustodyFlowProps> = ({
  petData,
  onCustodyComplete,
  onCancel,
}) => {
  const { user } = useTraditionalAuth();
  const { getActiveAccount } = useTraditionalAuth();
  const activeAccount = getActiveAccount();
  const [step, setStep] = useState<
    | "instructions"
    | "bot_request"
    | "waiting_trade"
    | "verifying"
    | "complete"
    | "error"
  >("instructions");
  const [custodyRequest, setCustodyRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [statusPolling]);

  const handleStartCustody = async () => {
    if (!user) return;

    // For testing purposes, use active account username if no Roblox account is linked
    const robloxUsername = activeAccount?.robloxUsername || user.username;

    setLoading(true);
    setError("");

    try {
      // Initiate custody process with bot
      const apiUrl =
        process.env.NODE_ENV === "development"
          ? "https://us-central1-sylvan-project-3d177.cloudfunctions.net/api/bot-trading/custody/initiate"
          : "/api/bot-trading/custody/initiate";

      console.log("Making custody API call to:", apiUrl);
      const custody = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: user.uid,
          sellerRobloxUsername: robloxUsername,
          petData,
          gameId: "8737899170", // Pet Simulator 99
        }),
      });

      if (!custody.ok) {
        const errorText = await custody.text();
        console.error("Custody API error:", custody.status, errorText);
        throw new Error(
          `Failed to initiate pet custody: ${custody.status} - ${errorText}`
        );
      }

      const custodyData = await custody.json();
      setCustodyRequest(custodyData);
      setStep("bot_request");

      // Start polling for custody status
      startCustodyPolling(custodyData.custodyId);
    } catch (err: any) {
      setError(err.message || "Failed to start custody process");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const startCustodyPolling = (custodyId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusUrl =
          process.env.NODE_ENV === "development"
            ? `https://us-central1-sylvan-project-3d177.cloudfunctions.net/api/bot-trading/custody/status/${custodyId}`
            : `/api/bot-trading/custody/status/${custodyId}`;
        const response = await fetch(statusUrl);
        const status = await response.json();
        setCustodyRequest(status);

        switch (status.status) {
          case "friend_request_sent":
            setStep("bot_request");
            break;
          case "friend_accepted":
            setStep("waiting_trade");
            break;
          case "pet_received":
            setStep("verifying");
            break;
          case "custody_complete":
            setStep("complete");
            clearInterval(interval);
            onCustodyComplete(status);
            break;
          case "failed":
            setStep("error");
            setError("Custody process failed. Please try again.");
            clearInterval(interval);
            break;
        }
      } catch (err) {
        console.error("Error polling custody status:", err);
      }
    }, 3000);

    setStatusPolling(interval);
  };

  const handleJoinGame = () => {
    RobloxTeleportService.teleportToGame("8737899170");
  };

  const botInfo = custodyRequest?.botInfo;

  return (
    <div className="pet-custody-flow">
      {step === "instructions" && (
        <div className="custody-instructions">
          <div className="custody-header">
            <h3>🤖 Pet Custody System</h3>
            <p>Our bot will safely hold your pet until it's sold</p>
          </div>

          <div className="pet-preview">
            <img
              src={petData.imageUrl}
              alt={petData.name}
              className="pet-image"
            />
            <div className="pet-info">
              <h4>{petData.name}</h4>
              <p>
                {petData.type} • {petData.rarity} •{" "}
                {petData.price === 0 ? "FREE (Test)" : `$${petData.price}`}
              </p>
            </div>
          </div>

          <div className="how-custody-works">
            <h4>How Pet Custody Works:</h4>
            <ol>
              <li>Our bot sends you a friend request</li>
              <li>Accept the friend request</li>
              <li>Join Pet Simulator 99</li>
              <li>Trade your pet to our bot</li>
              <li>Bot safely holds your pet</li>
              <li>When sold, bot delivers to buyer</li>
              <li>You receive payment automatically</li>
            </ol>
          </div>

          <div className="custody-benefits">
            <h4>Why Use Pet Custody?</h4>
            <ul>
              <li>
                ✅ <strong>Secure Trading</strong> - Bot prevents scams
              </li>
              <li>
                ✅ <strong>Instant Delivery</strong> - Buyers get pets
                immediately
              </li>
              <li>
                ✅ <strong>No Manual Work</strong> - Fully automated process
              </li>
              <li>
                ✅ <strong>Higher Sales</strong> - Buyers trust bot delivery
              </li>
            </ul>
          </div>

          {!user && (
            <div className="roblox-required">
              <p>⚠️ Please login to use pet custody.</p>
            </div>
          )}

          {error && <div className="custody-error">{error}</div>}

          <div className="custody-actions">
            <button
              className="start-custody-btn"
              onClick={handleStartCustody}
              disabled={loading || !user}
            >
              {loading ? "Starting..." : "Start Pet Custody"}
            </button>

            <button className="cancel-custody-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "bot_request" && botInfo && (
        <div className="bot-request-step">
          <div className="step-header">
            <h3>📱 Friend Request Sent!</h3>
            <p>Accept the friend request from our custody bot</p>
          </div>

          <div className="bot-info">
            <div className="bot-avatar">🤖</div>
            <div className="bot-details">
              <h4>{botInfo.username}</h4>
              <p>Custody Bot • Online</p>
            </div>
          </div>

          <div className="friend-instructions">
            <h4>Next Steps:</h4>
            <ol>
              <li>Check your Roblox friend requests</li>
              <li>
                Accept request from <strong>{botInfo.username}</strong>
              </li>
              <li>Wait for the next step</li>
            </ol>
          </div>

          <div className="manual-actions">
            <button
              className="open-roblox-btn"
              onClick={() =>
                window.open(
                  "https://www.roblox.com/users/friends#!/friend-requests",
                  "_blank"
                )
              }
            >
              Open Roblox Friends
            </button>

            <button
              className="skip-test-btn"
              onClick={() => {
                // Skip to next step for testing
                if (custodyRequest) {
                  setCustodyRequest({
                    ...custodyRequest,
                    status: "friend_accepted",
                  });
                  setStep("waiting_trade");
                }
              }}
            >
              Skip for Testing
            </button>
          </div>

          {custodyRequest && (
            <div className="custody-status">
              <p>
                <strong>Custody ID:</strong> {custodyRequest.custodyId}
              </p>
              <p>
                <strong>Status:</strong> Waiting for friend acceptance
              </p>
            </div>
          )}
        </div>
      )}

      {step === "waiting_trade" && (
        <div className="waiting-trade-step">
          <div className="step-header">
            <h3>🎮 Ready for Pet Transfer!</h3>
            <p>Join Pet Simulator 99 and trade your pet to our bot</p>
          </div>

          <div className="trade-instructions">
            <h4>Instructions:</h4>
            <ol>
              <li>Click "Join Game" below</li>
              <li>
                Wait for <strong>{botInfo?.username}</strong> to join your
                server
              </li>
              <li>The bot will send you a trade request</li>
              <li>
                Trade your <strong>{petData.name}</strong> to the bot
              </li>
              <li>Do NOT ask for anything in return</li>
            </ol>
          </div>

          <div className="important-note">
            <h4>⚠️ Important:</h4>
            <p>
              Only trade the exact pet you're listing:{" "}
              <strong>{petData.name}</strong>
            </p>
            <p>The bot will verify the pet matches your listing.</p>
          </div>

          <button className="join-game-btn" onClick={handleJoinGame}>
            🚀 Join Pet Simulator 99
          </button>

          {custodyRequest && (
            <div className="custody-status">
              <p>
                <strong>Custody ID:</strong> {custodyRequest.custodyId}
              </p>
              <p>
                <strong>Status:</strong> Waiting for pet trade
              </p>
            </div>
          )}
        </div>
      )}

      {step === "verifying" && (
        <div className="verifying-step">
          <div className="step-header">
            <h3>🔍 Verifying Pet...</h3>
            <p>Our bot is verifying your pet matches the listing</p>
          </div>

          <div className="verification-animation">
            <div className="loading-spinner">🔄</div>
          </div>

          <div className="verification-status">
            <p>✅ Pet received by bot</p>
            <p>🔍 Verifying pet details...</p>
            <p>📋 Checking rarity, age, and features...</p>
          </div>

          {custodyRequest && (
            <div className="custody-status">
              <p>
                <strong>Custody ID:</strong> {custodyRequest.custodyId}
              </p>
              <p>
                <strong>Status:</strong> Verifying pet
              </p>
            </div>
          )}
        </div>
      )}

      {step === "complete" && (
        <div className="custody-complete">
          <div className="success-animation">
            <div className="success-icon">✅</div>
          </div>

          <h3>🎉 Pet Custody Complete!</h3>
          <p>Your pet is now safely in bot custody and ready for sale!</p>

          <div className="completion-details">
            <div className="detail-item">
              <span>Pet in Custody:</span>
              <strong>{petData.name}</strong>
            </div>
            <div className="detail-item">
              <span>Custody Bot:</span>
              <strong>{botInfo?.username}</strong>
            </div>
            <div className="detail-item">
              <span>Listing Price:</span>
              <strong>${petData.price}</strong>
            </div>
          </div>

          <div className="next-steps">
            <h4>What Happens Next:</h4>
            <ul>
              <li>✅ Your pet is now listed on the marketplace</li>
              <li>✅ Buyers can purchase with instant delivery</li>
              <li>✅ You'll receive payment when sold</li>
              <li>✅ Bot handles all delivery automatically</li>
            </ul>
          </div>

          <div className="completion-actions">
            <button
              className="view-listing-btn"
              onClick={() => (window.location.href = "/marketplace")}
            >
              View Marketplace
            </button>

            <button
              className="manage-listings-btn"
              onClick={() => (window.location.href = "/listings")}
            >
              Manage My Listings
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="custody-error-step">
          <div className="error-icon">❌</div>
          <h3>Custody Failed</h3>
          <p>{error || "Something went wrong with the custody process."}</p>

          <div className="error-actions">
            <button
              className="retry-btn"
              onClick={() => {
                setStep("instructions");
                setError("");
                setCustodyRequest(null);
              }}
            >
              Try Again
            </button>

            <button className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetCustodyFlow;
