import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface RobloxUser {
  uid: string;
  robloxId: string;
  robloxUsername: string;
  displayName: string;
  avatar: string;
  balance: number;
  createdAt: Date;
  lastLogin: Date;
  isVerified: boolean;
}

interface RobloxAuthContextType {
  user: RobloxUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  loginWithRobloxUsername: (username: string) => Promise<RobloxUser>;
  verifyRobloxAccount: (verificationCode: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserBalance: (newBalance: number) => Promise<void>;
}

const RobloxAuthContext = createContext<RobloxAuthContextType | undefined>(undefined);

export const RobloxAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RobloxUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
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
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLogin: userData.lastLogin?.toDate() || new Date(),
              isVerified: userData.isVerified || false
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Failed to load user data');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithRobloxUsername = async (username: string): Promise<RobloxUser> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate username format
      if (!username || username.trim().length === 0) {
        throw new Error('Username cannot be empty');
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }
      
      if (username.length < 3 || username.length > 20) {
        throw new Error('Username must be between 3 and 20 characters');
      }

      // Call backend API to verify Roblox username exists and get user data
      const response = await fetch('/api/auth/roblox/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authenticate with Roblox');
      }

      const { robloxId, robloxUsername, displayName, avatarUrl } = await response.json();

      // Check if this Roblox account already has a Firebase account
      // We'll use a deterministic approach based on Roblox ID
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');
      
      // Create a consistent email and secure password for this Roblox user
      const userEmail = `roblox_${robloxId}@starpets.internal`;
      const securePassword = `SP_${robloxId}_${robloxUsername.toLowerCase()}_2024!`;
      
      let userCredential;
      try {
        // Try to sign in with existing account
        userCredential = await signInWithEmailAndPassword(auth, userEmail, securePassword);
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
          // Account doesn't exist, create it
          userCredential = await createUserWithEmailAndPassword(auth, userEmail, securePassword);
        } else {
          throw signInError;
        }
      }
      
      // Create/update user document in Firestore
      const userData = {
        robloxId,
        robloxUsername,
        displayName: displayName || robloxUsername,
        avatar: avatarUrl || `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=png`,
        balance: 0,
        lastLogin: serverTimestamp(),
        isVerified: false, // Must verify ownership through Roblox status
        accountSecured: false // Will be true after first verification
      };

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        // New user - set createdAt
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          ...userData,
          createdAt: serverTimestamp()
        });
      } else {
        // Existing user - update without overwriting createdAt and accountSecured
        const existingData = userDoc.data();
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          ...userData,
          accountSecured: existingData.accountSecured || false
        }, { merge: true });
      }

      const newUser: RobloxUser = {
        uid: userCredential.user.uid,
        ...userData,
        createdAt: userDoc.exists() ? userDoc.data()?.createdAt?.toDate() || new Date() : new Date(),
        lastLogin: new Date(),
        isVerified: userDoc.exists() ? userDoc.data()?.isVerified || false : false
      };

      setUser(newUser);
      return newUser;
      
    } catch (error: any) {
      console.error('Error during Roblox authentication:', error);
      setError(error.message || 'Failed to authenticate');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyRobloxAccount = async (verificationCode: string) => {
    if (!firebaseUser || !user) throw new Error('Not authenticated');
    
    try {
      // Call backend API for verification
      const response = await fetch('/api/auth/roblox/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
        },
        body: JSON.stringify({ verificationCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      // Update user verification status
      await setDoc(doc(db, 'users', firebaseUser.uid), { isVerified: true }, { merge: true });
      
      setUser({ ...user, isVerified: true });
    } catch (error: any) {
      console.error('Error verifying Roblox account:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!user || !firebaseUser) return;
    
    await setDoc(doc(db, 'users', user.uid), { balance: newBalance }, { merge: true });
    setUser({ ...user, balance: newBalance });
  };

  return (
    <RobloxAuthContext.Provider value={{ 
      user, 
      firebaseUser,
      loading, 
      error,
      loginWithRobloxUsername, 
      verifyRobloxAccount,
      logout, 
      updateUserBalance 
    }}>
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