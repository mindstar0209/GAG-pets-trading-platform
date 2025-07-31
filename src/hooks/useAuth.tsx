import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserBalance: (newBalance: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || undefined,
              ...userDoc.data()
            } as User);
          } else {
            // If user document doesn't exist, create it
            const userData: Omit<User, 'uid'> = {
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              balance: 0,
              createdAt: new Date()
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || undefined,
              balance: 0,
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback: set user with basic Firebase data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            balance: 0,
            createdAt: new Date()
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(firebaseUser, { displayName });
    
    const userData: Omit<User, 'uid'> = {
      email,
      displayName,
      balance: 0,
      createdAt: new Date()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!user) return;
    
    await setDoc(doc(db, 'users', user.uid), { balance: newBalance }, { merge: true });
    setUser({ ...user, balance: newBalance });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};