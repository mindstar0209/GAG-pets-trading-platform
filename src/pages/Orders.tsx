import React, { useState, useEffect } from "react";
import { useTraditionalAuth } from "../hooks/useTraditionalAuth";
import { Navigate } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import {
  downloadPetData,
  generatePetExportData,
  generatePetImportInstructions,
} from "../utils/petExport";
import "./Orders.css";

interface Order {
  id: string;
  petId: string;
  petName: string;
  petType: string;
  price: number;
  sellerId: string;
  sellerName: string;
  status: "pending" | "completed" | "cancelled" | "delivered";
  createdAt: Date;
  deliveryMethod: "bot" | "manual" | "code";
  robloxUsername?: string;
  deliveryCode?: string;
}

const Orders: React.FC = () => {
  const { user } = useTraditionalAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("buyerId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(ordersQuery);
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Order[];

      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleDownloadPet = (order: Order) => {
    const petData = generatePetExportData(
      {
        id: order.petId,
        name: order.petName,
        type: order.petType,
        rarity: "legendary", // Default for now
        age: "full-grown",
        flyRide: { fly: true, ride: true },
        neon: false,
        mega: false,
        sellerName: order.sellerName,
      },
      user.displayName || "User"
    );

    downloadPetData(petData);

    // Show instructions
    alert(generatePetImportInstructions(order.petName));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "delivered":
        return "#3B82F6";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">
            Track your purchases and download your pets
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>
              You haven't made any purchases yet. Browse the marketplace to find
              your perfect pet!
            </p>
            <a href="/marketplace" className="browse-btn">
              Browse Marketplace
            </a>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="order-pet-name">{order.petName}</h3>
                    <p className="order-details">
                      {order.petType} • ${order.price.toFixed(2)} •{" "}
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </div>
                </div>

                <div className="order-body">
                  <p className="seller-info">Sold by: {order.sellerName}</p>

                  {order.status === "completed" && (
                    <div className="delivery-section">
                      <h4>🎮 Get Your Pet</h4>
                      <p>
                        Your pet is ready for delivery! Choose your preferred
                        method:
                      </p>

                      <div className="delivery-options">
                        <button
                          className="delivery-btn primary"
                          onClick={() => handleDownloadPet(order)}
                        >
                          📥 Download Pet Data
                        </button>

                        <div className="delivery-info">
                          <p>
                            <strong>Manual Trading:</strong>
                          </p>
                          <p>Contact seller: {order.sellerName}</p>
                          <p>Order ID: {order.id}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.deliveryCode && (
                    <div className="delivery-code">
                      <h4>🔑 Delivery Code</h4>
                      <code className="code-display">{order.deliveryCode}</code>
                      <p>
                        Enter this code in Grow a Garden to receive your pet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
