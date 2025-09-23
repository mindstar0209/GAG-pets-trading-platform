import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TraditionalAuthProvider } from './hooks/useTraditionalAuth';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import Marketplace from './pages/Marketplace';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PetDetail from './pages/PetDetail';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import Sell from './pages/Sell';
import HowItWorks from './pages/HowItWorks';
import Orders from './pages/Orders';
import Listings from './pages/Listings';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <TraditionalAuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="pet/:id" element={<PetDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-dashboard" element={<UserDashboard />} />
              <Route path="sell" element={<Sell />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="orders" element={<Orders />} />
              <Route path="listings" element={<Listings />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </TraditionalAuthProvider>
  );
}

export default App;
