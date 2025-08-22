import { RobloxCookieAuthService } from './robloxCookieAuth';
import axios from "axios";

interface RobloxInventoryItem {
  id: number;
  name: string;
  type: string;
  imageUrl?: string;
  rarity?: string;
  value?: number;
  serialNumber?: number;
  created?: string;
}

interface InventoryResponse {
  success: boolean;
  items?: RobloxInventoryItem[];
  error?: string;
  totalItems?: number;
}

export class RobloxInventoryService {
  /**
   * Get user's Roblox inventory items
   */
  static async getUserInventory(
    encryptedCookie: string,
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<InventoryResponse> {
    try {
      // Decrypt cookie (in production, use proper encryption)
      const cookie = atob(encryptedCookie);
      
      // Validate cookie is still valid
      const validation = await RobloxCookieAuthService.validateCookieAndGetProfile(cookie);
      if (!validation.success) {
        return {
          success: false,
          error: "Cookie has expired. Please re-link your Roblox account."
        };
      }

      // Fetch inventory items
      const items = await RobloxCookieAuthService.getUserInventory(cookie, userId, limit);
      
      return {
        success: true,
        items,
        totalItems: items.length
      };

    } catch (error: any) {
      console.error("Error fetching user inventory:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch inventory"
      };
    }
  }

  /**
   * Get specific item details
   */
  static async getItemDetails(
    encryptedCookie: string,
    itemId: number
  ): Promise<{ success: boolean; item?: any; error?: string }> {
    try {
      const cookie = atob(encryptedCookie);
      
      const response = await fetch(`https://economy.roblox.com/v1/assets/${itemId}/details`, {
        method: "GET",
        headers: {
          "Cookie": cookie,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch item details: ${response.status}`);
      }

      const itemData = await response.json();
      
      return {
        success: true,
        item: itemData
      };

    } catch (error: any) {
      console.error("Error fetching item details:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch item details"
      };
    }
  }

  /**
   * Get user's collectibles (pets, etc.)
   */
  static async getUserCollectibles(
    encryptedCookie: string,
    userId: number
  ): Promise<InventoryResponse> {
    try {
      const cookie = atob(encryptedCookie);
      
      const response = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/items/List/Collectibles/100/0`,
        {
          method: "GET",
          headers: {
            "Cookie": cookie,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch collectibles: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        return {
          success: true,
          items: [],
          totalItems: 0
        };
      }

      const collectibles = data.data
        .filter((item: any) => item.assetType === "Collectible")
        .map((item: any) => ({
          id: item.assetId,
          name: item.name,
          type: item.assetType,
          imageUrl: item.imageUrl,
          rarity: item.rarity,
          value: item.recentAveragePrice || 0,
          serialNumber: item.serialNumber,
          created: item.created
        }));

      return {
        success: true,
        items: collectibles,
        totalItems: collectibles.length
      };

    } catch (error: any) {
      console.error("Error fetching collectibles:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch collectibles"
      };
    }
  }

  /**
   * Get user's limited items
   */
  static async getUserLimitedItems(
    encryptedCookie: string,
    userId: number
  ): Promise<InventoryResponse> {
    try {
      const cookie = atob(encryptedCookie);
      
      const response = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/items/List/Limited/100/0`,
        {
          method: "GET",
          headers: {
            "Cookie": cookie,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch limited items: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        return {
          success: true,
          items: [],
          totalItems: 0
        };
      }

      const limitedItems = data.data.map((item: any) => ({
        id: item.assetId,
        name: item.name,
        type: item.assetType,
        imageUrl: item.imageUrl,
        rarity: item.rarity,
        value: item.recentAveragePrice || 0,
        serialNumber: item.serialNumber,
        created: item.created
      }));

      return {
        success: true,
        items: limitedItems,
        totalItems: limitedItems.length
      };

    } catch (error: any) {
      console.error("Error fetching limited items:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch limited items"
      };
    }
  }

  /**
   * Search inventory by name
   */
  static async searchInventory(
    encryptedCookie: string,
    userId: number,
    searchTerm: string
  ): Promise<InventoryResponse> {
    try {
      // Get all inventory items first
      const allItems = await this.getUserInventory(encryptedCookie, userId, 1000);
      
      if (!allItems.success) {
        return allItems;
      }

      // Filter by search term
      const filteredItems = allItems.items?.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

      return {
        success: true,
        items: filteredItems,
        totalItems: filteredItems.length
      };

    } catch (error: any) {
      console.error("Error searching inventory:", error);
      return {
        success: false,
        error: error.message || "Failed to search inventory"
      };
    }
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats(
    encryptedCookie: string,
    userId: number
  ): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const [collectibles, limitedItems] = await Promise.all([
        this.getUserCollectibles(encryptedCookie, userId),
        this.getUserLimitedItems(encryptedCookie, userId)
      ]);

      if (!collectibles.success || !limitedItems.success) {
        return {
          success: false,
          error: "Failed to fetch inventory statistics"
        };
      }

      const totalValue = [
        ...(collectibles.items || []),
        ...(limitedItems.items || [])
      ].reduce((sum, item) => sum + (item.value || 0), 0);

      const stats = {
        totalCollectibles: collectibles.totalItems || 0,
        totalLimitedItems: limitedItems.totalItems || 0,
        totalItems: (collectibles.totalItems || 0) + (limitedItems.totalItems || 0),
        estimatedValue: totalValue,
        rarestItem: this.findRarestItem([
          ...(collectibles.items || []),
          ...(limitedItems.items || [])
        ])
      };

      return {
        success: true,
        stats
      };

    } catch (error: any) {
      console.error("Error getting inventory stats:", error);
      return {
        success: false,
        error: error.message || "Failed to get inventory statistics"
      };
    }
  }

  /**
   * Find the rarest item in a list
   */
  private static findRarestItem(items: RobloxInventoryItem[]): RobloxInventoryItem | null {
    if (items.length === 0) return null;

    const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    
    return items.reduce((rarest, current) => {
      const rarestIndex = rarityOrder.indexOf(rarest.rarity || 'Common');
      const currentIndex = rarityOrder.indexOf(current.rarity || 'Common');
      
      return currentIndex > rarestIndex ? current : rarest;
    });
  }
} 