import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { Transaction } from '../types';
import './Transactions.css';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'sale' | 'deposit' | 'withdrawal'>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return '#e74c3c';
      case 'sale': return '#27ae60';
      case 'deposit': return '#3498db';
      case 'withdrawal': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '🛒';
      case 'sale': return '💰';
      case 'deposit': return '📥';
      case 'withdrawal': return '📤';
      default: return '💳';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'purchase' || type === 'withdrawal' ? '-' : '+';
    return `${sign}$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="transactions">
        <div className="loading">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="transactions">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Monitor all platform transactions and financial activity</p>
      </div>

      <div className="filters">
        {['all', 'purchase', 'sale', 'deposit', 'withdrawal'].map((type) => (
          <button
            key={type}
            className={`filter-btn ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type as any)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="transactions-summary">
        <div className="summary-card">
          <h3>Total Transactions</h3>
          <p className="summary-value">{transactions.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Revenue</h3>
          <p className="summary-value">
            ${transactions
              .filter(t => t.type === 'purchase')
              .reduce((sum, t) => sum + t.amount, 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="summary-card">
          <h3>Total Payouts</h3>
          <p className="summary-value">
            ${transactions
              .filter(t => t.type === 'sale')
              .reduce((sum, t) => sum + t.amount, 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <div className="no-transactions-icon">💳</div>
            <h3>No Transactions Found</h3>
            <p>No transactions match your current filter.</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-type">
                  <span className="type-icon">
                    {getTransactionIcon(transaction.type)}
                  </span>
                  <span className="type-text">
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </span>
                </div>
                <div className="transaction-amount">
                  <span 
                    className="amount"
                    style={{ color: getTransactionTypeColor(transaction.type) }}
                  >
                    {formatAmount(transaction.amount, transaction.type)}
                  </span>
                </div>
              </div>
              
              <div className="transaction-details">
                <p className="transaction-description">{transaction.description}</p>
                <p className="transaction-date">
                  {transaction.createdAt.toLocaleString()}
                </p>
                <p className="transaction-user">
                  User ID: {transaction.userId}
                </p>
              </div>

              {transaction.metadata && (
                <div className="transaction-metadata">
                  <h4>Additional Details:</h4>
                  <pre>{JSON.stringify(transaction.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transactions;
