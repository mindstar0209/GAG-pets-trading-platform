import { collection, addDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Transaction } from '../types';

export class TransactionService {
  /**
   * Create a new transaction
   */
  static async createTransaction(
    userId: string,
    type: Transaction['type'],
    amount: number,
    description: string,
    metadata?: any
  ): Promise<string> {
    try {
      const transaction: Omit<Transaction, 'id'> = {
        userId,
        type,
        amount,
        description,
        createdAt: new Date(),
        metadata,
      };

      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Get user transactions
   */
  static async getUserTransactions(userId: string, limitCount: number = 50): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Transaction[];

      // Client-side sorting by createdAt (newest first)
      transactions.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  }

  /**
   * Record a purchase transaction
   */
  static async recordPurchase(
    buyerId: string,
    petId: string,
    petName: string,
    price: number,
    sellerId: string,
    sellerName: string
  ): Promise<string> {
    try {
      const transactionId = await this.createTransaction(
        buyerId,
        'purchase',
        price,
        `Purchased ${petName} from ${sellerName}`,
        {
          petId,
          petName,
          sellerId,
          sellerName,
        }
      );

      return transactionId;
    } catch (error) {
      console.error('Error recording purchase:', error);
      throw error;
    }
  }

  /**
   * Record a sale transaction
   */
  static async recordSale(
    sellerId: string,
    petId: string,
    petName: string,
    price: number,
    buyerId: string,
    buyerName: string,
    creditAmount: number
  ): Promise<string> {
    try {
      const transactionId = await this.createTransaction(
        sellerId,
        'sale',
        creditAmount,
        `Sold ${petName} to ${buyerName} (Credit: $${creditAmount.toFixed(2)})`,
        {
          petId,
          petName,
          buyerId,
          buyerName,
          originalPrice: price,
          creditAmount,
        }
      );

      return transactionId;
    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  }

  /**
   * Record a deposit transaction
   */
  static async recordDeposit(
    userId: string,
    amount: number,
    method: string = 'manual'
  ): Promise<string> {
    try {
      const transactionId = await this.createTransaction(
        userId,
        'deposit',
        amount,
        `Deposit via ${method}`,
        { method }
      );

      return transactionId;
    } catch (error) {
      console.error('Error recording deposit:', error);
      throw error;
    }
  }

  /**
   * Record a withdrawal transaction
   */
  static async recordWithdrawal(
    userId: string,
    amount: number,
    method: string = 'manual'
  ): Promise<string> {
    try {
      const transactionId = await this.createTransaction(
        userId,
        'withdrawal',
        amount,
        `Withdrawal via ${method}`,
        { method }
      );

      return transactionId;
    } catch (error) {
      console.error('Error recording withdrawal:', error);
      throw error;
    }
  }

  /**
   * Get user spending summary
   */
  static async getUserSpendingSummary(userId: string): Promise<{
    totalSpent: number;
    totalEarned: number;
    totalDeposits: number;
    totalWithdrawals: number;
    transactionCount: number;
  }> {
    try {
      const transactions = await this.getUserTransactions(userId, 1000);
      
      const summary = transactions.reduce((acc, transaction) => {
        acc.transactionCount++;
        
        switch (transaction.type) {
          case 'purchase':
            acc.totalSpent += transaction.amount;
            break;
          case 'sale':
            acc.totalEarned += transaction.amount;
            break;
          case 'deposit':
            acc.totalDeposits += transaction.amount;
            break;
          case 'withdrawal':
            acc.totalWithdrawals += transaction.amount;
            break;
        }
        
        return acc;
      }, {
        totalSpent: 0,
        totalEarned: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        transactionCount: 0,
      });

      return summary;
    } catch (error) {
      console.error('Error calculating spending summary:', error);
      throw error;
    }
  }
}
