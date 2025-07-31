import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

interface AppUser {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  balance: number;
  createdAt: Date;
  lastLogin: Date;
  robloxUsername?: string; // Optional Roblox username for teleportation
  isRobloxVerified?: boolean; // Whether they've verified their Roblox account
}

interface TraditionalAuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<AppUser>;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  updateUserBalance: (newBalance: number) => Promise<void>;
  linkRobloxAccount: (robloxUsername: string) => Promise<void>;
  clearError: () => void;
}

const TraditionalAuthContext = createContext<
  TraditionalAuthContextType | undefined
>(undefined);

export const TraditionalAuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        setFirebaseUser(firebaseUser);

        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                username: userData.username,
                email: userData.email,
                displayName: userData.displayName || userData.username,
                avatar: userData.avatar,
                balance: userData.balance || 0,
                createdAt: userData.createdAt?.toDate() || new Date(),
                lastLogin: userData.lastLogin?.toDate() || new Date(),
                robloxUsername: userData.robloxUsername,
                isRobloxVerified: userData.isRobloxVerified || false,
              });
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setError("Failed to load user data");
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const register = async (
    username: string,
    email: string,
    password: string
  ): Promise<AppUser> => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!username || username.trim().length < 3) {
        throw new Error("Username must be at least 3 characters long");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error(
          "Username can only contain letters, numbers, and underscores"
        );
      }

      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Check if username is already taken
      // Note: In a real app, you'd want to check this server-side

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update Firebase profile
      await updateProfile(userCredential.user, {
        displayName: username,
      });

      // Create user document in Firestore
      const userData = {
        username,
        email,
        displayName: username,
        balance: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isRobloxVerified: false,
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      const newUser: AppUser = {
        uid: userCredential.user.uid,
        username,
        email,
        displayName: username,
        balance: 0,
        createdAt: new Date(),
        lastLogin: new Date(),
        isRobloxVerified: false,
      };

      setUser(newUser);
      return newUser;
    } catch (error: any) {
      console.error("Error during registration:", error);
      let errorMessage = "Registration failed";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AppUser> => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update last login
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );

      // User data will be loaded by the auth state listener
      // Return a placeholder for now
      return {} as AppUser;
    } catch (error: any) {
      console.error("Error during login:", error);
      let errorMessage = "Login failed";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setError(null);
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!user || !firebaseUser) return;

    await setDoc(
      doc(db, "users", user.uid),
      { balance: newBalance },
      { merge: true }
    );
    setUser({ ...user, balance: newBalance });
  };

  const linkRobloxAccount = async (robloxUsername: string) => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      // Validate Roblox username format
      if (!robloxUsername || !/^[a-zA-Z0-9_]+$/.test(robloxUsername)) {
        throw new Error("Invalid Roblox username format");
      }

      // Update user document with Roblox username
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          robloxUsername,
          isRobloxVerified: false, // Will need to verify ownership
        },
        { merge: true }
      );

      setUser({
        ...user,
        robloxUsername,
        isRobloxVerified: false,
      });
    } catch (error: any) {
      console.error("Error linking Roblox account:", error);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <TraditionalAuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        register,
        login,
        logout,
        updateUserBalance,
        linkRobloxAccount,
        clearError,
      }}
    >
      {children}
    </TraditionalAuthContext.Provider>
  );
};

export const useTraditionalAuth = () => {
  const context = useContext(TraditionalAuthContext);
  if (context === undefined) {
    throw new Error(
      "useTraditionalAuth must be used within a TraditionalAuthProvider"
    );
  }
  return context;
};
