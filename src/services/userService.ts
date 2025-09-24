import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

export class UserService {
  /**
   * Add credit to user's balance
   */
  static async addCredit(userId: string, amount: number): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        balance: increment(amount)
      });
    } catch (error) {
      console.error('Error adding credit to user:', error);
      throw error;
    }
  }

  /**
   * Deduct amount from user's balance
   */
  static async deductBalance(userId: string, amount: number): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        balance: increment(-amount)
      });
    } catch (error) {
      console.error('Error deducting balance from user:', error);
      throw error;
    }
  }

  /**
   * Get user's current balance
   */
  static async getUserBalance(userId: string): Promise<number> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      return userData.balance || 0;
    } catch (error) {
      console.error('Error getting user balance:', error);
      throw error;
    }
  }
}
