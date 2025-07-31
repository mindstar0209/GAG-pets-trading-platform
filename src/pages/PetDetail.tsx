import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import { Pet, Order } from '../types';
import BotTradeFlow from '../components/BotTradeFlow';
import './PetDetail.css';

const PetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useTraditionalAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPetDetails();
  }, [id]);

  const fetchPetDetails = async () => {
    if (!id) return;
    
    try {
      const petDoc = await getDoc(doc(db, 'pets', id));
      if (petDoc.exists()) {
        setPet({ id: petDoc.id, ...petDoc.data() } as Pet);
      }
    } catch (error) {
      console.error('Error fetching pet details:', error);
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!pet || purchasing) return;

    if (user.balance < pet.price) {
      alert('Insufficient balance. Please deposit funds to continue.');
      return;
    }

    setPurchasing(true);
    try {
      const order: Omit<Order, 'id'> = {
        buyerId: user.uid,
        sellerId: pet.sellerId,
        petId: pet.id,
        petName: pet.name,
        price: pet.price,
        status: 'pending',
        createdAt: new Date()
      };

      const orderRef = await addDoc(collection(db, 'orders'), order);
      
      await updateDoc(doc(db, 'pets', pet.id), {
        listed: false
      });

      navigate(`/order/${orderRef.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
    setPurchasing(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading pet details...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="error-container">
        <h2>Pet not found</h2>
        <p>The pet you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#94a3b8';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'ultra-rare': return '#a855f7';
      case 'legendary': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="pet-detail">
      <div className="pet-detail-container">
        <div className="pet-detail-image-section">
          <div className="pet-detail-image-container">
            <img src={pet.imageUrl} alt={pet.name} className="pet-detail-image" />
            <div className="pet-badges-large">
              {pet.neon && <span className="badge-large neon">Neon</span>}
              {pet.mega && <span className="badge-large mega">Mega</span>}
              {pet.flyRide?.fly && <span className="badge-large fly">Fly</span>}
              {pet.flyRide?.ride && <span className="badge-large ride">Ride</span>}
            </div>
          </div>
        </div>

        <div className="pet-detail-info">
          <h1 className="pet-detail-name">{pet.name}</h1>
          
          <div className="pet-detail-meta">
            <span 
              className="pet-detail-rarity" 
              style={{ color: getRarityColor(pet.rarity) }}
            >
              {pet.rarity.charAt(0).toUpperCase() + pet.rarity.slice(1)} Pet
            </span>
            <span className="pet-detail-separator">•</span>
            <span className="pet-detail-age">
              {pet.age.charAt(0).toUpperCase() + pet.age.slice(1).replace('-', ' ')}
            </span>
          </div>

          <div className="pet-detail-price">
            <span className="price-label">Price</span>
            <div className="price-display">
              <span className="price-currency">$</span>
              <span className="price-value">{pet.price.toFixed(2)}</span>
            </div>
          </div>

          <div className="pet-detail-seller">
            <span className="seller-label">Seller</span>
            <span className="seller-name">{pet.sellerName}</span>
          </div>

          <div className="pet-detail-features">
            <h3 className="features-title">Features</h3>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">🎨</span>
                <span>Rarity: {pet.rarity}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📅</span>
                <span>Age: {pet.age}</span>
              </div>
              {pet.flyRide && (
                <div className="feature-item">
                  <span className="feature-icon">✈️</span>
                  <span>
                    {pet.flyRide.fly && pet.flyRide.ride ? 'Fly & Ride' : 
                     pet.flyRide.fly ? 'Fly' : 'Ride'}
                  </span>
                </div>
              )}
              {pet.neon && (
                <div className="feature-item">
                  <span className="feature-icon">✨</span>
                  <span>Neon</span>
                </div>
              )}
              {pet.mega && (
                <div className="feature-item">
                  <span className="feature-icon">🌟</span>
                  <span>Mega Neon</span>
                </div>
              )}
            </div>
          </div>

          <div className="safety-notice">
            <span className="safety-icon">🔒</span>
            <p>All trades are secured with our bot trading system</p>
          </div>

          {/* Bot Trading System */}
          {pet.listed ? (
            <BotTradeFlow 
              petId={pet.id}
              petName={pet.name}
              sellerId={pet.sellerId}
              price={pet.price}
              gameId="8737899170"
              onTradeComplete={() => {
                // Refresh pet data to show as sold
                fetchPetDetails();
              }}
            />
          ) : (
            <div className="pet-sold-notice">
              <h3>🎉 Pet Sold!</h3>
              <p>This pet has already been purchased by another user.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetDetail;