import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SellRequest, StaffAction } from '../types/sellRequest';
import { MarketplaceService } from './marketplaceService';
import { TransactionService } from './transactionService';

export class SellRequestService {
  /**
   * Create a new sell request
   */
  static async createSellRequest(
    sellerId: string,
    sellerName: string,
    sellerEmail: string,
    petData: SellRequest['petData'],
    custodyInfo: SellRequest['custodyInfo']
  ): Promise<string> {
    try {
      const sellRequest: Omit<SellRequest, 'id'> = {
        sellerId,
        sellerName,
        sellerEmail,
        petData,
        custodyInfo,
        status: 'pending',
        requestedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'sellRequests'), {
        ...sellRequest,
        requestedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating sell request:', error);
      throw error;
    }
  }

  /**
   * Get all sell requests for staff dashboard
   */
  static async getAllSellRequests(): Promise<SellRequest[]> {
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
   * Get sell requests by seller ID
   */
  static async getSellRequestsBySeller(sellerId: string): Promise<SellRequest[]> {
    try {
      const q = query(
        collection(db, 'sellRequests'),
        where('sellerId', '==', sellerId),
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
      console.error('Error fetching seller requests:', error);
      throw error;
    }
  }

  /**
   * Update sell request status
   */
  static async updateSellRequestStatus(
    requestId: string,
    status: SellRequest['status'],
    staffId?: string,
    staffName?: string,
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

      // If verified, add pet to marketplace
      if (status === 'verified') {
        try {
          // Get the sell request data
          const sellRequest = await this.getSellRequestById(requestId);
          if (sellRequest) {
            await MarketplaceService.addPetToMarketplace(sellRequest);
          }
        } catch (error) {
          console.error('Error adding pet to marketplace:', error);
          // Don't throw here, as the verification was successful
        }
      }

      // Log staff action
      if (staffId && staffName) {
        await this.logStaffAction(requestId, staffId, staffName, 'verify', 
          status === 'verified' ? 'Pet verified and approved for marketplace' : 'Pet rejected');
      }
    } catch (error) {
      console.error('Error updating sell request:', error);
      throw error;
    }
  }

  /**
   * Get sell request by ID
   */
  static async getSellRequestById(requestId: string): Promise<SellRequest | null> {
    try {
      const q = query(
        collection(db, 'sellRequests'),
        where('__name__', '==', requestId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        verifiedAt: doc.data().verifiedAt?.toDate(),
        custodyInfo: {
          ...doc.data().custodyInfo,
          custodyDate: doc.data().custodyInfo?.custodyDate?.toDate() || new Date(),
        },
        creditAddedAt: doc.data().creditAddedAt?.toDate(),
      } as SellRequest;
    } catch (error) {
      console.error('Error fetching sell request:', error);
      return null;
    }
  }

  /**
   * Add credit to seller account
   */
  static async addCreditToSeller(
    requestId: string,
    sellerId: string,
    creditAmount: number,
    staffId: string,
    staffName: string
  ): Promise<void> {
    try {
      // Get sell request data for transaction recording
      const sellRequest = await this.getSellRequestById(requestId);
      
      // Update sell request with credit information
      await updateDoc(doc(db, 'sellRequests', requestId), {
        creditAmount,
        creditAddedAt: serverTimestamp(),
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Record sale transaction
      if (sellRequest) {
        await TransactionService.recordSale(
          sellerId,
          requestId, // Using requestId as petId for now
          sellRequest.petData.name,
          sellRequest.petData.price,
          'system', // System as buyer since it's going to marketplace
          'Marketplace',
          creditAmount
        );
      }

      // Log staff action
      await this.logStaffAction(requestId, staffId, staffName, 'add_credit', 
        `Added $${creditAmount.toFixed(2)} credit to seller account`);

      // Note: In a real implementation, you would also update the user's balance here
      // This would require calling the user service to update their balance
    } catch (error) {
      console.error('Error adding credit to seller:', error);
      throw error;
    }
  }

  /**
   * Log staff actions for audit trail
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
   * Get staff actions for a sell request
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
}
