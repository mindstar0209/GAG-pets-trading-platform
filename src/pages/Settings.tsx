import React, { useState } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { Navigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import RobloxAccountLinker from "../components/RobloxAccountLinker";
import RobloxCookieLinker from "../components/RobloxCookieLinker";
import RobloxInventory from "../components/RobloxInventory";
import LinkedAccountsDisplay from "../components/LinkedAccountsDisplay";
import MultiAccountManager from "../components/MultiAccountManager";
import "./Settings.css";

const Settings: React.FC = () => {
  const { user, logout } = useTraditionalAuth();
  const { getActiveAccount } = useTraditionalAuth();
  const activeAccount = getActiveAccount();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "profile" | "roblox" | "inventory" | "multi-account"
  >("profile");
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    robloxUsername: "",
    notifications: {
      email: true,
      orderUpdates: true,
      marketingEmails: false,
    },
    privacy: {
      showOnlineStatus: true,
      allowDirectMessages: true,
    },
  });

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as any),
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName,
        });
      }

      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: formData.displayName,
        robloxUsername: formData.robloxUsername,
        notifications: formData.notifications,
        privacy: formData.privacy,
        updatedAt: new Date(),
      });

      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you sure you want to delete your account? This action cannot be undone. Type "DELETE" to confirm:'
    );

    if (confirmation !== "DELETE") {
      return;
    }

    try {
      // In a real app, you'd call a cloud function to handle account deletion
      alert(
        "Account deletion requested. Please contact support to complete the process."
      );
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Account Settings</h1>
          <p className="settings-subtitle">
            Manage your account preferences and privacy settings
          </p>
        </div>

        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === "roblox" ? "active" : ""}`}
            onClick={() => setActiveTab("roblox")}
          >
            Roblox Account
          </button>
          <button
            className={`tab-button ${
              activeTab === "multi-account" ? "active" : ""
            }`}
            onClick={() => setActiveTab("multi-account")}
          >
            Multi-Account Manager
          </button>
          {activeAccount?.cookie && (
            <button
              className={`tab-button ${
                activeTab === "inventory" ? "active" : ""
              }`}
              onClick={() => setActiveTab("inventory")}
            >
              Roblox Inventory
            </button>
          )}
        </div>

        <div className="settings-content">
          {activeTab === "profile" && (
            <>
              <div className="settings-section">
                <h2 className="section-title">Profile Information</h2>
                <form onSubmit={handleSaveProfile} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="displayName" className="form-label">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Your display name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user.email}
                      className="form-input"
                      disabled
                    />
                    <p className="form-hint">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="robloxUsername" className="form-label">
                      Roblox Username
                    </label>
                    <input
                      type="text"
                      id="robloxUsername"
                      name="robloxUsername"
                      value={formData.robloxUsername}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Your Roblox username for pet delivery"
                    />
                    <p className="form-hint">
                      Required for automatic pet delivery
                    </p>
                  </div>

                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "Saving..." : "Save Profile"}
                  </button>

                  {message && (
                    <div
                      className={`message ${
                        message.includes("Error") ? "error" : "success"
                      }`}
                    >
                      {message}
                    </div>
                  )}
                </form>
              </div>

              <div className="settings-section">
                <h2 className="section-title">Notification Preferences</h2>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.email"
                      checked={formData.notifications.email}
                      onChange={handleInputChange}
                    />
                    <span>Email notifications</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.orderUpdates"
                      checked={formData.notifications.orderUpdates}
                      onChange={handleInputChange}
                    />
                    <span>Order status updates</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.marketingEmails"
                      checked={formData.notifications.marketingEmails}
                      onChange={handleInputChange}
                    />
                    <span>Marketing emails and promotions</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h2 className="section-title">Privacy Settings</h2>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="privacy.showOnlineStatus"
                      checked={formData.privacy.showOnlineStatus}
                      onChange={handleInputChange}
                    />
                    <span>Show online status to other users</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="privacy.allowDirectMessages"
                      checked={formData.privacy.allowDirectMessages}
                      onChange={handleInputChange}
                    />
                    <span>Allow direct messages from other users</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h2 className="section-title">Account Actions</h2>
                <div className="action-buttons">
                  <button onClick={logout} className="action-btn logout">
                    Sign Out
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="action-btn delete"
                  >
                    Delete Account
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h2 className="section-title">Delivery Information</h2>
                <div className="delivery-info">
                  <h3>🎮 How Pet Delivery Works</h3>
                  <div className="delivery-methods">
                    <div className="delivery-method">
                      <h4>🤖 Automatic Bot Delivery</h4>
                      <p>
                        Our bot will join your Grow a Garden game and trade the
                        pet directly to you. Make sure your Roblox username is
                        correct above.
                      </p>
                    </div>
                    <div className="delivery-method">
                      <h4>📥 Manual Download</h4>
                      <p>
                        Download pet data files that can be imported into Grow a
                        Garden. Perfect for offline trading or custom setups.
                      </p>
                    </div>
                    <div className="delivery-method">
                      <h4>🔑 Delivery Codes</h4>
                      <p>
                        Some pets come with special codes that can be redeemed
                        directly in the game for instant delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "roblox" && (
            <div className="settings-section">
              <h2 className="section-title">Roblox Account Linking</h2>

              {/* Display currently linked accounts */}
              <div className="linked-accounts-section">
                <LinkedAccountsDisplay showTitle={false} />
              </div>

              <div className="roblox-linking-options">
                <div className="linking-option">
                  <h3>🔐 Cookie-Based Linking (Recommended)</h3>
                  <p>
                    Link your account using your Roblox cookie for instant
                    verification and inventory access.
                  </p>
                  <RobloxCookieLinker showTitle={false} />
                </div>

                <div className="linking-option">
                  <h3>👤 Username-Based Linking</h3>
                  <p>
                    Link your account using just your Roblox username (requires
                    manual verification).
                  </p>
                  <RobloxAccountLinker showTitle={false} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "multi-account" && (
            <div className="settings-section">
              <MultiAccountManager showTitle={false} />
            </div>
          )}

          {activeTab === "inventory" && activeAccount?.cookie && (
            <div className="settings-section">
              <h2 className="section-title">Your Roblox Inventory</h2>
              <RobloxInventory showTitle={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
