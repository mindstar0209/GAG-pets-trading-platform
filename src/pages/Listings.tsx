import React, { useState, useEffect } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { Navigate, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import "./Listings.css";

interface Listing {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  age: string;
  imageUrl: string;
  listed: boolean;
  flyRide: {
    fly: boolean;
    ride: boolean;
  };
  neon: boolean;
  mega: boolean;
  description: string;
  createdAt: Date;
  views?: number;
}

const Listings: React.FC = () => {
  const { user } = useTraditionalAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    if (!user) return;

    try {
      const listingsQuery = query(
        collection(db, "pets"),
        where("sellerId", "==", user.uid)
      );

      const snapshot = await getDocs(listingsQuery);
      const listingsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Listing[];

      setListings(listingsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [fetchListings, user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const toggleListing = async (listingId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "pets", listingId), {
        listed: !currentStatus,
      });

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === listingId
            ? { ...listing, listed: !currentStatus }
            : listing
        )
      );
    } catch (error) {
      console.error("Error updating listing:", error);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this listing? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "pets", listingId));
      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "#9CA3AF";
      case "uncommon":
        return "#10B981";
      case "rare":
        return "#3B82F6";
      case "ultra-rare":
        return "#8B5CF6";
      case "legendary":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  if (loading) {
    return (
      <div className="listings-page">
        <div className="loading">Loading your listings...</div>
      </div>
    );
  }

  return (
    <div className="listings-page">
      <div className="listings-container">
        <div className="listings-header">
          <h1 className="listings-title">My Listings</h1>
          <p className="listings-subtitle">
            Manage your pet listings and track performance
          </p>
          <Link to="/sell" className="add-listing-btn">
            <span>+</span> Add New Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="no-listings">
            <div className="no-listings-icon">🏪</div>
            <h3>No Listings Yet</h3>
            <p>
              You haven't listed any pets for sale yet. Start selling to earn
              money!
            </p>
            <Link to="/sell" className="sell-btn">
              List Your First Pet
            </Link>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <div className="listing-image">
                  <img src={listing.imageUrl} alt={listing.name} />
                  <div className="listing-badges">
                    {listing.flyRide.fly && (
                      <span className="badge fly">Fly</span>
                    )}
                    {listing.flyRide.ride && (
                      <span className="badge ride">Ride</span>
                    )}
                    {listing.neon && <span className="badge neon">Neon</span>}
                    {listing.mega && <span className="badge mega">Mega</span>}
                  </div>
                  <div
                    className="listing-status"
                    style={{
                      backgroundColor: listing.listed ? "#10B981" : "#EF4444",
                    }}
                  >
                    {listing.listed ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="listing-content">
                  <div className="listing-header">
                    <h3 className="listing-name">{listing.name}</h3>
                    <span
                      className="listing-rarity"
                      style={{ color: getRarityColor(listing.rarity) }}
                    >
                      {listing.rarity.charAt(0).toUpperCase() +
                        listing.rarity.slice(1)}
                    </span>
                  </div>

                  <div className="listing-details">
                    <p className="listing-type">
                      {listing.type} • {listing.age}
                    </p>
                    <p className="listing-price">${listing.price.toFixed(2)}</p>
                  </div>

                  <div className="listing-stats">
                    <span className="stat">
                      <span className="stat-icon">👁️</span>
                      {listing.views || 0} views
                    </span>
                    <span className="stat">
                      <span className="stat-icon">📅</span>
                      {listing.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="listing-actions">
                    <button
                      className={`action-btn ${
                        listing.listed ? "pause" : "activate"
                      }`}
                      onClick={() => toggleListing(listing.id, listing.listed)}
                    >
                      {listing.listed ? "Pause" : "Activate"}
                    </button>
                    <button
                      className="action-btn edit"
                      onClick={() => alert("Edit functionality coming soon!")}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteListing(listing.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="listings-summary">
          <div className="summary-card">
            <h3>Listing Summary</h3>
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="summary-label">Total Listings</span>
                <span className="summary-value">{listings.length}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Active</span>
                <span className="summary-value">
                  {listings.filter((l) => l.listed).length}
                </span>
              </div>
              <div className="summary-stat">
                <span className="summary-label">Total Value</span>
                <span className="summary-value">
                  ${listings.reduce((sum, l) => sum + l.price, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listings;
