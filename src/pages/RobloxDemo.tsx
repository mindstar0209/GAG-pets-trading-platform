import React from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import RobloxCookieLinker from "../components/RobloxCookieLinker";
import RobloxAccountLinker from "../components/RobloxAccountLinker";
import RobloxInventory from "../components/RobloxInventory";
import "./RobloxDemo.css";

const RobloxDemo: React.FC = () => {
  const { user } = useTraditionalAuth();
  const { getActiveAccount } = useTraditionalAuth();
  const activeAccount = getActiveAccount();

  if (!user) {
    return (
      <div className="roblox-demo">
        <div className="demo-container">
          <h1>Roblox Account Linking Demo</h1>
          <p>Please log in to access the Roblox linking features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="roblox-demo">
      <div className="demo-header">
        <h1>🎮 Roblox Integration Demo</h1>
        <p>Experience seamless Roblox integration with our platform</p>
      </div>

      <div className="demo-content">
        <div className="demo-section">
          <h2>🔗 Account Linking</h2>
          <p>
            Link your Roblox account to enable advanced features like inventory
            access and game teleportation.
          </p>
          <RobloxAccountLinker />
        </div>

        <div className="demo-section">
          <h2>🍪 Cookie Authentication</h2>
          <p>
            For full functionality, link your Roblox account using a cookie for
            secure authentication.
          </p>
          <RobloxCookieLinker />
        </div>

        {activeAccount?.cookie && (
          <div className="demo-section">
            <h2>📦 Your Roblox Inventory</h2>
            <p>
              View and manage your Roblox inventory items directly from our
              platform.
            </p>
            <RobloxInventory showTitle={false} />
          </div>
        )}
      </div>

      <div className="demo-info">
        <h3>How to Get Your Roblox Cookie</h3>
        <div className="cookie-instructions">
          <ol>
            <li>
              Go to{" "}
              <a
                href="https://www.roblox.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Roblox.com
              </a>{" "}
              and log in
            </li>
            <li>
              Press <strong>F12</strong> to open Developer Tools
            </li>
            <li>
              Go to the <strong>Application</strong> tab
            </li>
            <li>
              Click on <strong>Cookies</strong> in the left sidebar
            </li>
            <li>
              Click on <strong>https://www.roblox.com</strong>
            </li>
            <li>
              Find the <strong>.ROBLOSECURITY</strong> cookie
            </li>
            <li>
              Copy the <strong>Value</strong> field
            </li>
            <li>Paste it in the cookie input above</li>
          </ol>
        </div>

        <div className="security-note">
          <h4>🔒 Security Note</h4>
          <p>
            Your cookie is encrypted and stored securely. We only use it to:
          </p>
          <ul>
            <li>Verify your Roblox account ownership</li>
            <li>Access your inventory for trading features</li>
            <li>Sync your profile information</li>
          </ul>
          <p>
            <strong>Never share your cookie with anyone else!</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RobloxDemo;
