import React, { useState } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { RobloxAccount } from "../types";
import "./MultiAccountManager.css";

interface MultiAccountManagerProps {
  showTitle?: boolean;
}

const MultiAccountManager: React.FC<MultiAccountManagerProps> = ({
  showTitle = true,
}) => {
  const {
    user,
    addRobloxAccount,
    removeRobloxAccount,
    setActiveAccount,
    freezeAccount,
    unfreezeAccount,
    updateAccountPermissions,
    getActiveAccount,
    getAllAccounts,
  } = useTraditionalAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    robloxUserId: "",
    robloxUsername: "",
    displayName: "",
    avatarUrl: "",
    cookie: "",
    verificationMethod: "cookie" as "cookie" | "username" | "manual",
  });

  if (!user) {
    return (
      <div className="multi-account-error">
        <p>Please log in to manage your Roblox accounts.</p>
      </div>
    );
  }

  // Check if methods are available
  if (
    !addRobloxAccount ||
    !removeRobloxAccount ||
    !setActiveAccount ||
    !freezeAccount ||
    !unfreezeAccount ||
    !updateAccountPermissions ||
    !getActiveAccount ||
    !getAllAccounts
  ) {
    return (
      <div className="multi-account-error">
        <p>
          Multi-account management methods are not available. Please check your
          authentication setup.
        </p>
        <pre>
          {JSON.stringify(
            {
              addRobloxAccount: !!addRobloxAccount,
              removeRobloxAccount: !!removeRobloxAccount,
              setActiveAccount: !!setActiveAccount,
              freezeAccount: !!freezeAccount,
              unfreezeAccount: !!unfreezeAccount,
              updateAccountPermissions: !!updateAccountPermissions,
              getActiveAccount: !!getActiveAccount,
              getAllAccounts: !!getAllAccounts,
            },
            null,
            2
          )}
        </pre>
      </div>
    );
  }

  const accounts = getAllAccounts();
  const activeAccount = getActiveAccount();

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const accountData: Omit<RobloxAccount, "id" | "linkedAt" | "lastUsed"> = {
        robloxUserId: newAccountData.robloxUserId,
        robloxUsername: newAccountData.robloxUsername,
        displayName:
          newAccountData.displayName || newAccountData.robloxUsername,
        avatarUrl:
          newAccountData.avatarUrl ||
          `https://www.roblox.com/headshot-thumbnail/image?userId=${newAccountData.robloxUserId}&width=150&height=150&format=png`,
        isVerified: newAccountData.verificationMethod === "cookie",
        isActive: false,
        isFrozen: false,
        cookie: newAccountData.cookie || undefined,
        verificationMethod: newAccountData.verificationMethod,

        permissions: {
          canTrade: true,
          canTeleport: true,
          canAccessInventory: true,
        },
      };

      await addRobloxAccount(accountData);
      setShowAddForm(false);
      setNewAccountData({
        robloxUserId: "",
        robloxUsername: "",
        displayName: "",
        avatarUrl: "",
        cookie: "",
        verificationMethod: "cookie" as "cookie" | "username" | "manual",
      });
    } catch (err: any) {
      setError(err.message || "Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!window.confirm("Are you sure you want to remove this account?"))
      return;

    try {
      await removeRobloxAccount(accountId);
    } catch (err: any) {
      setError(err.message || "Failed to remove account");
    }
  };

  const handleSetActive = async (accountId: string) => {
    try {
      await setActiveAccount(accountId);
    } catch (err: any) {
      setError(err.message || "Failed to set active account");
    }
  };

  const handleFreezeToggle = async (account: RobloxAccount) => {
    try {
      if (account.isFrozen) {
        await unfreezeAccount(account.id);
      } else {
        await freezeAccount(account.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update account status");
    }
  };

  const handlePermissionToggle = async (
    accountId: string,
    permission: keyof RobloxAccount["permissions"]
  ) => {
    try {
      const account = accounts.find((acc) => acc.id === accountId);
      if (!account) return;

      const newPermissions = {
        ...account.permissions,
        [permission]: !account.permissions[permission],
      };

      await updateAccountPermissions(accountId, newPermissions);
    } catch (err: any) {
      setError(err.message || "Failed to update permissions");
    }
  };

  return (
    <div className="multi-account-manager">
      {showTitle && (
        <div className="manager-header">
          <h2>Multi-Account Manager</h2>
          <p>Manage your linked Roblox accounts</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      <div className="accounts-overview">
        <div className="overview-stats">
          <div className="stat">
            <span className="stat-number">{accounts.length}</span>
            <span className="stat-label">Total Accounts</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {accounts.filter((acc) => !acc.isFrozen).length}
            </span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {accounts.filter((acc) => acc.isFrozen).length}
            </span>
            <span className="stat-label">Frozen</span>
          </div>
        </div>

        <button
          className="add-account-btn"
          onClick={() => setShowAddForm(true)}
          disabled={accounts.length >= 5}
        >
          + Add Account
        </button>
      </div>

      {showAddForm && (
        <div className="add-account-form">
          <h3>Add New Roblox Account</h3>
          <form onSubmit={handleAddAccount}>
            <div className="form-group">
              <label>Roblox User ID:</label>
              <input
                type="text"
                value={newAccountData.robloxUserId}
                onChange={(e) =>
                  setNewAccountData({
                    ...newAccountData,
                    robloxUserId: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Roblox Username:</label>
              <input
                type="text"
                value={newAccountData.robloxUsername}
                onChange={(e) =>
                  setNewAccountData({
                    ...newAccountData,
                    robloxUsername: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Display Name (optional):</label>
              <input
                type="text"
                value={newAccountData.displayName}
                onChange={(e) =>
                  setNewAccountData({
                    ...newAccountData,
                    displayName: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Avatar URL (optional):</label>
              <input
                type="url"
                value={newAccountData.avatarUrl}
                onChange={(e) =>
                  setNewAccountData({
                    ...newAccountData,
                    avatarUrl: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Verification Method:</label>
              <select
                value={newAccountData.verificationMethod}
                onChange={(e) =>
                  setNewAccountData({
                    ...newAccountData,
                    verificationMethod: e.target.value as
                      | "cookie"
                      | "username"
                      | "manual",
                  })
                }
              >
                <option value="cookie">Cookie (Recommended)</option>
                <option value="username">Username Only</option>
              </select>
            </div>

            {newAccountData.verificationMethod === "cookie" && (
              <div className="form-group">
                <label>Roblox Cookie (.ROBLOSECURITY):</label>
                <textarea
                  value={newAccountData.cookie}
                  onChange={(e) =>
                    setNewAccountData({
                      ...newAccountData,
                      cookie: e.target.value,
                    })
                  }
                  placeholder="Paste your .ROBLOSECURITY cookie here"
                  rows={3}
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Account"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="accounts-list">
        {accounts.length === 0 ? (
          <div className="no-accounts">
            <div className="no-accounts-icon">🎮</div>
            <h3>No Roblox Accounts Linked</h3>
            <p>
              Add your first Roblox account to get started with trading and
              teleportation.
            </p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className={`account-card ${account.isFrozen ? "frozen" : ""} ${
                activeAccount?.id === account.id ? "active" : ""
              }`}
            >
              <div className="account-header">
                <div className="account-avatar">
                  <img
                    src={account.avatarUrl}
                    alt={`${account.robloxUsername} avatar`}
                  />
                  {account.isFrozen && <div className="frozen-overlay">❄️</div>}
                </div>
                <div className="account-info">
                  <h4 className="account-username">{account.robloxUsername}</h4>
                  <p className="account-display-name">{account.displayName}</p>
                  <div className="account-meta">
                    <span className="account-id">
                      ID: {account.robloxUserId}
                    </span>
                    <span
                      className={`verification-status ${
                        account.isVerified ? "verified" : "unverified"
                      }`}
                    >
                      {account.isVerified ? "✅ Verified" : "⏳ Unverified"}
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
                <div className="account-status">
                  {activeAccount?.id === account.id && (
                    <span className="active-badge">Active</span>
                  )}
                  {account.isFrozen && (
                    <span className="frozen-badge">Frozen</span>
                  )}
                </div>
              </div>

              <div className="account-permissions">
                <h5>Permissions:</h5>
                <div className="permissions-grid">
                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={account.permissions.canTrade}
                      onChange={() =>
                        handlePermissionToggle(account.id, "canTrade")
                      }
                      disabled={account.isFrozen}
                    />
                    <span>Trade</span>
                  </label>
                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={account.permissions.canTeleport}
                      onChange={() =>
                        handlePermissionToggle(account.id, "canTeleport")
                      }
                      disabled={account.isFrozen}
                    />
                    <span>Teleport</span>
                  </label>
                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={account.permissions.canAccessInventory}
                      onChange={() =>
                        handlePermissionToggle(account.id, "canAccessInventory")
                      }
                      disabled={account.isFrozen}
                    />
                    <span>Inventory</span>
                  </label>
                </div>
              </div>

              <div className="account-actions">
                {activeAccount?.id !== account.id && (
                  <button
                    className="action-btn set-active"
                    onClick={() => handleSetActive(account.id)}
                    disabled={account.isFrozen}
                  >
                    Set Active
                  </button>
                )}
                <button
                  className={`action-btn ${
                    account.isFrozen ? "unfreeze" : "freeze"
                  }`}
                  onClick={() => handleFreezeToggle(account)}
                >
                  {account.isFrozen ? "Unfreeze" : "Freeze"}
                </button>
                <button
                  className="action-btn remove"
                  onClick={() => handleRemoveAccount(account.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MultiAccountManager;
