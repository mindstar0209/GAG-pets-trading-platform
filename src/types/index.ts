export interface User {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  createdAt: Date;
  photoURL?: string;
}

// Simplified multi-Roblox account management
export interface RobloxAccount {
  id: string;
  robloxUserId: string;
  robloxUsername: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  isActive: boolean; // Whether this is the currently active account
  isFrozen: boolean; // Account frozen/unfrozen status
  linkedAt: Date;
  lastUsed: Date;
  cookie?: string; // Encrypted cookie if available
  verificationMethod: 'cookie' | 'username' | 'manual';
  permissions: {
    canTrade: boolean;
    canTeleport: boolean;
    canAccessInventory: boolean;
  };
}

export interface LinkedAccounts {
  accounts: RobloxAccount[];
  maxAccounts: number;
  totalAccounts: number;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra-rare' | 'legendary';
  price: number;
  age: 'newborn' | 'junior' | 'pre-teen' | 'teen' | 'post-teen' | 'full-grown';
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  listed: boolean;
  createdAt: Date;
  flyRide?: {
    fly: boolean;
    ride: boolean;
  };
  neon?: boolean;
  mega?: boolean;
  // New fields for sell request integration
  sellRequestId?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  sold?: boolean;
  soldAt?: Date;
  buyerId?: string;
  buyerName?: string;
  removedAt?: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  petId: string;
  petName: string;
  price: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale';
  amount: number;
  description: string;
  createdAt: Date;
  metadata?: any;
}