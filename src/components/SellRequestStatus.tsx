import React from 'react';
import './SellRequestStatus.css';

interface SellRequestStatusProps {
  status: 'pending' | 'in_custody' | 'verified' | 'rejected' | 'completed';
  petName: string;
  submittedAt: Date;
}

const SellRequestStatus: React.FC<SellRequestStatusProps> = ({ 
  status, 
  petName, 
  submittedAt 
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          title: 'Under Review',
          message: 'Your pet is being reviewed by our staff',
          color: '#f59e0b',
          progress: 25
        };
      case 'in_custody':
        return {
          icon: '👥',
          title: 'Staff Contacted',
          message: 'Our staff will contact you in-game soon',
          color: '#3b82f6',
          progress: 50
        };
      case 'verified':
        return {
          icon: '✅',
          title: 'Approved!',
          message: 'Your pet has been approved and listed',
          color: '#10b981',
          progress: 75
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'Rejected',
          message: 'Your pet did not meet our quality standards',
          color: '#ef4444',
          progress: 100
        };
      case 'completed':
        return {
          icon: '🎉',
          title: 'Sold!',
          message: 'Your pet has been sold and you received credit',
          color: '#8b5cf6',
          progress: 100
        };
      default:
        return {
          icon: '❓',
          title: 'Unknown',
          message: 'Status unknown',
          color: '#6b7280',
          progress: 0
        };
    }
  };

  const statusInfo = getStatusInfo();
  const timeAgo = getTimeAgo(submittedAt);

  return (
    <div className="sell-request-status">
      <div className="status-header">
        <div className="status-icon" style={{ color: statusInfo.color }}>
          {statusInfo.icon}
        </div>
        <div className="status-content">
          <h3>{statusInfo.title}</h3>
          <p>{statusInfo.message}</p>
        </div>
      </div>

      <div className="status-details">
        <div className="pet-info">
          <span className="pet-name">{petName}</span>
          <span className="time-ago">Submitted {timeAgo}</span>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${statusInfo.progress}%`,
              backgroundColor: statusInfo.color 
            }}
          />
        </div>
      </div>

      {status === 'pending' && (
        <div className="loading-indicator">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Please wait while our staff reviews your pet...</p>
        </div>
      )}
    </div>
  );
};

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

export default SellRequestStatus;
