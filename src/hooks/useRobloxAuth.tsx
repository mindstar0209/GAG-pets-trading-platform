import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithCustomToken,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface RobloxUser {
  uid: string;
  robloxId: string;
  robloxUsername: string;
  displayName: string;
  avatar: string;
  balance: number;
  createdAt: Date;
}

interface RobloxAuthContextType {
  user: RobloxUser | null;
  loading: boolean;
  loginWithRoblox: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserBalance: (newBalance: number) => Promise<void>;
}

const RobloxAuthContext = createContext<RobloxAuthContextType | undefined>(undefined);

// Roblox OAuth configuration
const ROBLOX_CLIENT_ID = process.env.REACT_APP_ROBLOX_CLIENT_ID || 'your-roblox-client-id';
const ROBLOX_REDIRECT_URI = process.env.REACT_APP_ROBLOX_REDIRECT_URI || `${window.location.origin}/auth/roblox/callback`;

export const RobloxAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RobloxUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              robloxId: userData.robloxId,
              robloxUsername: userData.robloxUsername,
              displayName: userData.displayName || userData.robloxUsername,
              avatar: userData.avatar || `https://www.roblox.com/headshot-thumbnail/image?userId=${userData.robloxId}&width=150&height=150&format=png`,
              balance: userData.balance || 0,
              createdAt: userData.createdAt?.toDate() || new Date()
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithRoblox = async () => {
    // Redirect to Roblox OAuth
    const authUrl = `https://apis.roblox.com/oauth/v1/authorize?` +
      `client_id=${ROBLOX_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(ROBLOX_REDIRECT_URI)}&` +
      `scope=openid profile&` +
      `response_type=code&` +
      `state=${generateRandomState()}`;
    
    window.location.href = authUrl;
  };

  const handleRobloxCallback = async (code: string) => {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('/api/auth/roblox/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: ROBLOX_REDIRECT_URI })
      });

      const { access_token } = await tokenResponse.json();

      // Get user info from Roblox
      const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      const robloxUserData = await userResponse.json();

      // Create custom Firebase token
      const customTokenResponse = await fetch('/api/auth/create-custom-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robloxId: robloxUserData.sub, robloxUsername: robloxUserData.preferred_username })
      });

      const { customToken } = await customTokenResponse.json();

      // Sign in with custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      // Save user data to Firestore
      const userData = {
        robloxId: robloxUserData.sub,
        robloxUsername: robloxUserData.preferred_username,
        displayName: robloxUserData.preferred_username,
        avatar: robloxUserData.picture,
        balance: 0,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData, { merge: true });

    } catch (error) {
      console.error('Error during Roblox authentication:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!user) return;
    
    await setDoc(doc(db, 'users', user.uid), { balance: newBalance }, { merge: true });
    setUser({ ...user, balance: newBalance });
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && window.location.pathname === '/auth/roblox/callback') {
      handleRobloxCallback(code);
    }
  }, []);

  return (
    <RobloxAuthContext.Provider value={{ user, loading, loginWithRoblox, logout, updateUserBalance }}>
      {children}
    </RobloxAuthContext.Provider>
  );
};

export const useRobloxAuth = () => {
  const context = useContext(RobloxAuthContext);
  if (context === undefined) {
    throw new Error('useRobloxAuth must be used within a RobloxAuthProvider');
  }
  return context;
};

// Utility functions
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// For development/demo purposes - simplified Roblox auth simulation
export const useSimplifiedRobloxAuth = () => {
  const [user, setUser] = useState<RobloxUser | null>(null);
  const [loading, setLoading] = useState(false);

  const loginWithRoblox = async () => {
    setLoading(true);
    
    // Simulate Roblox login with a prompt for demo purposes
    const robloxUsername = prompt('Enter your Roblox username for demo:');
    
    if (robloxUsername) {
      const mockUser: RobloxUser = {
        uid: `roblox_${Date.now()}`,
        robloxId: Math.floor(Math.random() * 1000000).toString(),
        robloxUsername,
        displayName: robloxUsername,
        avatar: `https://ui-avatars.com/api/?name=${robloxUsername}&background=00D2FF&color=fff`,
        balance: 0,
        createdAt: new Date()
      };

      // Save to localStorage for demo
      localStorage.setItem('robloxUser', JSON.stringify(mockUser));
      setUser(mockUser);
    }
    
    setLoading(false);
  };

  const loginWithRobloxUsername = async (username: string) => {
    setLoading(true);
    
    try {
      // Validate username
      if (!username || username.trim().length === 0) {
        throw new Error('Username cannot be empty');
      }
      
      // Check if username contains only valid characters (alphanumeric and underscore)
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }
      
      // Check username length (Roblox usernames are 3-20 characters)
      if (username.length < 3 || username.length > 20) {
        throw new Error('Username must be between 3 and 20 characters');
      }
      
      const mockUser: RobloxUser = {
        uid: `roblox_${Date.now()}`,
        robloxId: Math.floor(Math.random() * 1000000).toString(),
        robloxUsername: username,
        displayName: username,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=00D2FF&color=fff`,
        balance: 0,
        createdAt: new Date()
      };

      // Save to localStorage for demo
      localStorage.setItem('robloxUser', JSON.stringify(mockUser));
      setUser(mockUser);
      
      // Return success
      return mockUser;
    } catch (error) {
      console.error('[useSimplifiedRobloxAuth] Error during login:', error);
      setLoading(false);
      throw error;
    }
    
    setLoading(false);
  };

  const logout = async () => {
    localStorage.removeItem('robloxUser');
    setUser(null);
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!user) return;
    
    const updatedUser = { ...user, balance: newBalance };
    localStorage.setItem('robloxUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('robloxUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return { user, loading, loginWithRoblox, loginWithRobloxUsername, logout, updateUserBalance };
};