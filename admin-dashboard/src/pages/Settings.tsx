import React, { useState } from 'react';
import './Settings.css';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    platformName: 'GAG Pets Trading Platform',
    maintenanceMode: false,
    allowNewRegistrations: true,
    maxSellRequestsPerUser: 10,
    serviceFeePercentage: 5,
    creditPercentage: 90,
    autoApprovePets: false,
    emailNotifications: true,
    smsNotifications: false
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In real app, save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure platform settings and preferences</p>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <h2>General Settings</h2>
          <div className="form-group">
            <label htmlFor="platformName">Platform Name</label>
            <input
              type="text"
              id="platformName"
              name="platformName"
              value={settings.platformName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
              />
              <span>Maintenance Mode</span>
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="allowNewRegistrations"
                checked={settings.allowNewRegistrations}
                onChange={handleChange}
              />
              <span>Allow New User Registrations</span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Trading Settings</h2>
          <div className="form-group">
            <label htmlFor="maxSellRequestsPerUser">Max Sell Requests Per User</label>
            <input
              type="number"
              id="maxSellRequestsPerUser"
              name="maxSellRequestsPerUser"
              value={settings.maxSellRequestsPerUser}
              onChange={handleChange}
              min="1"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="serviceFeePercentage">Service Fee Percentage</label>
            <input
              type="number"
              id="serviceFeePercentage"
              name="serviceFeePercentage"
              value={settings.serviceFeePercentage}
              onChange={handleChange}
              min="0"
              max="50"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>

          <div className="form-group">
            <label htmlFor="creditPercentage">Credit Percentage for Sellers</label>
            <input
              type="number"
              id="creditPercentage"
              name="creditPercentage"
              value={settings.creditPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="autoApprovePets"
                checked={settings.autoApprovePets}
                onChange={handleChange}
              />
              <span>Auto-approve pets (skip staff review)</span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Notification Settings</h2>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleChange}
              />
              <span>Email Notifications</span>
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="smsNotifications"
                checked={settings.smsNotifications}
                onChange={handleChange}
              />
              <span>SMS Notifications</span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Danger Zone</h2>
          <div className="danger-actions">
            <button className="btn-danger">
              Reset All Settings
            </button>
            <button className="btn-danger">
              Clear All Data
            </button>
            <button className="btn-danger">
              Delete Platform
            </button>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button className="btn-secondary">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default Settings;
