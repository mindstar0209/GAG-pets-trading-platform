import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Pet } from '../types';
import { SellRequest } from '../types/sellRequest';

export class MarketplaceService {
  /**
   * Add verified pet to marketplace
   */
  static async addPetToMarketplace(sellRequest: SellRequest): Promise<string> {
    try {
      const petData: Omit<Pet, 'id'> = {
        name: sellRequest.petData.name,
        type: sellRequest.petData.type,
        rarity: sellRequest.petData.rarity,
        age: sellRequest.petData.age,
        price: sellRequest.petData.price,
        imageUrl: sellRequest.petData.imageUrl,
        sellerId: sellRequest.sellerId,
        sellerName: sellRequest.sellerName,
        listed: true,
        createdAt: new Date(),
        flyRide: sellRequest.petData.flyRide,
        neon: sellRequest.petData.neon,
        mega: sellRequest.petData.mega,
        // Add metadata about the sell request
        sellRequestId: sellRequest.id,
        verifiedAt: new Date(),
        verifiedBy: sellRequest.verifiedBy,
      };

      const docRef = await addDoc(collection(db, 'pets'), {
        ...petData,
        createdAt: new Date(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding pet to marketplace:', error);
      throw error;
    }
  }

  /**
   * Get all pets in marketplace
   */
  static async getMarketplacePets(): Promise<Pet[]> {
    try {
      const q = query(
        collection(db, 'pets'),
        where('listed', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Pet[];
    } catch (error) {
      console.error('Error fetching marketplace pets:', error);
      throw error;
    }
  }

  /**
   * Get pets by seller
   */
  static async getPetsBySeller(sellerId: string): Promise<Pet[]> {
    try {
      const q = query(
        collection(db, 'pets'),
        where('sellerId', '==', sellerId),
        where('listed', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Pet[];
    } catch (error) {
      console.error('Error fetching seller pets:', error);
      throw error;
    }
  }

  /**
   * Remove pet from marketplace
   */
  static async removePetFromMarketplace(petId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'pets', petId), {
        listed: false,
        removedAt: new Date(),
      });
    } catch (error) {
      console.error('Error removing pet from marketplace:', error);
      throw error;
    }
  }

  /**
   * Mark pet as sold
   */
  static async markPetAsSold(petId: string, buyerId: string, buyerName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'pets', petId), {
        listed: false,
        sold: true,
        soldAt: new Date(),
        buyerId,
        buyerName,
      });
    } catch (error) {
      console.error('Error marking pet as sold:', error);
      throw error;
    }
  }
}
