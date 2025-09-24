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
import { RobloxCookieAuthService } from "../services/robloxCookieAuth";
import { RobloxAccount, LinkedAccounts } from "../types";

interface AppUser {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  balance: number;
  createdAt: Date;
  lastLogin: Date;
  // Multi-account management
  linkedAccounts?: LinkedAccounts;
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
  // Roblox account linking methods
  linkRobloxAccount: (robloxUsername: string) => Promise<void>;
  linkRobloxAccountWithCookie: (cookie: string) => Promise<void>;
  verifyRobloxAccount: () => Promise<void>;
  // Multi-account management methods
  addRobloxAccount: (
    accountData: Omit<RobloxAccount, "id" | "linkedAt" | "lastUsed">
  ) => Promise<RobloxAccount>;
  removeRobloxAccount: (accountId: string) => Promise<void>;
  setActiveAccount: (accountId: string) => Promise<void>;
  freezeAccount: (accountId: string) => Promise<void>;
  unfreezeAccount: (accountId: string) => Promise<void>;
  updateAccountPermissions: (
    accountId: string,
    permissions: Partial<RobloxAccount["permissions"]>
  ) => Promise<void>;
  getActiveAccount: () => RobloxAccount | null;
  getAllAccounts: () => RobloxAccount[];
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

              // Check if we need to migrate legacy Roblox account to multi-account system
              const needsMigration =
                userData.robloxUsername && !userData.linkedAccounts;

              if (needsMigration) {
                // Migrating legacy Roblox account to multi-account system

                // Create account data for migration
                const accountData: Omit<
                  RobloxAccount,
                  "id" | "linkedAt" | "lastUsed"
                > = {
                  robloxUserId: userData.robloxUserId?.toString() || "",
                  robloxUsername: userData.robloxUsername || "",
                  displayName:
                    userData.displayName || userData.robloxUsername || "",
                  avatarUrl: userData.robloxAvatar || "",
                  isVerified: userData.isRobloxVerified || false,
                  isActive: true,
                  isFrozen: false,
                  cookie: userData.robloxCookie,
                  verificationMethod: userData.robloxCookie
                    ? "cookie"
                    : "username",
                  permissions: {
                    canTrade: true,
                    canTeleport: true,
                    canAccessInventory: !!userData.robloxCookie,
                  },
                };

                // Create linked accounts structure
                const primaryAccount: RobloxAccount = {
                  ...accountData,
                  id: `roblox_${userData.robloxUserId || Date.now()}_migrated`,
                  linkedAt: new Date(),
                  lastUsed: new Date(),
                };

                const linkedAccounts: LinkedAccounts = {
                  accounts: [primaryAccount],
                  maxAccounts: 5,
                  totalAccounts: 1,
                };

                // Update Firestore with migrated data
                await setDoc(
                  doc(db, "users", firebaseUser.uid),
                  {
                    linkedAccounts,
                  },
                  { merge: true }
                );

                // Update userData with migrated data
                userData.linkedAccounts = linkedAccounts;
              }

