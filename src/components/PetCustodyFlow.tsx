import React, { useState } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
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
  const { user, getActiveAccount } = useTraditionalAuth();
  const activeAccount = getActiveAccount();
  const [step, setStep] = useState<
    | "instructions"
    | "waiting_staff"
    | "complete"
    | "error"
  >("instructions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartCustody = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // Create custody request for staff to handle
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create custody data for staff to process
      const custodyData = {
        custodyId: `custody_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        staffId: "pending", // Will be assigned when staff picks up
        staffUsername: "pending",
        status: "pending_staff",
        petData: petData,
        sellerId: user.uid,
        sellerRobloxUsername: activeAccount?.robloxUsername || user.username,
        gameId: "8737899170",
        requestedAt: new Date()
      };

      setStep("waiting_staff");

      // For testing, immediately complete the custody process
      setTimeout(() => {
        onCustodyComplete(custodyData);
        setStep("complete");
      }, 2000);

    } catch (err: any) {
      console.error("Custody request error:", err);
      setError(err.message || "Failed to create custody request");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="pet-custody-flow">
      {step === "instructions" && (
        <div className="custody-instructions">
          <div className="custody-header">
            <h3>👥 Staff Trading System</h3>
            <p>Our staff will safely handle your pet trading</p>
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
            <h4>How Pet Trading Works:</h4>
            <ol>
              <li>Submit your pet for review</li>
              <li>Our staff will contact you in-game</li>
              <li>Join Pet Simulator 99 when staff is ready</li>
              <li>Trade your pet to our staff member</li>
              <li>Staff verifies your pet quality</li>
              <li>Once approved, pet goes to marketplace</li>
              <li>You receive credit when pet is sold</li>
            </ol>
          </div>

          <div className="custody-benefits">
            <h4>Why Use Our Trading System?</h4>
            <ul>
              <li>
                ✅ <strong>Secure Trading</strong> - Staff prevents scams
              </li>
              <li>
                ✅ <strong>Quality Verification</strong> - Staff checks pet quality
              </li>
              <li>
                ✅ <strong>Fair Pricing</strong> - Market-based pricing system
              </li>
              <li>
                ✅ <strong>Guaranteed Payment</strong> - You get credit when sold
              </li>
            </ul>
          </div>

          {!user && (
            <div className="roblox-required">
              <p>⚠️ Please login to use pet trading.</p>
            </div>
          )}

          {error && <div className="custody-error">{error}</div>}

          <div className="custody-actions">
            <button
              className="start-custody-btn"
              onClick={handleStartCustody}
              disabled={loading || !user}
            >
              {loading ? "Submitting..." : "Submit for Staff Review"}
            </button>

            <button className="cancel-custody-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "waiting_staff" && (
        <div className="custody-waiting-staff">
          <div className="waiting-icon">⏳</div>
          <h3>Waiting for Staff</h3>
          <p>Your pet has been submitted for review. Our staff will contact you in-game soon.</p>
          
          <div className="pet-info">
            <img src={petData.imageUrl} alt={petData.name} className="pet-image" />
            <div className="pet-details">
              <h4>{petData.name}</h4>
              <p>{petData.type} • {petData.rarity} • ${petData.price}</p>
            </div>
          </div>

          <div className="next-steps">
            <h4>What Happens Next:</h4>
            <ul>
              <li>✅ Staff will review your pet request</li>
              <li>✅ Staff will contact you in-game</li>
              <li>✅ You'll trade your pet to staff</li>
              <li>✅ Staff will verify and approve your pet</li>
            </ul>
          </div>

          <div className="completion-actions">
            <button
              className="view-dashboard-btn"
              onClick={() => (window.location.href = "/my-dashboard")}
            >
              View My Dashboard
            </button>
          </div>
        </div>
      )}

      {step === "complete" && (
        <div className="custody-complete-step">
          <div className="success-icon">✅</div>
          <h3>Trading Request Submitted!</h3>
          <p>Your pet has been submitted for staff review.</p>

          <div className="pet-summary">
            <img
              src={petData.imageUrl}
              alt={petData.name}
              className="pet-image"
            />
            <div className="pet-details">
              <h4>{petData.name}</h4>
              <p>
                {petData.type} • {petData.rarity} • Age: {petData.age}
              </p>
              <div className="pet-price">
                <span>Listing Price:</span>
                <strong>${petData.price}</strong>
              </div>
            </div>
          </div>

          <div className="next-steps">
            <h4>What Happens Next:</h4>
            <ul>
              <li>✅ Your pet is now in custody with our staff</li>
              <li>✅ Staff will review your pet for quality</li>
              <li>✅ Once approved, pet will be listed on marketplace</li>
              <li>✅ You'll receive credit when pet is sold</li>
            </ul>
          </div>

          <div className="completion-actions">
            <button
              className="view-listing-btn"
              onClick={() => (window.location.href = "/my-dashboard")}
            >
              View My Dashboard
            </button>

            <button
              className="manage-listings-btn"
              onClick={() => (window.location.href = "/marketplace")}
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="custody-error-step">
          <div className="error-icon">❌</div>
          <h3>Trading Request Failed</h3>
          <p>{error || "Something went wrong with the trading request."}</p>

          <div className="error-actions">
            <button
              className="retry-btn"
              onClick={() => {
                setStep("instructions");
                setError("");
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