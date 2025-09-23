export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  permissions: string[];
  createdAt: Date;
  lastLogin: Date;
}

export interface SellRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  petData: {
    name: string;
    type: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'ultra-rare' | 'legendary';
    age: 'newborn' | 'junior' | 'pre-teen' | 'teen' | 'post-teen' | 'full-grown';
    price: number;
    flyRide?: {
      fly: boolean;
      ride: boolean;
    };
    neon?: boolean;
    mega?: boolean;
    description?: string;
    imageUrl: string;
  };
  custodyInfo: {
    custodyId: string;
    staffId: string;
    staffUsername: string;
    inCustody: boolean;
    custodyDate: Date;
  };
  status: 'pending' | 'in_custody' | 'verified' | 'rejected' | 'completed';
  requestedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  staffNotes?: string;
  creditAmount?: number;
  creditAddedAt?: Date;
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

export interface StaffAction {
  id: string;
  sellRequestId: string;
  staffId: string;
  staffName: string;
  action: 'verify' | 'reject' | 'add_credit' | 'add_note';
  details: string;
  timestamp: Date;
}
