import React from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import "./LinkedAccountsDisplay.css";

interface LinkedAccountsDisplayProps {
  showTitle?: boolean;
}

const LinkedAccountsDisplay: React.FC<LinkedAccountsDisplayProps> = ({
  showTitle = true,
}) => {
  const { user, getAllAccounts, getActiveAccount } = useTraditionalAuth();

  if (!user) {
    return (
      <div className="linked-accounts-error">
        <p>Please log in to view your linked accounts.</p>
      </div>
    );
  }

  const accounts = getAllAccounts();
  const activeAccount = getActiveAccount();

  if (accounts.length === 0) {
    return (
      <div className="linked-accounts-empty">
        <div className="empty-icon">🎮</div>
        <h4>No Linked Accounts</h4>
        <p>You haven't linked any Roblox accounts yet.</p>
        <p className="empty-hint">
          Link your Roblox account to enable game teleportation and inventory
          access.
        </p>
      </div>
    );
  }

  return (
    <div className="linked-accounts-display">
      {showTitle && (
        <div className="linked-accounts-header">
          <h3>Linked Roblox Accounts</h3>
          <p>Your connected Roblox accounts for trading and teleportation</p>
        </div>
      )}

      <div className="linked-accounts-list">
        {accounts.map((account) => (
          <div key={account.id} className="linked-account-card">
            <div className="account-info">
              <div className="account-avatar">
                {account.avatarUrl ? (
                  <img
                    src={account.avatarUrl}
                    alt={`${account.robloxUsername} avatar`}
                  />
                ) : (
                  <div className="avatar-placeholder">👤</div>
                )}
              </div>
              <div className="account-details">
                <h4 className="account-username">{account.robloxUsername}</h4>
                <div className="account-meta">
                  <span className="account-id">ID: {account.robloxUserId}</span>
                  <span
                    className={`verification-status ${
                      account.isVerified ? "verified" : "unverified"
                    }`}
                  >
                    {account.isVerified
                      ? "✅ Verified"
                      : "⏳ Pending Verification"}
                  </span>
                  <span
                    className={`account-status ${
                      account.isActive ? "active" : "inactive"
                    }`}
                  >
                    {account.isActive ? "👑 Active" : "🔗 Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="account-capabilities">
              <div className="capability">
                <span className="capability-icon">🚀</span>
                <span className="capability-text">Game Teleportation</span>
              </div>
              {account.cookie && (
                <div className="capability">
                  <span className="capability-icon">📦</span>
                  <span className="capability-text">Inventory Access</span>
                </div>
              )}
              <div className="capability">
                <span className="capability-icon">🤝</span>
                <span className="capability-text">Auto Friend Requests</span>
              </div>
            </div>

            {!account.isVerified && (
              <div className="verification-notice">
                <p>⚠️ Account verification required for full functionality</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="linked-accounts-actions">
        <button className="action-button primary">🔄 Refresh Status</button>
        <button className="action-button secondary">⚙️ Manage Account</button>
      </div>
    </div>
  );
};

export default LinkedAccountsDisplay;
