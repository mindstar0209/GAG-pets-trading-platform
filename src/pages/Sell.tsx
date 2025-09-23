import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import { useNotification } from '../contexts/NotificationContext';
import { SellRequestService } from '../services/sellRequestService';
import PetCustodyFlow from '../components/PetCustodyFlow';
import SellRequestStatus from '../components/SellRequestStatus';
import './Sell.css';

const Sell: React.FC = () => {
  const { user, loading: authLoading } = useTraditionalAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'custody' | 'status'>('form');
  const [currentSellRequest, setCurrentSellRequest] = useState<any>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  // Real-time status tracking for pending requests
  useEffect(() => {
    if (!user || !pendingRequestId) return;

    const q = query(
      collection(db, 'sellRequests'),
      where('__name__', '==', pendingRequestId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        setCurrentSellRequest({
          id: doc.id,
          petName: data.petData?.name || 'Unknown Pet',
          status: data.status || 'pending',
          submittedAt: data.requestedAt?.toDate() || new Date()
        });

        // If request is completed, approved, or rejected, show appropriate message
        if (data.status === 'verified') {
          showSuccess('Pet Approved!', 'Your pet has been approved and listed on the marketplace!');
        } else if (data.status === 'rejected') {
          showError('Pet Rejected', 'Your pet submission was rejected. Please check the reason and try again.');
        } else if (data.status === 'completed') {
          showSuccess('Pet Sold!', 'Your pet has been sold! Credit has been added to your account.');
        }
      }
    });

    return () => unsubscribe();
  }, [user, pendingRequestId, showSuccess, showError]);

  // Check for existing pending requests on page load
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sellRequests'),
      where('sellerId', '==', user.uid),
      where('status', 'in', ['pending', 'in_custody'])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        // Sort by requestedAt descending (newest first)
        const sortedDocs = querySnapshot.docs.sort((a, b) => {
          const aTime = a.data().requestedAt?.toDate?.() || new Date(0);
          const bTime = b.data().requestedAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        
        const doc = sortedDocs[0];
        const data = doc.data();
        
        setPendingRequestId(doc.id);
        setCurrentSellRequest({
          id: doc.id,
          petName: data.petData?.name || 'Unknown Pet',
          status: data.status || 'pending',
          submittedAt: data.requestedAt?.toDate() || new Date()
        });
        setStep('status');
      }
    });

    return () => unsubscribe();
  }, [user]);

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
      console.log('Custody completed with data:', custodyData);
      
      // Create sell request instead of directly listing the pet
      const petData = {
        name: petDataForCustody.name,
        type: petDataForCustody.type,
        rarity: petDataForCustody.rarity,
        age: petDataForCustody.age,
        price: petDataForCustody.price,
        flyRide: {
          fly: petDataForCustody.fly,
          ride: petDataForCustody.ride
        },
        neon: petDataForCustody.neon,
        mega: petDataForCustody.mega,
        description: petDataForCustody.description,
        imageUrl: petDataForCustody.imageUrl
      };

      const custodyInfo = {
        custodyId: custodyData.custodyId,
        staffId: custodyData.staffId || 'pending',
        staffUsername: custodyData.staffUsername || 'pending',
        inCustody: true,
        custodyDate: new Date()
      };

      console.log('Creating sell request with data:', {
        sellerId: user!.uid,
        sellerName: user!.displayName || user!.email || 'Anonymous',
        sellerEmail: user!.email || '',
        petData,
        custodyInfo
      });

      // Create sell request for staff review
      const requestId = await SellRequestService.createSellRequest(
        user!.uid,
        user!.displayName || user!.email || 'Anonymous',
        user!.email || '',
        petData,
        custodyInfo
      );

      console.log('Sell request created with ID:', requestId);
      
      // Store the sell request for status display
      setPendingRequestId(requestId);
      setCurrentSellRequest({
        id: requestId,
        petName: petData.name,
        status: 'pending',
        submittedAt: new Date()
      });
      
      showSuccess('Sell Request Created!', 'Our staff will review your pet and add it to the marketplace once verified.');
      setStep('status');
    } catch (error) {
      console.error('Error creating sell request:', error);
      showError('Request Failed', 'Failed to create sell request. Please try again.');
    }
  };

  const handleCustodyCancel = () => {
    setStep('form');
    setPetDataForCustody(null);
  };

  const handleSubmitAnother = () => {
    setPendingRequestId(null);
    setCurrentSellRequest(null);
    setStep('form');
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
        ) : step === 'custody' ? (
          <>
            <h1 className="sell-title">Pet Trading Process</h1>
            <p className="sell-subtitle">Our staff will safely handle your pet trading</p>
            
            <PetCustodyFlow
              petData={petDataForCustody!}
              onCustodyComplete={handleCustodyComplete}
              onCancel={handleCustodyCancel}
            />
          </>
        ) : (
          <div className="sell-status-container">
            <div className="status-header">
              <h1 className="sell-title">Pet Submission Status</h1>
              <p className="sell-subtitle">Track the progress of your pet submission</p>
            </div>
            
            <SellRequestStatus
              status={currentSellRequest?.status || 'pending'}
              petName={currentSellRequest?.petName || 'Unknown Pet'}
              submittedAt={currentSellRequest?.submittedAt || new Date()}
            />
            
            <div className="status-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/my-dashboard')}
              >
                View My Dashboard
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSubmitAnother}
              >
                Submit Another Pet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sell;