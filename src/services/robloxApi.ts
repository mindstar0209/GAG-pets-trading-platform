interface RobloxUserData {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
  externalAppDisplayName: string | null;
  hasVerifiedBadge: boolean;
}

interface RobloxUserSearchResult {
  previousPageCursor: string | null;
  nextPageCursor: string | null;
  data: Array<{
    id: number;
    name: string;
    displayName: string;
    hasVerifiedBadge: boolean;
  }>;
}

interface RobloxAvatarData {
  targetId: number;
  state: string;
  imageUrl: string;
}

export class RobloxApiService {
  private static readonly BASE_URL = "https://users.roblox.com";
  private static readonly THUMBNAILS_URL = "https://thumbnails.roblox.com";

  /**
   * Search for a Roblox user by username
   */
  static async searchUserByUsername(
    username: string
  ): Promise<RobloxUserData | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/v1/users/search?keyword=${encodeURIComponent(
          username
        )}&limit=10`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Roblox API error: ${response.status}`);
      }

      const searchResult: RobloxUserSearchResult = await response.json();

      // Find exact username match (case-insensitive)
      const exactMatch = searchResult.data.find(
        (user) => user.name.toLowerCase() === username.toLowerCase()
      );

      if (!exactMatch) {
        return null;
      }

      // Get full user details
      return await this.getUserById(exactMatch.id);
    } catch (error) {
      console.error("Error searching for Roblox user:", error);
      throw new Error(
        "Failed to find Roblox user. Please check the username and try again."
      );
    }
  }

  /**
   * Get user details by Roblox user ID
   */
  static async getUserById(userId: number): Promise<RobloxUserData | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/v1/users/${userId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Roblox API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching Roblox user:", error);
      throw new Error("Failed to fetch Roblox user data.");
    }
  }

  /**
   * Get user avatar/headshot URL
   */
  static async getUserAvatar(
    userId: number,
    size: number = 150
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.THUMBNAILS_URL}/v1/users/avatar-headshot?userIds=${userId}&size=${size}x${size}&format=Png&isCircular=false`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Roblox Thumbnails API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        return result.data[0].imageUrl;
      }

      // Fallback to default avatar URL format
      return `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=${size}&height=${size}&format=png`;
    } catch (error) {
      console.error("Error fetching Roblox avatar:", error);
      // Return fallback avatar URL
      return `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=${size}&height=${size}&format=png`;
    }
  }

  /**
   * Get user's current status/description for verification
   */
  static async getUserStatus(userId: number): Promise<string> {
    try {
      const userData = await this.getUserById(userId);
      return userData?.description || "";
    } catch (error) {
      console.error("Error fetching user status:", error);
      return "";
    }
  }

  /**
   * Validate if a username exists and is not banned
   */
  static async validateUsername(
    username: string
  ): Promise<{ valid: boolean; userData?: RobloxUserData; error?: string }> {
    try {
      const userData = await this.searchUserByUsername(username);

      if (!userData) {
        return { valid: false, error: "Username not found on Roblox" };
      }

      if (userData.isBanned) {
        return { valid: false, error: "This Roblox account is banned" };
      }

      return { valid: true, userData };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
}
