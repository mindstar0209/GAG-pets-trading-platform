import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
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

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'pets'),
        where('listed', '==', true),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const petsData: Pet[] = [];
      
      querySnapshot.forEach((doc) => {
        const pet = { id: doc.id, ...doc.data() } as Pet;
        petsData.push(pet);
      });

      // Apply filters and sorting on the client side
      const filteredPets = petsData.filter(pet => {
        if (filters.search && !pet.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.type && pet.type !== filters.type) return false;
        if (filters.rarity && pet.rarity !== filters.rarity) return false;
        if (filters.age && pet.age !== filters.age) return false;
        if (filters.minPrice && pet.price < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && pet.price > parseFloat(filters.maxPrice)) return false;
        if (filters.neon && !pet.neon) return false;
        if (filters.mega && !pet.mega) return false;
        if (filters.flyRide) {
          if (filters.flyRide === 'fly' && !pet.flyRide?.fly) return false;
          if (filters.flyRide === 'ride' && !pet.flyRide?.ride) return false;
          if (filters.flyRide === 'flyride' && (!pet.flyRide?.fly || !pet.flyRide?.ride)) return false;
        }
        return true;
      });

      // Sort by creation date (newest first)
      filteredPets.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      setPets(filteredPets);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

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