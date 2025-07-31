import React from 'react';
import { Link } from 'react-router-dom';
import { Pet } from '../types';
import './PetCard.css';

interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
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
    <Link to={`/pet/${pet.id}`} className="pet-card">
      <div className="pet-card-image-container">
        <img src={pet.imageUrl} alt={pet.name} className="pet-card-image" />
        {pet.neon && <span className="pet-badge neon-badge">Neon</span>}
        {pet.mega && <span className="pet-badge mega-badge">Mega</span>}
        <div className="pet-badges">
          {pet.flyRide?.fly && <span className="pet-badge fly-badge">F</span>}
          {pet.flyRide?.ride && <span className="pet-badge ride-badge">R</span>}
        </div>
      </div>
      
      <div className="pet-card-content">
        <h3 className="pet-card-name">{pet.name}</h3>
        <div className="pet-card-details">
          <span 
            className="pet-rarity" 
            style={{ color: getRarityColor(pet.rarity) }}
          >
            {pet.rarity.charAt(0).toUpperCase() + pet.rarity.slice(1)}
          </span>
          <span className="pet-age">{pet.age}</span>
        </div>
        
        <div className="pet-card-footer">
          <div className="pet-price">
            <span className="price-symbol">$</span>
            <span className="price-amount">{pet.price.toFixed(2)}</span>
          </div>
          <button className="quick-buy-btn">Quick Buy</button>
        </div>
        
        <div className="pet-seller">
          <span>Sold by {pet.sellerName}</span>
        </div>
      </div>
    </Link>
  );
};

export default PetCard;