              setUser({
                uid: firebaseUser.uid,
                username: userData.username,
                email: userData.email,
                displayName: userData.displayName || userData.username,
                avatar: userData.avatar,
                balance: userData.balance || 0,
                createdAt: userData.createdAt?.toDate() || new Date(),
                lastLogin: userData.lastLogin?.toDate() || new Date(),
                linkedAccounts: userData.linkedAccounts,
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

      // Get Roblox user data from API
      const response = await fetch("/api/auth/roblox/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: robloxUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to validate Roblox username"
        );
      }

      const robloxData = await response.json();

      // Create account data for multi-account system
      const accountData: Omit<RobloxAccount, "id" | "linkedAt" | "lastUsed"> = {
        robloxUserId: robloxData.robloxId,
        robloxUsername: robloxData.robloxUsername,
        displayName: robloxData.displayName || robloxData.robloxUsername,
        avatarUrl: robloxData.avatarUrl,
        isVerified: false, // Must verify through status
        isActive: true, // Set as active since it's the first account
        isFrozen: false,
        verificationMethod: "username",
        permissions: {
          canTrade: true,
          canTeleport: true,
          canAccessInventory: false, // No inventory access without cookie
        },
      };

      // Add to multi-account system
      await addRobloxAccount(accountData);
    } catch (error: any) {
      console.error("Error linking Roblox account:", error);
      throw error;
    }
  };

  const linkRobloxAccountWithCookie = async (cookie: string) => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      // Validate cookie format
      const cookieValidation =
        RobloxCookieAuthService.validateCookieFormat(cookie);
      if (!cookieValidation.valid) {
        throw new Error(cookieValidation.error || "Invalid cookie format");
      }

      // Extract and validate the cookie with Roblox
      const profileData =
        await RobloxCookieAuthService.validateCookieAndGetProfile(cookie);

      if (!profileData.success) {
        throw new Error(
          profileData.error || "Failed to validate Roblox cookie"
        );
      }

      // Encrypt cookie for storage (in production, use proper encryption)
      const encryptedCookie = btoa(cookie); // Simple base64 encoding for demo

      // Create account data for multi-account system
      const accountData: Omit<RobloxAccount, "id" | "linkedAt" | "lastUsed"> = {
        robloxUserId: profileData.userid?.toString() || "",
        robloxUsername: profileData.username || "",
        displayName: profileData.display_name || profileData.username || "",
        avatarUrl: profileData.user_avatar_picture || "",
        isVerified: true, // Cookie validation means verified
        isActive: true, // Set as active since it's the first account
        isFrozen: false,
        cookie: encryptedCookie,
        verificationMethod: "cookie",
        permissions: {
          canTrade: true,
          canTeleport: true,
          canAccessInventory: true, // Full access with cookie
        },
      };

      // Add to multi-account system
      await addRobloxAccount(accountData);
    } catch (error: any) {
      console.error("Error linking Roblox account with cookie:", error);
      throw error;
    }
  };

  const verifyRobloxAccount = async () => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      // Update the multi-account system if there are linked accounts
      if (
        user.linkedAccounts?.accounts &&
        user.linkedAccounts.accounts.length > 0
      ) {
        const updatedAccounts = user.linkedAccounts.accounts.map((account) => ({
          ...account,
          isVerified: true,
        }));

        const updatedLinkedAccounts: LinkedAccounts = {
          accounts: updatedAccounts,
          maxAccounts: user.linkedAccounts.maxAccounts,
          totalAccounts: user.linkedAccounts.totalAccounts,
        };

        await setDoc(
          doc(db, "users", firebaseUser.uid),
          {
            linkedAccounts: updatedLinkedAccounts,
          },
          { merge: true }
        );

        setUser({
          ...user,
          linkedAccounts: updatedLinkedAccounts,
        });
      }
    } catch (error: any) {
      console.error("Error verifying Roblox account:", error);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Multi-account management methods
  const addRobloxAccount = async (
    accountData: Omit<RobloxAccount, "id" | "linkedAt" | "lastUsed">
  ): Promise<RobloxAccount> => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      const accountId = `roblox_${accountData.robloxUserId}_${Date.now()}`;
      const now = new Date();

      const newAccount: RobloxAccount = {
        ...accountData,
        id: accountId,
        linkedAt: now,
        lastUsed: now,
      };

      // If this is the first account, set it as active
      if (
        !user.linkedAccounts?.accounts ||
        user.linkedAccounts.accounts.length === 0
      ) {
        newAccount.isActive = true;
      } else {
        // If there are existing accounts, set all others as inactive
        newAccount.isActive = false;
      }

      // Add account to user's linked accounts
      const existingAccounts = user.linkedAccounts?.accounts || [];
      const updatedAccounts = existingAccounts.map((account) => ({
        ...account,
        isActive: false, // Set all existing accounts as inactive
      }));

      const updatedLinkedAccounts: LinkedAccounts = {
        accounts: [...updatedAccounts, newAccount],
        maxAccounts: 5, // Default max accounts
        totalAccounts: (user.linkedAccounts?.totalAccounts || 0) + 1,
      };

      // Update Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          linkedAccounts: updatedLinkedAccounts,
        },
        { merge: true }
      );

      // Update local state
      setUser({
        ...user,
        linkedAccounts: updatedLinkedAccounts,
      });

      return newAccount;
    } catch (error: any) {
      console.error("Error adding Roblox account:", error);
      throw error;
    }
  };

  const removeRobloxAccount = async (accountId: string): Promise<void> => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      const existingAccounts = user.linkedAccounts?.accounts || [];
      const updatedAccounts = existingAccounts.filter(
        (account: RobloxAccount) => account.id !== accountId
      );

      // If we removed the active account and there are other accounts, set the first one as active
      if (updatedAccounts.length > 0) {
        const wasActiveRemoved = existingAccounts.find(
          (account: RobloxAccount) => account.id === accountId
        )?.isActive;

        if (wasActiveRemoved) {
          updatedAccounts[0].isActive = true;
        }
      }

      const updatedLinkedAccounts: LinkedAccounts = {
        accounts: updatedAccounts,
        maxAccounts: user.linkedAccounts?.maxAccounts || 5,
        totalAccounts: (user.linkedAccounts?.totalAccounts || 1) - 1,
      };

      // Update Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          linkedAccounts: updatedLinkedAccounts,
        },
        { merge: true }
      );

      // Update local state
      setUser({
        ...user,
        linkedAccounts: updatedLinkedAccounts,
      });
    } catch (error: any) {
      console.error("Error removing Roblox account:", error);
      throw error;
    }
  };

  const setActiveAccount = async (accountId: string): Promise<void> => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      const existingAccounts = user.linkedAccounts?.accounts || [];
      const updatedAccounts = existingAccounts.map(
        (account: RobloxAccount) => ({
          ...account,
          isActive: account.id === accountId,
        })
      );

      const updatedLinkedAccounts: LinkedAccounts = {
        accounts: updatedAccounts,
        maxAccounts: user.linkedAccounts?.maxAccounts || 5,
        totalAccounts: user.linkedAccounts?.totalAccounts || 0,
      };

      // Update Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          linkedAccounts: updatedLinkedAccounts,
        },
        { merge: true }
      );

      // Update local state
      setUser({
        ...user,
        linkedAccounts: updatedLinkedAccounts,
      });
    } catch (error: any) {
      console.error("Error setting active account:", error);
      throw error;
    }
  };

  const freezeAccount = async (accountId: string): Promise<void> => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      const existingAccounts = user.linkedAccounts?.accounts || [];
      const updatedAccounts = existingAccounts.map(
        (account: RobloxAccount) => ({
          ...account,
          isFrozen: account.id === accountId ? true : account.isFrozen,
        })
      );

      const updatedLinkedAccounts: LinkedAccounts = {
        accounts: updatedAccounts,
        maxAccounts: user.linkedAccounts?.maxAccounts || 5,
        totalAccounts: user.linkedAccounts?.totalAccounts || 0,
      };

      // Update Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          linkedAccounts: updatedLinkedAccounts,
        },
        { merge: true }
      );

      // Update local state
      setUser({
        ...user,
        linkedAccounts: updatedLinkedAccounts,
      });
    } catch (error: any) {
      console.error("Error freezing account:", error);
      throw error;
    }
  };

  const unfreezeAccount = async (accountId: string): Promise<void> => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      const existingAccounts = user.linkedAccounts?.accounts || [];
      const updatedAccounts = existingAccounts.map(
        (account: RobloxAccount) => ({
          ...account,
          isFrozen: account.id === accountId ? false : account.isFrozen,
        })
      );

      const updatedLinkedAccounts: LinkedAccounts = {
        accounts: updatedAccounts,
        maxAccounts: user.linkedAccounts?.maxAccounts || 5,
        totalAccounts: user.linkedAccounts?.totalAccounts || 0,
      };

      // Update Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          linkedAccounts: updatedLinkedAccounts,
        },
        { merge: true }
      );

      // Update local state
      setUser({
        ...user,
        linkedAccounts: updatedLinkedAccounts,
      });
    } catch (error: any) {
      console.error("Error unfreezing account:", error);
      throw error;
    }
  };

  const updateAccountPermissions = async (
    accountId: string,
    permissions: Partial<RobloxAccount["permissions"]>
  ): Promise<void> => {
    if (!user || !firebaseUser) throw new Error("Not authenticated");

    try {
      const existingAccounts = user.linkedAccounts?.accounts || [];
      const updatedAccounts = existingAccounts.map(
        (account: RobloxAccount) => ({
          ...account,
          permissions:
            account.id === accountId
              ? { ...account.permissions, ...permissions }
              : account.permissions,
        })
      );

      const updatedLinkedAccounts: LinkedAccounts = {
        accounts: updatedAccounts,
        maxAccounts: user.linkedAccounts?.maxAccounts || 5,
        totalAccounts: user.linkedAccounts?.totalAccounts || 0,
      };

      // Update Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          linkedAccounts: updatedLinkedAccounts,
        },
        { merge: true }
      );

      // Update local state
      setUser({
        ...user,
        linkedAccounts: updatedLinkedAccounts,
      });
    } catch (error: any) {
      console.error("Error updating account permissions:", error);
      throw error;
    }
  };

  const getActiveAccount = (): RobloxAccount | null => {
    if (!user?.linkedAccounts?.accounts) return null;

    return (
      user.linkedAccounts.accounts.find((account) => account.isActive) || null
    );
  };

  const getAllAccounts = (): RobloxAccount[] => {
    if (!user?.linkedAccounts?.accounts) return [];

    return user.linkedAccounts.accounts;
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
        linkRobloxAccountWithCookie,
        verifyRobloxAccount,
        addRobloxAccount,
        removeRobloxAccount,
        setActiveAccount,
        freezeAccount,
        unfreezeAccount,
        updateAccountPermissions,
        getActiveAccount,
        getAllAccounts,
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
