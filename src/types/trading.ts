export interface TradingBot {
  id: string;
  username: string;
  robloxId: string;
  displayName: string;
  joinLink: string;
  status: 'online' | 'offline' | 'busy';
  maxConcurrentTrades: number;
  currentTrades: number;
  serverInfo?: {
    gameId: string;
    placeId: string;
    serverId?: string;
  };
}

export interface Trade {
  id: string;
  buyerId: string;
  buyerUsername: string;
  sellerId: string;
  sellerUsername: string;
  botId: string;
  botUsername: string;
  petId: string;
  petName: string;
  price: number;
  status: 'pending' | 'bot_ready' | 'buyer_joined' | 'completed' | 'cancelled' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  teleportInstructions?: TeleportInstructions;
}

export interface TeleportInstructions {
  method: 'direct_join' | 'friend_join' | 'manual';
  botUsername: string;
  joinLink?: string;
  steps: TeleportStep[];
}

export interface TeleportStep {
  order: number;
  title: string;
  description: string;
  actionType?: 'copy' | 'open_link' | 'wait' | 'confirm';
  actionData?: string;
  imageUrl?: string;
}