import React, { useState, useEffect } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { RobloxInventoryService } from "../services/robloxInventoryService";
import "./RobloxInventory.css";

interface RobloxInventoryProps {
  showTitle?: boolean;
}

const RobloxInventory: React.FC<RobloxInventoryProps> = ({
  showTitle = true,
}) => {
  const { user } = useTraditionalAuth();
  const { getActiveAccount } = useTraditionalAuth();
  const activeAccount = getActiveAccount();

  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "collectibles" | "limited">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeAccount?.cookie && activeAccount?.robloxUserId) {
      loadInventory();
      loadStats();
    }
  }, [activeAccount, filter]);

  const loadInventory = async () => {
    if (!activeAccount?.cookie || !activeAccount?.robloxUserId) return;

    setLoading(true);
    setError("");

    try {
      let response;
      switch (filter) {
        case "collectibles":
          response = await RobloxInventoryService.getUserCollectibles(
            activeAccount.cookie,
            parseInt(activeAccount.robloxUserId)
          );
          break;
        case "limited":
          response = await RobloxInventoryService.getUserLimitedItems(
            activeAccount.cookie,
            parseInt(activeAccount.robloxUserId)
          );
          break;
        default:
          response = await RobloxInventoryService.getUserInventory(
            activeAccount.cookie,
            parseInt(activeAccount.robloxUserId),
            100
          );
      }

      if (response.success) {
        setInventory(response.items || []);
      } else {
        setError(response.error || "Failed to load inventory");
      }
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!activeAccount?.cookie || !activeAccount?.robloxUserId) return;

    try {
      const response = await RobloxInventoryService.getInventoryStats(
        activeAccount.cookie,
        parseInt(activeAccount.robloxUserId)
      );

      if (response.success) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSearch = async () => {
    if (
      !activeAccount?.cookie ||
      !activeAccount?.robloxUserId ||
      !searchTerm.trim()
    )
      return;

    setLoading(true);
    setError("");

    try {
      const response = await RobloxInventoryService.searchInventory(
        activeAccount.cookie,
        parseInt(activeAccount.robloxUserId),
        searchTerm
      );

      if (response.success) {
        setSearchResults(response.items || []);
      } else {
        setError(response.error || "Search failed");
      }
    } catch (error: any) {
      console.error("Error searching inventory:", error);
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };

  if (!activeAccount?.cookie || !activeAccount?.robloxUserId) {
    return (
      <div className="roblox-inventory-error">
        <p>
          Please link your Roblox account with a cookie to view your inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="roblox-inventory">
      {showTitle && (
        <div className="inventory-header">
          <h3>Your Roblox Inventory</h3>
          <p>Connected as: @{activeAccount.robloxUsername}</p>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="inventory-stats">
          <div className="stat-item">
            <span className="stat-label">Total Items:</span>
            <span className="stat-value">{stats.totalItems || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Collectibles:</span>
            <span className="stat-value">{stats.collectibles || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Limited Items:</span>
            <span className="stat-value">{stats.limitedItems || 0}</span>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="inventory-search">
        <input
          type="text"
          placeholder="Search your inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
        {searchResults.length > 0 && (
          <button onClick={clearSearch} className="clear-search">
            Clear
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div className="inventory-filters">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Items
        </button>
        <button
          className={`filter-btn ${filter === "collectibles" ? "active" : ""}`}
          onClick={() => setFilter("collectibles")}
        >
          Collectibles
        </button>
        <button
          className={`filter-btn ${filter === "limited" ? "active" : ""}`}
          onClick={() => setFilter("limited")}
        >
          Limited Items
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="inventory-error">
          <p>{error}</p>
        </div>
      )}

      {/* Inventory List */}
      <div className="inventory-list">
        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : searchResults.length > 0 ? (
          // Show search results
          searchResults.map((item: any) => (
            <div key={item.id} className="inventory-item">
              <img src={item.imageUrl} alt={item.name} />
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <span className="item-type">{item.type}</span>
              </div>
            </div>
          ))
        ) : inventory.length > 0 ? (
          // Show filtered inventory
          inventory.map((item: any) => (
            <div key={item.id} className="inventory-item">
              <img src={item.imageUrl} alt={item.name} />
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <span className="item-type">{item.type}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-inventory">
            <p>No items found in your inventory.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RobloxInventory;
