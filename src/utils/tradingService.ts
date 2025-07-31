import { Trade, TeleportInstructions, TeleportStep } from '../types/trading';
import { getAvailableBot, getBotById } from '../data/tradingBots';
import { v4 as uuidv4 } from 'uuid';

export const createTrade = async (
  buyerId: string,
  buyerUsername: string,
  petId: string,
  petName: string,
  price: number
): Promise<Trade | null> => {
  const bot = getAvailableBot();
  
  if (!bot) {
    throw new Error('No trading bots available. Please try again in a few minutes.');
  }

  const trade: Trade = {
    id: uuidv4(),
    buyerId,
    buyerUsername,
    sellerId: 'system',
    sellerUsername: 'System',
    botId: bot.id,
    botUsername: bot.username,
    petId,
    petName,
    price,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minute expiry
  };

  // Generate teleport instructions
  trade.teleportInstructions = generateTeleportInstructions(bot.username, bot.joinLink);

  // In a real app, this would save to a database
  // For now, we'll store in localStorage
  const trades = getStoredTrades();
  trades.push(trade);
  localStorage.setItem('trades', JSON.stringify(trades));

  // Update bot's current trades count
  bot.currentTrades += 1;

  return trade;
};

export const generateTeleportInstructions = (
  botUsername: string,
  joinLink?: string
): TeleportInstructions => {
  const steps: TeleportStep[] = [
    {
      order: 1,
      title: 'Add Bot as Friend',
      description: `Send a friend request to our trading bot: ${botUsername}`,
      actionType: 'copy',
      actionData: botUsername,
    },
    {
      order: 2,
      title: 'Wait for Friend Request Acceptance',
      description: 'Our bot will automatically accept your friend request within 30 seconds.',
      actionType: 'wait',
    },
    {
      order: 3,
      title: 'Join the Trading Server',
      description: 'Click the button below to join the bot in Pet Simulator X',
      actionType: 'open_link',
      actionData: joinLink,
    },
    {
      order: 4,
      title: 'Teleport to Bot',
      description: `Once in the game, teleport to ${botUsername} using the teleport menu or type "/teleport ${botUsername}" in chat`,
      actionType: 'copy',
      actionData: `/teleport ${botUsername}`,
    },
    {
      order: 5,
      title: 'Complete the Trade',
      description: 'The bot will automatically initiate a trade with you. Accept the trade to receive your pet!',
      actionType: 'confirm',
    },
  ];

  return {
    method: joinLink ? 'direct_join' : 'friend_join',
    botUsername,
    joinLink,
    steps,
  };
};

export const getStoredTrades = (): Trade[] => {
  const tradesJson = localStorage.getItem('trades');
  if (!tradesJson) return [];
  
  try {
    const trades = JSON.parse(tradesJson);
    // Convert date strings back to Date objects
    return trades.map((trade: any) => ({
      ...trade,
      createdAt: new Date(trade.createdAt),
      updatedAt: new Date(trade.updatedAt),
      expiresAt: new Date(trade.expiresAt),
    }));
  } catch {
    return [];
  }
};

export const updateTradeStatus = (tradeId: string, status: Trade['status']) => {
  const trades = getStoredTrades();
  const tradeIndex = trades.findIndex(t => t.id === tradeId);
  
  if (tradeIndex !== -1) {
    trades[tradeIndex].status = status;
    trades[tradeIndex].updatedAt = new Date();
    localStorage.setItem('trades', JSON.stringify(trades));
    
    // If trade is completed or cancelled, free up the bot
    if (status === 'completed' || status === 'cancelled' || status === 'failed') {
      const bot = getBotById(trades[tradeIndex].botId);
      if (bot && bot.currentTrades > 0) {
        bot.currentTrades -= 1;
      }
    }
  }
};

export const getTradeById = (tradeId: string): Trade | null => {
  const trades = getStoredTrades();
  return trades.find(t => t.id === tradeId) || null;
};

export const getUserTrades = (userId: string): Trade[] => {
  const trades = getStoredTrades();
  return trades.filter(t => t.buyerId === userId).sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  );
};