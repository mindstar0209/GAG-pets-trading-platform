import React, { useState } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const { user } = useTraditionalAuth();
  const navigate = useNavigate();
  const [initializing, setInitializing] = useState(false);
  const [initMessage, setInitMessage] = useState("");

  if (!user) {
    return <Navigate to="/login" />;
  }

  const initializeSampleData = async () => {
    setInitializing(true);
    setInitMessage("");

    try {
      // Check if data already exists
      const petsCollection = collection(db, "pets");
      const existingPets = await getDocs(query(petsCollection, limit(1)));

      if (!existingPets.empty) {
        setInitMessage("Database already contains pet data.");
        setInitializing(false);
        return;
      }

      // Sample pet data
      const samplePets = [
        {
          name: "Shadow Dragon",
          type: "Dragon",
          rarity: "legendary",
          price: 45.99,
          age: "full-grown",
          imageUrl:
            "https://ui-avatars.com/api/?name=Shadow+Dragon&background=4B0082&color=fff",
          sellerId: "system",
          sellerName: "Grow a Garden Trading",
          listed: true,
          flyRide: { fly: true, ride: true },
          neon: false,
          mega: false,
          description:
            "A rare and powerful Shadow Dragon with Fly and Ride abilities!",
        },
        {
          name: "Frost Fury",
          type: "Dragon",
          rarity: "legendary",
          price: 25.99,
          age: "teen",
          imageUrl:
            "https://ui-avatars.com/api/?name=Frost+Fury&background=00BFFF&color=fff",
          sellerId: "system",
          sellerName: "StarPets Official",
          listed: true,
          flyRide: { fly: true, ride: false },
          neon: true,
          mega: false,
          description: "Beautiful Neon Frost Fury with Fly ability!",
        },
        {
          name: "Golden Unicorn",
          type: "Unicorn",
          rarity: "legendary",
          price: 35.5,
          age: "post-teen",
          imageUrl:
            "https://ui-avatars.com/api/?name=Golden+Unicorn&background=FFD700&color=000",
          sellerId: "system",
          sellerName: "StarPets Official",
          listed: true,
          flyRide: { fly: false, ride: true },
          neon: false,
          mega: false,
          description: "Majestic Golden Unicorn with Ride ability!",
        },
        {
          name: "Owl",
          type: "Owl",
          rarity: "legendary",
          price: 55.0,
          age: "full-grown",
          imageUrl:
            "https://ui-avatars.com/api/?name=Owl&background=8B4513&color=fff",
          sellerId: "system",
          sellerName: "StarPets Official",
          listed: true,
          flyRide: { fly: true, ride: true },
          neon: false,
          mega: true,
          description: "Ultra-rare Mega Owl with Fly and Ride!",
        },
        {
          name: "Arctic Reindeer",
          type: "Reindeer",
          rarity: "legendary",
          price: 40.0,
          age: "full-grown",
          imageUrl:
            "https://ui-avatars.com/api/?name=Arctic+Reindeer&background=87CEEB&color=000",
          sellerId: "system",
          sellerName: "StarPets Official",
          listed: true,
          flyRide: { fly: true, ride: true },
          neon: true,
          mega: false,
          description: "Neon Arctic Reindeer with Fly and Ride!",
        },
        {
          name: "Phoenix",
          type: "Phoenix",
          rarity: "legendary",
          price: 30.0,
          age: "newborn",
          imageUrl:
            "https://ui-avatars.com/api/?name=Phoenix&background=FF4500&color=fff",
          sellerId: "system",
          sellerName: "StarPets Official",
          listed: true,
          flyRide: { fly: true, ride: false },
          neon: false,
          mega: false,
          description: "Mythical Phoenix with Fly ability!",
        },
        {
          name: "Turtle",
          type: "Turtle",
          rarity: "legendary",
          price: 28.5,
          age: "pre-teen",
          imageUrl:
            "https://ui-avatars.com/api/?name=Turtle&background=228B22&color=fff",
          sellerId: "system",
          sellerName: "StarPets Official",
          listed: true,
          flyRide: { fly: false, ride: true },
          neon: false,
          mega: false,
          description: "Adorable Turtle with Ride ability!",
        },
        {
          name: "Kangaroo",
          type: "Kangaroo",
          rarity: "legendary",
          price: 32.0,
          age: "full-grown",
          imageUrl:
            "https://ui-avatars.com/api/?name=Kangaroo&background=D2691E&color=fff",
          sellerId: "system",
          sellerName: "StarPets Official",
          listed: true,
          flyRide: { fly: true, ride: true },
          neon: false,
          mega: false,
          description: "Australian Kangaroo with Fly and Ride!",
        },
      ];

      // Add each pet to the database
      for (const pet of samplePets) {
        await addDoc(petsCollection, {
          ...pet,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      setInitMessage(
        `Successfully initialized ${samplePets.length} sample pets!`
      );
    } catch (error) {
      console.error("Error initializing data:", error);
      setInitMessage("Error initializing data. Check console for details.");
    }

    setInitializing(false);
  };

  const stats = [
    {
      label: "Account Balance",
      value: `$${user.balance?.toFixed(2) || "0.00"}`,
      icon: "💰",
    },
    { label: "Total Orders", value: "0", icon: "📦" },
    { label: "Active Listings", value: "0", icon: "🏪" },
    {
      label: "Member Since",
      value: new Date(user.createdAt).toLocaleDateString(),
      icon: "📅",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back, {user.displayName}!</p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <button
              className="action-button deposit"
              onClick={() =>
                alert(
                  "Deposit functionality coming soon! Contact support for manual deposits."
                )
              }
            >
              <span className="action-icon">💳</span>
              <span>Deposit Funds</span>
            </button>
            <button
              className="action-button browse"
              onClick={() => navigate("/marketplace")}
            >
              <span className="action-icon">🔍</span>
              <span>Browse Pets</span>
            </button>
            <button
              className="action-button sell"
              onClick={() => navigate("/sell")}
            >
              <span className="action-icon">💵</span>
              <span>Sell Pets</span>
            </button>
            <button
              className="action-button orders"
              onClick={() => navigate("/orders")}
            >
              <span className="action-icon">📋</span>
              <span>View Orders</span>
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            <p className="no-activity">No recent activity to display</p>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Admin Tools</h2>
          <div className="admin-tools">
            <button
              className="action-button init-data"
              onClick={initializeSampleData}
              disabled={initializing}
            >
              <span className="action-icon">🚀</span>
              <span>
                {initializing ? "Initializing..." : "Initialize Sample Data"}
              </span>
            </button>
            {initMessage && (
              <p
                className="init-message"
                style={{
                  marginTop: "10px",
                  color: initMessage.includes("Error") ? "red" : "green",
                }}
              >
                {initMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
