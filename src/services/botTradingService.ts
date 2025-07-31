interface TradingBot {
  id: string;
  robloxUserId: string;
  robloxUsername: string;
  status: 'online' | 'offline' | 'busy' | 'maintenance';
  currentTrades: number;
  maxTrades: number;
  gameId: string;
  lastSeen: Date;
}

interface TradeRequest {
  id: string;
  buyerId: string;
  buyerRobloxUsername: string;
  sellerId: string;
  petId: string;
  petName: string;
  price: number;
  botId: string;
  status: 'pending' | 'friend_request_sent' | 'friend_accepted' | 'in_game' | 'trading' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  accessCode: string;
  gameServerId?: string;
}

export class BotTradingService {
  private static readonly API_BASE = process.env.NODE_ENV === 'development' 
    ? 'https://us-central1-sylvan-project-3d177.cloudfunctions.net/api/bot-trading'
    : '/api/bot-trading';
  
  // Available trading bots for different games
  private static readonly TRADING_BOTS: Record<string, TradingBot[]> = {
    '8737899170': [ // Pet Simulator 99
      {
        id: 'bot_ps99_01',
        robloxUserId: '1234567890',
        robloxUsername: 'StarPetsBot01',
        status: 'online',
        currentTrades: 0,
        maxTrades: 5,
        gameId: '8737899170',
        lastSeen: new Date()
      },
      {
        id: 'bot_ps99_02',
        robloxUserId: '1234567891',
        robloxUsername: 'StarPetsBot02',
        status: 'online',
        currentTrades: 0,
        maxTrades: 5,
        gameId: '8737899170',
        lastSeen: new Date()
      }
    ],
    '6284583030': [ // Pet Simulator X
      {
        id: 'bot_psx_01',
        robloxUserId: '1234567892',
        robloxUsername: 'StarPetsBotX01',
        status: 'online',
        currentTrades: 0,
        maxTrades: 3,
        gameId: '6284583030',
        lastSeen: new Date()
      }
    ]
  };

  /**
   * Find an available bot for a specific game
   */
  static async findAvailableBot(gameId: string): Promise<TradingBot | null> {
    const bots = this.TRADING_BOTS[gameId] || [];
    
    // Find bot with lowest current trades that's online
    const availableBots = bots.filter(bot => 
      bot.status === 'online' && bot.currentTrades < bot.maxTrades
    );
    
    if (availableBots.length === 0) {
      return null;
    }
    
    // Return bot with lowest current trade count
    return availableBots.sort((a, b) => a.currentTrades - b.currentTrades)[0];
  }

  /**
   * Initiate a bot trade
   */
  static async initiateBotTrade(
    buyerId: string,
    buyerRobloxUsername: string,
    sellerId: string,
    petId: string,
    petName: string,
    price: number,
    gameId: string = '8737899170'
  ): Promise<TradeRequest> {
    try {
      // Find available bot
      const bot = await this.findAvailableBot(gameId);
      if (!bot) {
        throw new Error('No trading bots available. Please try again in a few minutes.');
      }

      // Generate unique access code
      const accessCode = `TRADE_${Date.now().toString(36).toUpperCase()}`;

      // Create trade request
      const tradeRequest: TradeRequest = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        buyerId,
        buyerRobloxUsername,
        sellerId,
        petId,
        petName,
        price,
        botId: bot.id,
        status: 'pending',
        createdAt: new Date(),
        accessCode
      };

      // Call backend to initiate trade
      const response = await fetch(`${this.API_BASE}/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeRequest)
      });

      if (!response.ok) {
        throw new Error('Failed to initiate bot trade');
      }

      const result = await response.json();
      return { ...tradeRequest, ...result };

    } catch (error: any) {
      console.error('Error initiating bot trade:', error);
      throw error;
    }
  }

  /**
   * Send friend request from bot to buyer
   */
  static async sendFriendRequest(tradeId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId })
      });

      if (!response.ok) {
        throw new Error('Failed to send friend request');
      }
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Check trade status
   */
  static async getTradeStatus(tradeId: string): Promise<TradeRequest> {
    try {
      const response = await fetch(`${this.API_BASE}/status/${tradeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get trade status');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error getting trade status:', error);
      throw error;
    }
  }

  /**
   * Join buyer's server with bot
   */
  static async joinBuyerServer(tradeId: string, serverId?: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/join-server`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, serverId })
      });

      if (!response.ok) {
        throw new Error('Failed to join server');
      }
    } catch (error: any) {
      console.error('Error joining server:', error);
      throw error;
    }
  }

  /**
   * Execute the trade
   */
  static async executeTrade(tradeId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId })
      });

      if (!response.ok) {
        throw new Error('Failed to execute trade');
      }
    } catch (error: any) {
      console.error('Error executing trade:', error);
      throw error;
    }
  }

  /**
   * Get bot information
   */
  static getBotInfo(botId: string): TradingBot | null {
    for (const gameId in this.TRADING_BOTS) {
      const bot = this.TRADING_BOTS[gameId].find(b => b.id === botId);
      if (bot) return bot;
    }
    return null;
  }

  /**
   * Generate instructions for buyer
   */
  static generateBuyerInstructions(tradeRequest: TradeRequest): string[] {
    const bot = this.getBotInfo(tradeRequest.botId);
    if (!bot) return [];

    return [
      `Accept friend request from ${bot.robloxUsername}`,
      `Join any Pet Simulator 99 server`,
      `Wait for ${bot.robloxUsername} to join your server`,
      `The bot will automatically trade you ${tradeRequest.petName}`,
      `Trade complete! Enjoy your new pet!`
    ];
  }

  /**
   * Get estimated wait time
   */
  static getEstimatedWaitTime(gameId: string): number {
    const bots = this.TRADING_BOTS[gameId] || [];
    const totalTrades = bots.reduce((sum, bot) => sum + bot.currentTrades, 0);
    
    // Estimate 2-5 minutes per trade depending on load
    const baseTime = 2; // minutes
    const loadMultiplier = Math.min(totalTrades * 0.5, 3);
    
    return Math.ceil(baseTime + loadMultiplier);
  }
}