import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { SellRequest, Transaction, StaffAction } from '../types';

export class AdminService {
  /**
   * Get all sell requests
   */
  static async getSellRequests(): Promise<SellRequest[]> {
    try {
      const q = query(
        collection(db, 'sellRequests'),
        orderBy('requestedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        verifiedAt: doc.data().verifiedAt?.toDate(),
        custodyInfo: {
          ...doc.data().custodyInfo,
          custodyDate: doc.data().custodyInfo?.custodyDate?.toDate() || new Date(),
        },
        creditAddedAt: doc.data().creditAddedAt?.toDate(),
      })) as SellRequest[];
    } catch (error) {
      console.error('Error fetching sell requests:', error);
      throw error;
    }
  }

  /**
   * Update sell request status
   */
  static async updateSellRequestStatus(
    requestId: string,
    status: SellRequest['status'],
    staffId: string,
    staffName: string,
    rejectionReason?: string,
    staffNotes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'verified') {
        updateData.verifiedAt = serverTimestamp();
        updateData.verifiedBy = staffId;
      }

      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      if (staffNotes) {
        updateData.staffNotes = staffNotes;
      }

      await updateDoc(doc(db, 'sellRequests', requestId), updateData);

      // Log staff action
      await this.logStaffAction(requestId, staffId, staffName, 'verify', 
        status === 'verified' ? 'Pet verified and approved for marketplace' : 'Pet rejected');
    } catch (error) {
      console.error('Error updating sell request:', error);
      throw error;
    }
  }

  /**
   * Add credit to seller
   */
  static async addCreditToSeller(
    requestId: string,
    sellerId: string,
    creditAmount: number,
    staffId: string,
    staffName: string
  ): Promise<void> {
    try {
      // Update sell request
      await updateDoc(doc(db, 'sellRequests', requestId), {
        creditAmount,
        creditAddedAt: serverTimestamp(),
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Actually add credit to user's balance
      await updateDoc(doc(db, 'users', sellerId), {
        balance: increment(creditAmount)
      });

      // Record the sale transaction for the seller
      await addDoc(collection(db, 'transactions'), {
        userId: sellerId,
        type: 'sale',
        amount: creditAmount,
        description: `Pet sale credit added by staff`,
        petId: requestId, // Using requestId as petId for now
        petName: 'Pet Sale',
        buyerId: 'staff',
        buyerName: staffName,
        createdAt: serverTimestamp(),
      });

      // Log staff action
      await this.logStaffAction(requestId, staffId, staffName, 'add_credit', 
        `Added $${creditAmount.toFixed(2)} credit to seller account`);
    } catch (error) {
      console.error('Error adding credit to seller:', error);
      throw error;
    }
  }

  /**
   * Get all transactions
   */
  static async getTransactions(): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Get staff actions
   */
  static async getStaffActions(sellRequestId: string): Promise<StaffAction[]> {
    try {
      const q = query(
        collection(db, 'staffActions'),
        where('sellRequestId', '==', sellRequestId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as StaffAction[];
    } catch (error) {
      console.error('Error fetching staff actions:', error);
      throw error;
    }
  }

  /**
   * Log staff action
   */
  static async logStaffAction(
    sellRequestId: string,
    staffId: string,
    staffName: string,
    action: StaffAction['action'],
    details: string
  ): Promise<void> {
    try {
      const staffAction: Omit<StaffAction, 'id'> = {
        sellRequestId,
        staffId,
        staffName,
        action,
        details,
        timestamp: new Date(),
      };

      await addDoc(collection(db, 'staffActions'), {
        ...staffAction,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging staff action:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    totalSellRequests: number;
    pendingRequests: number;
    verifiedRequests: number;
    totalTransactions: number;
    totalRevenue: number;
  }> {
    try {
      const [sellRequests, transactions] = await Promise.all([
        this.getSellRequests(),
        this.getTransactions()
      ]);

      const pendingRequests = sellRequests.filter(r => r.status === 'pending').length;
      const verifiedRequests = sellRequests.filter(r => r.status === 'verified').length;
      
      const totalRevenue = transactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalSellRequests: sellRequests.length,
        pendingRequests,
        verifiedRequests,
        totalTransactions: transactions.length,
        totalRevenue,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}
