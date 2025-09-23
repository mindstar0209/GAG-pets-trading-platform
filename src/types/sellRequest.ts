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
  soldAt?: Date;
  removedAt?: Date;
  rejectionReason?: string;
  staffNotes?: string;
  creditAmount?: number;
  creditAddedAt?: Date;
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
