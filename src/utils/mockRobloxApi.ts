// Mock API for local development
// Replace with actual backend API calls in production

import { auth } from '../firebase/config';
import { signInWithCustomToken } from 'firebase/auth';

interface MockRobloxUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

// Simulate Roblox user database
const mockRobloxUsers: Record<string, MockRobloxUser> = {
  'codyrutscher': {
    id: '12345678',
    username: 'codyrutscher',
    displayName: 'CodyRutscher',
    avatarUrl: 'https://tr.rbxcdn.com/30x30/avatar-headshot/image?userId=12345678'
  }
};

export const mockRobloxApi = {
  async loginWithUsername(username: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user exists in mock database
    const lowerUsername = username.toLowerCase();
    const mockUser = mockRobloxUsers[lowerUsername];
    
    if (!mockUser) {
      // Create a new mock user for any username
      const newUser: MockRobloxUser = {
        id: Math.floor(Math.random() * 100000000).toString(),
        username: username,
        displayName: username,
        avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=00D2FF&color=fff`
      };
      mockRobloxUsers[lowerUsername] = newUser;
      
      return {
        customToken: await this.createMockCustomToken(newUser.id),
        robloxId: newUser.id,
        avatarUrl: newUser.avatarUrl
      };
    }

    return {
      customToken: await this.createMockCustomToken(mockUser.id),
      robloxId: mockUser.id,
      avatarUrl: mockUser.avatarUrl
    };
  },

  async createMockCustomToken(robloxId: string) {
    // In production, this would be done by your backend
    // For development, we'll use a workaround
    const mockToken = btoa(JSON.stringify({
      uid: `roblox_${robloxId}`,
      robloxId,
      iat: Date.now() / 1000,
      exp: (Date.now() / 1000) + 3600
    }));
    
    return mockToken;
  },

  async verifyAccount(verificationCode: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In production, this would verify against Roblox API
    // For now, accept any code that matches our pattern
    const isValid = /^STARPETS_[A-Z0-9]{8}$/.test(verificationCode);
    
    if (!isValid) {
      throw new Error('Invalid verification code format');
    }
    
    return { success: true };
  },

  async getTeleportData(sellerId: string, petId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      placeId: '13822889', // Example place ID
      jobId: null,
      accessCode: Math.random().toString(36).substring(2, 15),
      sellerRobloxId: sellerId,
      sellerUsername: 'MockSeller',
      buyerUsername: 'MockBuyer',
      petId: petId,
      timestamp: Date.now()
    };
  }
};

// Override fetch for development
if (process.env.NODE_ENV === 'development') {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Intercept our API calls
    if (url.includes('/api/auth/roblox/login')) {
      const body = JSON.parse(init?.body as string || '{}');
      const result = await mockRobloxApi.loginWithUsername(body.username);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/auth/roblox/verify')) {
      const body = JSON.parse(init?.body as string || '{}');
      const result = await mockRobloxApi.verifyAccount(body.verificationCode);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Pass through to original fetch for other requests
    return originalFetch(input, init);
  };
}