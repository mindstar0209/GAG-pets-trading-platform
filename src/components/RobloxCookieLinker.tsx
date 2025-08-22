import React, { useState } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { RobloxCookieAuthService } from "../services/robloxCookieAuth";
import "./RobloxCookieLinker.css";

interface RobloxCookieLinkerProps {
  onLinked?: () => void;
  showTitle?: boolean;
}

const RobloxCookieLinker: React.FC<RobloxCookieLinkerProps> = ({
  onLinked,
  showTitle = true,
}) => {
  const { user, linkRobloxAccountWithCookie } = useTraditionalAuth();
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"input" | "complete">("input");
  const [profileData, setProfileData] = useState<any>(null);

  if (!user) {
    return (
      <div className="roblox-cookie-linker-error">
        <p>Please log in to link your Roblox account.</p>
      </div>
    );
  }

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Link the account using cookie
      await linkRobloxAccountWithCookie(cookie);

      // Get profile data for display
      const profile = await RobloxCookieAuthService.validateCookieAndGetProfile(
        cookie
      );
      setProfileData(profile);
      setStep("complete");

      if (onLinked) {
        onLinked();
      }
    } catch (err: any) {
      setError(err.message || "Failed to link Roblox account");
    } finally {
      setLoading(false);
    }
  };

  const handleCookieChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCookie(value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  return (
    <div className="roblox-cookie-linker">
      {showTitle && (
        <div className="linker-header">
          <h3>Link Your Roblox Account with Cookie</h3>
          <p>
            Connect your Roblox account using your .ROBLOSECURITY cookie for
            enhanced features
          </p>
        </div>
      )}

      {step === "input" && (
        <form onSubmit={handleLinkAccount} className="linker-form">
          {error && <div className="linker-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="robloxCookie" className="form-label">
              Roblox Cookie (.ROBLOSECURITY)
            </label>
            <textarea
              id="robloxCookie"
              className="form-textarea"
              placeholder="Paste your .ROBLOSECURITY cookie here..."
              value={cookie}
              onChange={handleCookieChange}
              disabled={loading}
              required
              rows={4}
            />
            <small className="form-help">
              To get your cookie: Open Roblox in browser → F12 → Application →
              Cookies → Copy .ROBLOSECURITY value
            </small>
          </div>

          <div className="cookie-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <strong>Security Notice:</strong>
              <ul>
                <li>Your cookie will be encrypted and stored securely</li>
                <li>
                  We only use it to verify your account and access inventory
                </li>
                <li>Never share your cookie with anyone else</li>
                <li>You can unlink your account anytime</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            className="linker-button"
            disabled={loading || !cookie.trim()}
          >
            {loading ? "Linking Account..." : "Link Account"}
          </button>

          <div className="linker-benefits">
            <h4>Benefits of Cookie Linking:</h4>
            <ul>
              <li>✅ Instant account verification</li>
              <li>✅ Access to your Roblox inventory</li>
              <li>✅ Automatic profile sync</li>
              <li>✅ Enhanced trading features</li>
              <li>✅ No manual verification needed</li>
            </ul>
          </div>
        </form>
      )}

      {step === "complete" && profileData && (
        <div className="linking-complete">
          <div className="success-icon">✅</div>
          <h4>Roblox Account Linked Successfully!</h4>

          <div className="profile-info">
            <div className="profile-avatar">
              <img
                src={profileData.user_avatar_picture}
                alt={`${profileData.username}'s avatar`}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://www.roblox.com/headshot-thumbnail/image?userId=1&width=150&height=150&format=png";
                }}
              />
            </div>
            <div className="profile-details">
              <h5>{profileData.display_name || profileData.username}</h5>
              <p>Username: @{profileData.username}</p>
              <p>User ID: {profileData.userid}</p>
              {profileData.has_verified_badge && (
                <span className="verified-badge">✓ Verified</span>
              )}
            </div>
          </div>

          <div className="complete-benefits">
            <p>Your account is now fully connected! You can:</p>
            <ul>
              <li>🚀 Access your Roblox inventory</li>
              <li>🤝 Trade items directly</li>
              <li>✨ Show as a verified trader</li>
              <li>📱 Sync profile automatically</li>
            </ul>
          </div>

          <button
            onClick={() => setStep("input")}
            className="link-another-button"
          >
            Link Another Account
          </button>
        </div>
      )}
    </div>
  );
};

export default RobloxCookieLinker;
