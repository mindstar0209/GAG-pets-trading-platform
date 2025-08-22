import React, { useState } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { RobloxApiService } from "../services/robloxApi";
import "./RobloxAccountLinker.css";

interface RobloxAccountLinkerProps {
  onLinked?: () => void;
  showTitle?: boolean;
}

const RobloxAccountLinker: React.FC<RobloxAccountLinkerProps> = ({
  onLinked,
  showTitle = true,
}) => {
  const { user, linkRobloxAccount, verifyRobloxAccount } = useTraditionalAuth();
  const [robloxUsername, setRobloxUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "verify" | "complete">("input");
  const [verificationCode, setVerificationCode] = useState("");

  if (!user) {
    return (
      <div className="roblox-linker-error">
        <p>Please log in to link your Roblox account.</p>
      </div>
    );
  }

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate Roblox username exists
      const validationResult = await RobloxApiService.validateUsername(
        robloxUsername
      );

      if (!validationResult.valid) {
        throw new Error(validationResult.error || "Invalid Roblox username");
      }

      // Link the account
      await linkRobloxAccount(robloxUsername);

      // Generate verification code
      const code = `STARPETS_${user.uid.substring(0, 8).toUpperCase()}`;
      setVerificationCode(code);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to link Roblox account");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    setError("");

    try {
      // Check if user has updated their Roblox status
      const robloxUserData = await RobloxApiService.searchUserByUsername(
        robloxUsername
      );
      if (!robloxUserData) {
        throw new Error("Roblox user not found");
      }

      const userStatus = await RobloxApiService.getUserStatus(
        robloxUserData.id
      );

      if (!userStatus.includes(verificationCode)) {
        throw new Error(
          "Verification code not found in your Roblox status. Please update your status and try again."
        );
      }

      // Mark as verified in the database
      await verifyRobloxAccount();

      setStep("complete");

      if (onLinked) {
        onLinked();
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="roblox-account-linker">
      {showTitle && (
        <div className="linker-header">
          <h3>Link Your Roblox Account</h3>
          <p>
            Connect your Roblox account to enable game teleportation for trades
          </p>
        </div>
      )}

      {step === "input" && (
        <form onSubmit={handleLinkAccount} className="linker-form">
          {error && <div className="linker-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="robloxUsername" className="form-label">
              Roblox Username
            </label>
            <input
              type="text"
              id="robloxUsername"
              className="form-input"
              placeholder="Enter your Roblox username"
              value={robloxUsername}
              onChange={(e) => setRobloxUsername(e.target.value)}
              disabled={loading}
              required
              pattern="[a-zA-Z0-9_]+"
              title="Roblox username can only contain letters, numbers, and underscores"
            />
          </div>

          <button
            type="submit"
            className="linker-button"
            disabled={loading || !robloxUsername}
          >
            {loading ? "Validating..." : "Link Account"}
          </button>

          <div className="linker-benefits">
            <h4>Why link your Roblox account?</h4>
            <ul>
              <li>✅ Instant teleportation to seller's games</li>
              <li>✅ Automatic friend requests for trading</li>
              <li>✅ Verified trader status</li>
              <li>✅ Enhanced security for transactions</li>
            </ul>
          </div>
        </form>
      )}

      {step === "verify" && (
        <div className="verification-step">
          <h4>Verify Account Ownership</h4>
          <p>
            To complete the linking process, please update your Roblox status
            with the code below:
          </p>

          <div className="verification-code-display">
            <strong>{verificationCode}</strong>
            <button
              className="copy-button"
              onClick={() => {
                navigator.clipboard.writeText(verificationCode);
                alert("Code copied to clipboard!");
              }}
            >
              📋 Copy
            </button>
          </div>

          <div className="verification-instructions">
            <h5>How to update your Roblox status:</h5>
            <ol>
              <li>
                Go to{" "}
                <a
                  href="https://www.roblox.com/my/account#!/info"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Roblox Account Settings
                </a>
              </li>
              <li>Find the "Status" field</li>
              <li>
                Paste the verification code: <code>{verificationCode}</code>
              </li>
              <li>Save your changes</li>
              <li>Come back and click "Verify" below</li>
            </ol>
          </div>

          {error && <div className="linker-error">{error}</div>}

          <div className="verification-actions">
            <button
              onClick={handleVerification}
              className="verify-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Account"}
            </button>

            <button
              onClick={() => setStep("input")}
              className="back-button"
              disabled={loading}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === "complete" && (
        <div className="linking-complete">
          <div className="success-icon">✅</div>
          <h4>Roblox Account Linked!</h4>
          <p>
            Your Roblox account <strong>{robloxUsername}</strong> has been
            successfully linked.
          </p>

          <div className="complete-benefits">
            <p>You can now:</p>
            <ul>
              <li>🚀 Teleport directly to seller's games</li>
              <li>🤝 Receive automatic friend requests</li>
              <li>✨ Show as a verified trader</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RobloxAccountLinker;
