import React, { useState, useEffect, useCallback } from 'react';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import { Navigate } from 'react-router-dom';
import { TransactionService } from '../services/transactionService';
import { useNotification } from '../contexts/NotificationContext';
import { SellRequest } from '../types/sellRequest';
import { Transaction } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import './UserDashboard.css';

const UserDashboard: React.FC = () => {
  const { user } = useTraditionalAuth();
  const { showSuccess, showInfo } = useNotification();
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sell-requests' | 'transactions'>('overview');

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch transactions
      const userTransactions = await TransactionService.getUserTransactions(user.uid);
      setTransactions(userTransactions);

      // Fetch spending summary
      const summary = await TransactionService.getUserSpendingSummary(user.uid);
      setSpendingSummary(summary);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setupRealtimeListeners = useCallback(() => {
    if (!user) return;

    // Real-time listener for sell requests
    const requestsQuery = query(
      collection(db, 'sellRequests'),
      where('sellerId', '==', user.uid)
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (querySnapshot) => {
      const requests: SellRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          sellerId: data.sellerId,
          sellerName: data.sellerName,
          sellerEmail: data.sellerEmail,
          petData: data.petData,
          custodyInfo: {
            ...data.custodyInfo,
            custodyDate: data.custodyInfo?.custodyDate?.toDate() || new Date(),
          },
          status: data.status,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          verifiedAt: data.verifiedAt?.toDate(),
          verifiedBy: data.verifiedBy,
          soldAt: data.soldAt?.toDate(),
          removedAt: data.removedAt?.toDate(),
          rejectionReason: data.rejectionReason,
          staffNotes: data.staffNotes,
          creditAmount: data.creditAmount,
          creditAddedAt: data.creditAddedAt?.toDate(),
        } as SellRequest);
      });
      
      // Sort requests by requestedAt (newest first) - client-side sorting
      requests.sort((a, b) => {
        const aTime = a.requestedAt instanceof Date ? a.requestedAt.getTime() : new Date(a.requestedAt).getTime();
        const bTime = b.requestedAt instanceof Date ? b.requestedAt.getTime() : new Date(b.requestedAt).getTime();
        return bTime - aTime;
      });
      
      setSellRequests(requests);
    });

    return () => {
      unsubscribeRequests();
    };
  }, [user]);

  const handleStatusChange = useCallback((oldRequest: SellRequest, newRequest: SellRequest) => {
    switch (newRequest.status) {
      case 'verified':
        showSuccess('Pet Approved!', `${newRequest.petData.name} has been approved and listed on the marketplace!`);
        break;
      case 'rejected':
        showInfo('Pet Rejected', `${newRequest.petData.name} was rejected. Check the reason in your dashboard.`);
        break;
      case 'completed':
        showSuccess('Pet Sold!', `${newRequest.petData.name} has been sold! Credit has been added to your account.`);
        break;
      case 'in_custody':
        showInfo('Pet in Custody', `${newRequest.petData.name} is now in staff custody for verification.`);
        break;
    }
  }, [showSuccess, showInfo]);

  // Handle status change notifications
  useEffect(() => {
    if (sellRequests.length > 0) {
      // This will be called when sellRequests changes
      // We can add logic here to detect status changes if needed
    }
  }, [sellRequests]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      setupRealtimeListeners();
    }
  }, [user, fetchUserData, setupRealtimeListeners]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in_custody': return '#3B82F6';
      case 'verified': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#EF4444';
      case 'sale': return '#10B981';
      case 'deposit': return '#3B82F6';
      case 'withdrawal': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
        <p>Welcome back, {user.displayName}!</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'sell-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell-requests')}
        >
          Sell Requests ({sellRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Account Balance</h3>
                  <p className="stat-value">${user.balance?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>Total Spent</h3>
                  <p className="stat-value">${spendingSummary?.totalSpent?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💵</div>
                <div className="stat-content">
                  <h3>Total Earned</h3>
                  <p className="stat-value">${spendingSummary?.totalEarned?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>Sell Requests</h3>
                  <p className="stat-value">{sellRequests.length}</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Activity</h2>
              {transactions.length === 0 ? (
                <p className="no-activity">No recent activity</p>
              ) : (
                <div className="activity-list">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="activity-item">
                      <div className="activity-icon">
                        {transaction.type === 'purchase' && '🛒'}
                        {transaction.type === 'sale' && '💰'}
                        {transaction.type === 'deposit' && '📥'}
                        {transaction.type === 'withdrawal' && '📤'}
                      </div>
                      <div className="activity-content">
                        <p className="activity-description">{transaction.description}</p>
                        <p className="activity-time">
                          {transaction.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="activity-amount">
                        <span 
                          className={`amount ${transaction.type}`}
                          style={{ color: getTransactionTypeColor(transaction.type) }}
                        >
                          {transaction.type === 'purchase' || transaction.type === 'withdrawal' ? '-' : '+'}
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sell-requests' && (
          <div className="sell-requests-tab">
            <div className="requests-header">
              <h2>My Sell Requests</h2>
              <div className="requests-stats">
                <span className="stat-item">
                  <span className="stat-number">{sellRequests.filter(r => r.status === 'pending').length}</span>
                  <span className="stat-label">Pending</span>
                </span>
                <span className="stat-item">
                  <span className="stat-number">{sellRequests.filter(r => r.status === 'verified').length}</span>
                  <span className="stat-label">Approved</span>
                </span>
                <span className="stat-item">
                  <span className="stat-number">{sellRequests.filter(r => r.status === 'completed').length}</span>
                  <span className="stat-label">Sold</span>
                </span>
                <span className="stat-item">
                  <span className="stat-number">{sellRequests.filter(r => r.status === 'rejected').length}</span>
                  <span className="stat-label">Rejected</span>
                </span>
              </div>
            </div>

            {sellRequests.length === 0 ? (
              <div className="no-requests">
                <div className="no-requests-icon">📦</div>
                <h3>No Sell Requests</h3>
                <p>You haven't created any sell requests yet.</p>
                <a href="/sell" className="create-request-btn">Create Sell Request</a>
              </div>
            ) : (
              <div className="requests-list">
                {sellRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <div className="request-title">
                        <h3>{request.petData.name}</h3>
                        <span className="request-id">#{request.id.slice(-8)}</span>
                      </div>
                      <div 
                        className="request-status"
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {getStatusText(request.status)}
                      </div>
                    </div>
                    
                    <div className="request-details">
                      <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{request.petData.type}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Rarity:</span>
                        <span className="detail-value rarity">{request.petData.rarity}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value price">${request.petData.price.toFixed(2)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Requested:</span>
                        <span className="detail-value">{request.requestedAt.toLocaleString()}</span>
                      </div>
                      {request.verifiedAt && (
                        <div className="detail-row">
                          <span className="detail-label">Approved:</span>
                          <span className="detail-value">{request.verifiedAt.toLocaleString()}</span>
                        </div>
                      )}
                      {request.soldAt && (
                        <div className="detail-row">
                          <span className="detail-label">Sold:</span>
                          <span className="detail-value">{request.soldAt.toLocaleString()}</span>
                        </div>
                      )}
                      {request.creditAmount && (
                        <div className="detail-row">
                          <span className="detail-label">Credit Added:</span>
                          <span className="detail-value credit">+${request.creditAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Timeline */}
                    <div className="status-timeline">
                      <div className={`timeline-item ${request.status === 'pending' || request.status === 'in_custody' || request.status === 'verified' || request.status === 'rejected' || request.status === 'completed' ? 'completed' : ''}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <span className="timeline-title">Request Submitted</span>
                          <span className="timeline-time">{request.requestedAt.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {(request.status === 'in_custody' || request.status === 'verified' || request.status === 'rejected' || request.status === 'completed') && (
                        <div className={`timeline-item ${request.status === 'verified' || request.status === 'rejected' || request.status === 'completed' ? 'completed' : ''}`}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">In Staff Custody</span>
                            <span className="timeline-time">Verification in progress</span>
                          </div>
                        </div>
                      )}
                      
                      {(request.status === 'verified' || request.status === 'completed') && (
                        <div className={`timeline-item ${request.status === 'completed' ? 'completed' : ''}`}>
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Approved & Listed</span>
                            <span className="timeline-time">{request.verifiedAt?.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {request.status === 'completed' && (
                        <div className="timeline-item completed">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Sold</span>
                            <span className="timeline-time">{request.soldAt?.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {request.status === 'rejected' && (
                        <div className="timeline-item rejected">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Rejected</span>
                            <span className="timeline-time">{request.verifiedAt?.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {request.rejectionReason && (
                      <div className="rejection-reason">
                        <strong>Rejection Reason:</strong> {request.rejectionReason}
                      </div>
                    )}

                    {request.staffNotes && (
                      <div className="staff-notes">
                        <strong>Staff Notes:</strong> {request.staffNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <h2>Transaction History</h2>
            {transactions.length === 0 ? (
              <div className="no-transactions">
                <div className="no-transactions-icon">💳</div>
                <h3>No Transactions</h3>
                <p>You haven't made any transactions yet.</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-card">
                    <div className="transaction-header">
                      <div className="transaction-type">
                        <span className="type-icon">
                          {transaction.type === 'purchase' && '🛒'}
                          {transaction.type === 'sale' && '💰'}
                          {transaction.type === 'deposit' && '📥'}
                          {transaction.type === 'withdrawal' && '📤'}
                        </span>
                        <span className="type-text">
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </div>
                      <div className="transaction-amount">
                        <span 
                          className={`amount ${transaction.type}`}
                          style={{ color: getTransactionTypeColor(transaction.type) }}
                        >
                          {transaction.type === 'purchase' || transaction.type === 'withdrawal' ? '-' : '+'}
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="transaction-details">
                      <p className="transaction-description">{transaction.description}</p>
                      <p className="transaction-date">
                        {transaction.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
