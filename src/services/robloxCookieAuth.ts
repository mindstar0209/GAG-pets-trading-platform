import axios from 'axios';

interface RobloxCookieAuthResponse {
  success: boolean;
  userid?: number;
  username?: string;
  display_name?: string;
  user_avatar_picture?: string;
  description?: string;
  has_verified_badge?: boolean;
  is_banned?: boolean;
  created_iso?: string;
  error?: string;
}

interface RobloxInventoryItem {
  id: number;
  name: string;
  type: string;
  imageUrl?: string;
  rarity?: string;
  value?: number;
}

export class RobloxCookieAuthService {
  private static readonly FIREBASE_FUNCTION_URL = "http://127.0.0.1:5001/test-adefb/us-central1/api";

  /**
   * Validate Roblox cookie and get user profile information
   */
  static async validateCookieAndGetProfile(
    cookie: string
  ): Promise<RobloxCookieAuthResponse> {
    try {
      // Call Firebase Cloud Function instead of direct API
      const response = await axios.post(`${this.FIREBASE_FUNCTION_URL}/auth/roblox/cookie`, {
        cookie
      }, {
        headers: {
          "Content-Type": "application/json",
        }
      });

      return response.data;

    } catch (error: any) {
      console.error("Error validating Roblox cookie:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Failed to validate Roblox cookie"
      };
    }
  }

  /**
   * Get user's inventory items using cookie
   */
  static async getUserInventory(
    cookie: string,
    userId: number,
    limit: number = 50
  ): Promise<RobloxInventoryItem[]> {
    try {
      const response = await axios.get(
        `https://inventory.roblox.com/v1/users/${userId}/items/List/Collectibles/100/0`,
        {
          headers: {
            "Cookie": cookie,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        }
      );

      const data = response.data;
      
      if (!data.data) {
        return [];
      }

      return data.data.map((item: any) => ({
        id: item.assetId,
        name: item.name,
        type: item.assetType,
        imageUrl: item.imageUrl,
        rarity: item.rarity,
        value: item.recentAveragePrice || 0
      }));

    } catch (error: any) {
      console.error("Error fetching user inventory:", error);
      throw new Error("Failed to fetch inventory items");
    }
  }

  /**
   * Validate cookie format (basic validation)
   */
  static validateCookieFormat(cookie: string): { valid: boolean; error?: string } {
    if (!cookie || cookie.trim().length === 0) {
      return { valid: false, error: "Cookie cannot be empty" };
    }

    // Basic validation for common Roblox cookie patterns
    const requiredFields = ['_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_'];
    const hasRequiredField = requiredFields.some(field => 
      cookie.toLowerCase().includes(field.toLowerCase())
    );

    if (!hasRequiredField) {
      return { 
        valid: false, 
        error: "Invalid cookie format. Please make sure you're copying the complete .ROBLOSECURITY cookie" 
      };
    }

    return { valid: true };
  }

  /**
   * Extract cookie value from full cookie string
   */
  static extractRobloxSecurityCookie(cookieString: string): string | null {
    const match = cookieString.match(/\.ROBLOSECURITY=([^;]+)/i);
    return match ? match[1] : null;
  }
} 