import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import PetCustodyFlow from '../components/PetCustodyFlow';
import './Sell.css';

const Sell: React.FC = () => {
  const { user, loading: authLoading } = useTraditionalAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'custody'>('form');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    rarity: '',
    age: '',
    price: '',
    fly: false,
    ride: false,
    neon: false,
    mega: false,
    description: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [petDataForCustody, setPetDataForCustody] = useState<any>(null);

  const petTypes = ['Dog', 'Cat', 'Dragon', 'Unicorn', 'Phoenix', 'Griffin', 'Owl', 'Frost Dragon', 'Turtle', 'Kangaroo', 'Reindeer'];
  const rarities = ['common', 'uncommon', 'rare', 'ultra-rare', 'legendary'];
  const ages = ['newborn', 'junior', 'pre-teen', 'teen', 'post-teen', 'full-grown'];

  const handleImageUpload = async (file: File): Promise<string> => {
    const imageRef = ref(storage, `pet-images/${user!.uid}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.imageUrl;
      
      // Upload image if one was selected
      if (imageFile) {
        setUploadingImage(true);
        imageUrl = await handleImageUpload(imageFile);
        setUploadingImage(false);
      }
      
      // Use default avatar if no image provided
      if (!imageUrl) {
        imageUrl = `https://ui-avatars.com/api/?name=${formData.name}&background=4F46E5&color=fff`;
      }

      // Prepare pet data for custody
      const petData = {
        name: formData.name,
        type: formData.type,
        rarity: formData.rarity,
        age: formData.age,
        price: parseFloat(formData.price),
        fly: formData.fly,
        ride: formData.ride,
        neon: formData.neon,
        mega: formData.mega,
        description: formData.description,
        imageUrl
      };

      // Set pet data and move to custody step
      setPetDataForCustody(petData);
      setStep('custody');
      
    } catch (error) {
      console.error('Error preparing pet data:', error);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleCustodyComplete = async (custodyData: any) => {
    try {
      // Now create the actual pet listing with custody information
      const petData = {
        ...petDataForCustody,
        flyRide: {
          fly: petDataForCustody.fly,
          ride: petDataForCustody.ride
        },
        sellerId: user!.uid,
        sellerName: user!.displayName || user!.username || 'Anonymous',
        listed: true,
        createdAt: new Date(),
        // Add custody information
        custodyInfo: {
          custodyId: custodyData.custodyId,
          botId: custodyData.botId,
          botUsername: custodyData.botInfo?.username,
          inCustody: true,
          custodyDate: new Date()
        },
        // Add game data for export
        gameData: {
          petId: `${user!.uid}-${Date.now()}`,
          exportFormat: 'json',
          gameCompatible: true
        }
      };

      await addDoc(collection(db, 'pets'), petData);
      navigate('/marketplace');
    } catch (error) {
      console.error('Error creating pet listing:', error);
    }
  };

  const handleCustodyCancel = () => {
    setStep('form');
    setPetDataForCustody(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="sell-page">
        <div className="sell-container">
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-up prompt if user is not authenticated
  if (!user) {
    return (
      <div className="sell-page">
        <div className="sell-container">
          <h1 className="sell-title">Sign Up Required</h1>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '30px' }}>
              You need to create an account to list pets on our marketplace.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Sign Up
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-page">
      <div className="sell-container">
        {step === 'form' ? (
          <>
            <h1 className="sell-title">List Your Pet</h1>
            <p className="sell-subtitle">Fill in the details below to list your pet on the marketplace</p>

            <form onSubmit={handleSubmit} className="sell-form">
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">Pet Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Shadow Dragon"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type" className="form-label">Pet Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Type</option>
                  {petTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rarity" className="form-label">Rarity *</label>
                <select
                  id="rarity"
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Rarity</option>
                  {rarities.map(rarity => (
                    <option key={rarity} value={rarity}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age" className="form-label">Age *</label>
                <select
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Age</option>
                  {ages.map(age => (
                    <option key={age} value={age}>
                      {age.charAt(0).toUpperCase() + age.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price" className="form-label">Price (USD) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Special Features</h2>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="fly"
                  checked={formData.fly}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span>Fly</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="ride"
                  checked={formData.ride}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span>Ride</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="neon"
                  checked={formData.neon}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span>Neon</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="mega"
                  checked={formData.mega}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span>Mega</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Additional Details</h2>
            
            <div className="form-group">
              <label htmlFor="petImage" className="form-label">Pet Image (Optional)</label>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="petImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-input"
                />
                <label htmlFor="petImage" className="image-upload-label">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Pet preview" className="preview-image" />
                      <span className="change-image-text">Click to change image</span>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <span>Click to upload pet image</span>
                      <span className="upload-hint">PNG, JPG up to 5MB</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                rows={4}
                placeholder="Add any additional details about your pet..."
              />
            </div>
          </div>

          <div className="form-fee-info">
            <p className="fee-text">
              <span className="fee-icon">💰</span>
              Listing Fee: 10% of sale price (charged upon successful sale)
            </p>
            <p className="test-note">
              <span className="test-icon">🧪</span>
              Set price to $0.00 for testing the bot trading system
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || uploadingImage}
            >
              {uploadingImage ? 'Uploading Image...' : loading ? 'Preparing Pet...' : 'Continue to Pet Custody'}
            </button>
          </div>
        </form>
          </>
        ) : (
          <>
            <h1 className="sell-title">Pet Custody Process</h1>
            <p className="sell-subtitle">Our bot will safely hold your pet until it's sold</p>
            
            <PetCustodyFlow
              petData={petDataForCustody!}
              onCustodyComplete={handleCustodyComplete}
              onCancel={handleCustodyCancel}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Sell;