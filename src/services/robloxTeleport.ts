interface RobloxServer {
  id: string;
  maxPlayers: number;
  playing: number;
  playerTokens: string[];
  fps: number;
  ping: number;
}

interface RobloxGameServers {
  data: RobloxServer[];
  nextPageCursor?: string;
}

export class RobloxTeleportService {
  private static readonly GAMES_API = 'https://games.roblox.com';
  
  /**
   * Get available servers for a game
   */
  static async getGameServers(placeId: string, limit: number = 10): Promise<RobloxServer[]> {
    try {
      const response = await fetch(
        `${this.GAMES_API}/v1/games/${placeId}/servers/Public?sortOrder=Asc&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch servers: ${response.status}`);
      }
      
      const data: RobloxGameServers = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching game servers:', error);
      return [];
    }
  }

  /**
   * Find servers with available slots
   */
  static async findAvailableServers(placeId: string): Promise<RobloxServer[]> {
    const servers = await this.getGameServers(placeId, 50);
    return servers.filter(server => server.playing < server.maxPlayers);
  }

  /**
   * Find the best server (lowest ping, available slots)
   */
  static async findBestServer(placeId: string): Promise<RobloxServer | null> {
    const availableServers = await this.findAvailableServers(placeId);
    
    if (availableServers.length === 0) {
      return null;
    }
    
    // Sort by ping (lower is better) and available slots
    return availableServers.sort((a, b) => {
      const aAvailable = a.maxPlayers - a.playing;
      const bAvailable = b.maxPlayers - b.playing;
      
      // Prefer servers with more available slots, then by ping
      if (aAvailable !== bAvailable) {
        return bAvailable - aAvailable;
      }
      
      return a.ping - b.ping;
    })[0];
  }

  /**
   * Teleport to a specific game
   */
  static teleportToGame(placeId: string, serverId?: string): void {
    const robloxUrl = serverId 
      ? `roblox://placeId=${placeId}&gameInstanceId=${serverId}`
      : `roblox://placeId=${placeId}`;
    
    // Try Roblox protocol first
    window.location.href = robloxUrl;
    
    // Fallback to web after delay
    setTimeout(() => {
      const webUrl = serverId
        ? `https://www.roblox.com/games/start?placeId=${placeId}&gameInstanceId=${serverId}`
        : `https://www.roblox.com/games/${placeId}`;
      
      window.open(webUrl, '_blank');
    }, 1500);
  }

  /**
   * Teleport to the best available server
   */
  static async teleportToBestServer(placeId: string): Promise<void> {
    try {
      const bestServer = await this.findBestServer(placeId);
      
      if (bestServer) {
        this.teleportToGame(placeId, bestServer.id);
      } else {
        // No available servers, join any server
        this.teleportToGame(placeId);
      }
    } catch (error) {
      console.error('Error finding best server:', error);
      // Fallback to regular teleport
      this.teleportToGame(placeId);
    }
  }

  /**
   * Teleport to join a friend (requires friend's user ID)
   */
  static teleportToFriend(friendUserId: string): void {
    const robloxUrl = `roblox://userid=${friendUserId}`;
    window.location.href = robloxUrl;
    
    // Fallback
    setTimeout(() => {
      window.open(`https://www.roblox.com/users/${friendUserId}/profile`, '_blank');
    }, 1500);
  }

  /**
   * Get popular Pet Simulator games
   */
  static getPetSimulatorGames() {
    return {
      'Pet Simulator 99': '8737899170',
      'Pet Simulator X': '6284583030',
      'Pet Simulator': '1537690962',
      'Adopt Me': '920587237',
      'Pet Catchers': '6872265039'
    };
  }
}