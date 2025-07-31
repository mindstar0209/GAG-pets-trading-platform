import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Pet } from '../types';
import PetCard from '../components/PetCard';
import './Marketplace.css';

const Marketplace: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    rarity: '',
    minPrice: '',
    maxPrice: '',
    age: '',
    flyRide: '',
    neon: false,
    mega: false
  });

  useEffect(() => {
    fetchPets();
  }, [filters]);

  const fetchPets = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'pets'),
        where('listed', '==', true),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const petsData: Pet[] = [];
      
      querySnapshot.forEach((doc) => {
        const pet = { id: doc.id, ...doc.data() } as Pet;
        
        if (filters.search && !pet.name.toLowerCase().includes(filters.search.toLowerCase())) return;
        if (filters.type && pet.type !== filters.type) return;
        if (filters.rarity && pet.rarity !== filters.rarity) return;
        if (filters.age && pet.age !== filters.age) return;
        if (filters.minPrice && pet.price < parseFloat(filters.minPrice)) return;
        if (filters.maxPrice && pet.price > parseFloat(filters.maxPrice)) return;
        if (filters.neon && !pet.neon) return;
        if (filters.mega && !pet.mega) return;
        if (filters.flyRide) {
          if (filters.flyRide === 'fly' && !pet.flyRide?.fly) return;
          if (filters.flyRide === 'ride' && !pet.flyRide?.ride) return;
          if (filters.flyRide === 'flyride' && (!pet.flyRide?.fly || !pet.flyRide?.ride)) return;
        }
        
        petsData.push(pet);
      });

      setPets(petsData);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
    setLoading(false);
  };

  const petTypes = ['Dog', 'Cat', 'Dragon', 'Unicorn', 'Phoenix', 'Griffin', 'Owl', 'Frost Dragon'];
  const rarities = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary'];
  const ages = ['newborn', 'junior', 'pre-teen', 'teen', 'post-teen', 'full-grown'];

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1 className="marketplace-title">Pet Marketplace</h1>
        <p className="marketplace-subtitle">Find your dream Adopt Me! pets</p>
      </div>

      <div className="marketplace-content">
        <aside className="filters-sidebar">
          <h2 className="filters-title">Filters</h2>
          
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Search pets..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Pet Type</label>
            <select
              className="filter-select"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              {petTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Rarity</label>
            <select
              className="filter-select"
              value={filters.rarity}
              onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
            >
              <option value="">All Rarities</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Age</label>
            <select
              className="filter-select"
              value={filters.age}
              onChange={(e) => setFilters({ ...filters, age: e.target.value })}
            >
              <option value="">All Ages</option>
              {ages.map(age => (
                <option key={age} value={age}>
                  {age.charAt(0).toUpperCase() + age.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                className="filter-input price-input"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                className="filter-input price-input"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Special</label>
            <select
              className="filter-select"
              value={filters.flyRide}
              onChange={(e) => setFilters({ ...filters, flyRide: e.target.value })}
            >
              <option value="">All</option>
              <option value="fly">Fly Only</option>
              <option value="ride">Ride Only</option>
              <option value="flyride">Fly & Ride</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.neon}
                onChange={(e) => setFilters({ ...filters, neon: e.target.checked })}
              />
              <span>Neon Only</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.mega}
                onChange={(e) => setFilters({ ...filters, mega: e.target.checked })}
              />
              <span>Mega Only</span>
            </label>
          </div>

          <button 
            className="clear-filters-btn"
            onClick={() => setFilters({
              search: '',
              type: '',
              rarity: '',
              minPrice: '',
              maxPrice: '',
              age: '',
              flyRide: '',
              neon: false,
              mega: false
            })}
          >
            Clear Filters
          </button>
        </aside>

        <div className="pets-grid-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading pets...</p>
            </div>
          ) : pets.length === 0 ? (
            <div className="no-results">
              <p>No pets found matching your criteria</p>
            </div>
          ) : (
            <div className="pets-grid">
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;