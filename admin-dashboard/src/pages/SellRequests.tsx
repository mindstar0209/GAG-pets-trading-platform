import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AdminService } from '../services/adminService';
import { useNotification } from '../contexts/NotificationContext';
import { SellRequest } from '../types';
import './SellRequests.css';

const SellRequests: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_custody' | 'verified' | 'rejected' | 'completed'>('all');

  useEffect(() => {
    // Initial fetch
    fetchSellRequests();
    
    // Set up real-time listener
    const q = query(collection(db, 'sellRequests'), orderBy('requestedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests: SellRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          custodyInfo: {
            ...data.custodyInfo,
            custodyDate: data.custodyInfo?.custodyDate?.toDate() || new Date(),
          },
        } as SellRequest);
      });
      setSellRequests(requests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchSellRequests = async () => {
    setLoading(true);
    try {
      const requests = await AdminService.getSellRequests();
      setSellRequests(requests);
    } catch (error) {
      console.error('Error fetching sell requests:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyRequest = async (requestId: string, approved: boolean, notes?: string) => {
    setActionLoading(requestId);
    try {
      await AdminService.updateSellRequestStatus(
        requestId,
        approved ? 'verified' : 'rejected',
        'admin', // In real app, get from auth context
        'Admin User',
        approved ? undefined : 'Pet did not meet quality standards',
        notes
      );

      await fetchSellRequests();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      showSuccess('Request Updated!', `Request ${approved ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error updating request:', error);
      showError('Update Failed', 'Failed to update request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCredit = async (requestId: string, sellerId: string, creditAmount: number) => {
    setActionLoading(requestId);
    try {
      await AdminService.addCreditToSeller(
        requestId,
        sellerId,
        creditAmount,
        'admin',
        'Admin User'
      );

      await fetchSellRequests();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      showSuccess('Credit Added!', `Credit of $${creditAmount} added successfully!`);
    } catch (error) {
      console.error('Error adding credit:', error);
      showError('Credit Failed', 'Failed to add credit. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = sellRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in_custody': return '#3498db';
      case 'verified': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'completed': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'in_custody': return 'In Custody';
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="sell-requests">
        <div className="loading">Loading sell requests...</div>
      </div>
    );
  }

  return (
    <div className="sell-requests">
      <div className="page-header">
        <h1>Sell Requests</h1>
        <p>Manage pet sell requests from users</p>
      </div>

      <div className="filters">
        {['all', 'pending', 'in_custody', 'verified', 'rejected', 'completed'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status as any)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="requests-grid">
        {filteredRequests.map((request) => (
          <div key={request.id} className="request-card">
            <div className="request-header">
              <h3>{request.petData.name}</h3>
              <div 
                className="request-status"
                style={{ backgroundColor: getStatusColor(request.status) }}
              >
                {getStatusText(request.status)}
              </div>
            </div>
            
            <div className="request-details">
              <p><strong>Seller:</strong> {request.sellerName}</p>
              <p><strong>Type:</strong> {request.petData.type}</p>
              <p><strong>Rarity:</strong> {request.petData.rarity}</p>
              <p><strong>Price:</strong> ${request.petData.price.toFixed(2)}</p>
              <p><strong>Requested:</strong> {request.requestedAt.toLocaleDateString()}</p>
            </div>

            <div className="request-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedRequest(request);
                }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedRequest.petData.name} - Request Details</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedRequest(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="pet-info">
                <img 
                  src={selectedRequest.petData.imageUrl} 
                  alt={selectedRequest.petData.name}
                  className="pet-image"
                />
                <div className="pet-details">
                  <h3>{selectedRequest.petData.name}</h3>
                  <p><strong>Type:</strong> {selectedRequest.petData.type}</p>
                  <p><strong>Rarity:</strong> {selectedRequest.petData.rarity}</p>
                  <p><strong>Age:</strong> {selectedRequest.petData.age}</p>
                  <p><strong>Price:</strong> ${selectedRequest.petData.price.toFixed(2)}</p>
                  {selectedRequest.petData.flyRide && (
                    <p><strong>Abilities:</strong> 
                      {selectedRequest.petData.flyRide.fly ? ' Fly' : ''}
                      {selectedRequest.petData.flyRide.ride ? ' Ride' : ''}
                    </p>
                  )}
                  {selectedRequest.petData.neon && <p><strong>Neon:</strong> Yes</p>}
                  {selectedRequest.petData.mega && <p><strong>Mega:</strong> Yes</p>}
                </div>
              </div>

              <div className="seller-info">
                <h4>Seller Information</h4>
                <p><strong>Name:</strong> {selectedRequest.sellerName}</p>
                <p><strong>Email:</strong> {selectedRequest.sellerEmail}</p>
                <p><strong>Requested:</strong> {selectedRequest.requestedAt.toLocaleString()}</p>
              </div>

              <div className="custody-info">
                <h4>Custody Information</h4>
                <p><strong>Staff:</strong> {selectedRequest.custodyInfo.staffUsername}</p>
                <p><strong>In Custody:</strong> {selectedRequest.custodyInfo.inCustody ? 'Yes' : 'No'}</p>
                <p><strong>Custody Date:</strong> {selectedRequest.custodyInfo.custodyDate.toLocaleString()}</p>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="action-buttons">
                  <button
                    className="btn-success"
                    onClick={() => handleVerifyRequest(selectedRequest.id, true)}
                    disabled={actionLoading === selectedRequest.id}
                  >
                    {actionLoading === selectedRequest.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) {
                        handleVerifyRequest(selectedRequest.id, false, reason);
                      }
                    }}
                    disabled={actionLoading === selectedRequest.id}
                  >
                    Reject
                  </button>
                </div>
              )}

              {selectedRequest.status === 'verified' && !selectedRequest.creditAmount && (
                <div className="credit-section">
                  <h4>Add Credit to Seller</h4>
                  <div className="credit-input">
                    <input
                      type="number"
                      placeholder="Credit amount"
                      defaultValue={selectedRequest.petData.price * 0.9}
                      step="0.01"
                      min="0"
                    />
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const amount = parseFloat(
                          (document.querySelector('.credit-input input') as HTMLInputElement)?.value || '0'
                        );
                        if (amount > 0) {
                          handleAddCredit(selectedRequest.id, selectedRequest.sellerId, amount);
                        }
                      }}
                      disabled={actionLoading === selectedRequest.id}
                    >
                      {actionLoading === selectedRequest.id ? 'Adding...' : 'Add Credit'}
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.creditAmount && (
                <div className="credit-info">
                  <h4>Credit Added</h4>
                  <p><strong>Amount:</strong> ${selectedRequest.creditAmount.toFixed(2)}</p>
                  <p><strong>Date:</strong> {selectedRequest.creditAddedAt?.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellRequests;
