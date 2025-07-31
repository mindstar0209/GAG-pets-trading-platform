export interface User {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  createdAt: Date;
  photoURL?: string;
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
}