import { TradingBot } from '../types/trading';

export const tradingBots: TradingBot[] = [
  {
    id: 'bot_1',
    username: 'StarPetsBot1',
    robloxId: '1234567890',
    displayName: 'StarPets Trading Bot #1',
    joinLink: 'https://www.roblox.com/games/start?placeId=8737899170&launchData=bot1',
    status: 'online',
    maxConcurrentTrades: 5,
    currentTrades: 0,
    serverInfo: {
      gameId: '8737899170',
      placeId: '8737899170'
    }
  },
  {
    id: 'bot_2',
    username: 'StarPetsBot2',
    robloxId: '1234567891',
    displayName: 'StarPets Trading Bot #2',
    joinLink: 'https://www.roblox.com/games/start?placeId=8737899170&launchData=bot2',
    status: 'online',
    maxConcurrentTrades: 5,
    currentTrades: 2,
    serverInfo: {
      gameId: '8737899170',
      placeId: '8737899170'
    }
  },
  {
    id: 'bot_3',
    username: 'StarPetsBot3',
    robloxId: '1234567892',
    displayName: 'StarPets Trading Bot #3',
    joinLink: 'https://www.roblox.com/games/start?placeId=8737899170&launchData=bot3',
    status: 'online',
    maxConcurrentTrades: 5,
    currentTrades: 1,
    serverInfo: {
      gameId: '8737899170',
      placeId: '8737899170'
    }
  }
];

export const getAvailableBot = (): TradingBot | null => {
  const availableBots = tradingBots.filter(
    bot => bot.status === 'online' && bot.currentTrades < bot.maxConcurrentTrades
  );
  
  if (availableBots.length === 0) return null;
  
  // Return bot with least current trades
  return availableBots.reduce((prev, current) => 
    prev.currentTrades < current.currentTrades ? prev : current
  );
};

export const getBotById = (botId: string): TradingBot | undefined => {
  return tradingBots.find(bot => bot.id === botId);
};