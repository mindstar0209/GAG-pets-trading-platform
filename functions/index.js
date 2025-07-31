const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

// Initialize Firebase Admin
try {
  admin.initializeApp();
  logger.info("Firebase Admin initialized successfully");
} catch (error) {
  logger.error("Failed to initialize Firebase Admin:", error);
}

setGlobalOptions({maxInstances: 10});

// Helper function to make HTTP requests
const fetch = require("node-fetch");

// Roblox API service functions
const RobloxAPI = {
  async searchUserByUsername(username) {
    try {
      const url = "https://users.roblox.com/v1/users/search" +
        `?keyword=${encodeURIComponent(username)}&limit=10`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Roblox API error: ${response.status}`);
      }

      const searchResult = await response.json();

      // Find exact username match (case-insensitive)
      const exactMatch = searchResult.data.find(
          (user) => user.name.toLowerCase() === username.toLowerCase(),
      );

      if (!exactMatch) {
        return null;
      }

      // Get full user details
      return await this.getUserById(exactMatch.id);
    } catch (error) {
      logger.error("Error searching for Roblox user:", error);
      const message = "Failed to find Roblox user. " +
        "Please check the username and try again.";
      throw new Error(message);
    }
  },

  async getUserById(userId) {
    try {
      const response = await fetch(
          `https://users.roblox.com/v1/users/${userId}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Roblox API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("Error fetching Roblox user:", error);
      throw new Error("Failed to fetch Roblox user data.");
    }
  },

  async getUserAvatar(userId, size = 150) {
    try {
      const url = "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
        `?userIds=${userId}&size=${size}x${size}&format=Png&isCircular=false`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Roblox Thumbnails API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.data && result.data.length > 0) {
        return result.data[0].imageUrl;
      }

      // Fallback to default avatar URL format
      const fallbackUrl = "https://www.roblox.com/headshot-thumbnail/image" +
        `?userId=${userId}&width=${size}&height=${size}&format=png`;
      return fallbackUrl;
    } catch (error) {
      logger.error("Error fetching Roblox avatar:", error);
      // Return fallback avatar URL
      const fallbackUrl = "https://www.roblox.com/headshot-thumbnail/image" +
        `?userId=${userId}&width=${size}&height=${size}&format=png`;
      return fallbackUrl;
    }
  },

  async getUserStatus(userId) {
    try {
      const userData = await this.getUserById(userId);
      return userData?.description || "";
    } catch (error) {
      logger.error("Error fetching user status:", error);
      return "";
    }
  },
};

// Real Roblox Bot Configuration
const REAL_BOT_CONFIGS = {
  "bot_ps99_01": {
    // Replace with actual bot user ID
    userId: process.env.BOT_1_USER_ID || "1234567890",
    username: process.env.BOT_1_USERNAME || "StarPetsBot01",
    // .ROBLOSECURITY cookie
    cookie: process.env.BOT_1_COOKIE || "YOUR_BOT_COOKIE_HERE",
  },
  "bot_ps99_02": {
    userId: process.env.BOT_2_USER_ID || "1234567891",
    username: process.env.BOT_2_USERNAME || "StarPetsBot02",
    cookie: process.env.BOT_2_COOKIE || "YOUR_BOT_COOKIE_HERE",
  },
};

/**
 * Send real friend request from bot to user
 * @param {string} botUserId - Bot's Roblox user ID
 * @param {string} targetUsername - Target user's Roblox username
 * @return {Promise<boolean>} Success status
 */
async function sendRealFriendRequest(botUserId, targetUsername) {
  try {
    // Find bot config
    const botConfig = Object.values(REAL_BOT_CONFIGS).find((bot) => bot.userId === botUserId);
    if (!botConfig) {
      logger.error("Bot config not found for user ID:", botUserId);
      return false;
    }

    // Get target user ID from username
    const targetUserId = await getUserIdFromUsername(targetUsername);
    if (!targetUserId) {
      logger.error("Target user not found:", targetUsername);
      return false;
    }

    // Get CSRF token
    const csrfToken = await getCSRFToken(botConfig.cookie);
    if (!csrfToken) {
      logger.error("Failed to get CSRF token for bot:", botConfig.username);
      return false;
    }

    // Send friend request
    const friendUrl = `https://friends.roblox.com/v1/users/${targetUserId}/request-friendship`;
    const response = await fetch(friendUrl, {
      method: "POST",
      headers: {
        "Cookie": `.ROBLOSECURITY=${botConfig.cookie}`,
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken,
      },
    });

    if (response.ok) {
      logger.info(`✅ Bot ${botConfig.username} sent friend request to ${targetUsername}`);
      return true;
    } else {
      const error = await response.text();
      logger.error(`❌ Failed to send friend request:`, error);
      return false;
    }
  } catch (error) {
    logger.error("Error sending real friend request:", error);
    return false;
  }
}

/**
 * Start monitoring friendship status
 * @param {string} custodyId - Custody request ID
 * @param {string} botUserId - Bot's user ID
 * @param {string} targetUsername - Target username
 */
function startFriendshipMonitoring(custodyId, botUserId, targetUsername) {
  const checkInterval = setInterval(async () => {
    try {
      const status = await checkFriendshipStatus(botUserId, targetUsername);

      if (status === "accepted") {
        BotTradingSystem.updateTradeStatus(custodyId, "friend_accepted");
        logger.info("Friend request accepted:", {custodyId});
        clearInterval(checkInterval);

        // Start waiting for pet trade
        setTimeout(() => {
          BotTradingSystem.updateTradeStatus(custodyId, "pet_received");
          logger.info("Pet received by custody bot:", {custodyId});

          // Complete custody after verification
          setTimeout(() => {
            BotTradingSystem.updateTradeStatus(custodyId, "custody_complete");
            logger.info("Pet custody complete:", {custodyId});
          }, 10000);
        }, 60000);
      }
    } catch (error) {
      logger.error("Error monitoring friendship:", error);
    }
  }, 10000); // Check every 10 seconds

  // Stop monitoring after 10 minutes if not accepted
  setTimeout(() => {
    clearInterval(checkInterval);
    const trade = BotTradingSystem.getTrade(custodyId);
    if (trade && trade.status === "friend_request_sent") {
      BotTradingSystem.updateTradeStatus(custodyId, "failed");
      logger.error("Friend request timeout:", {custodyId});
    }
  }, 600000); // 10 minutes
}

/**
 * Check friendship status between bot and user
 * @param {string} botUserId - Bot's user ID
 * @param {string} targetUsername - Target username
 * @return {Promise<string>} Status: 'pending', 'accepted', or 'none'
 */
async function checkFriendshipStatus(botUserId, targetUsername) {
  try {
    const botConfig = Object.values(REAL_BOT_CONFIGS).find((bot) => bot.userId === botUserId);
    if (!botConfig) return "none";

    const targetUserId = await getUserIdFromUsername(targetUsername);
    if (!targetUserId) return "none";

    const statusUrl = `https://friends.roblox.com/v1/users/${botUserId}/friends/statuses?userIds=${targetUserId}`;
    const response = await fetch(statusUrl, {
      headers: {
        "Cookie": `.ROBLOSECURITY=${botConfig.cookie}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const status = data.data[0]?.status;

      switch (status) {
        case "Friends": return "accepted";
        case "RequestSent": return "pending";
        default: return "none";
      }
    }

    return "none";
  } catch (error) {
    logger.error("Error checking friendship status:", error);
    return "none";
  }
}

/**
 * Get user ID from username
 * @param {string} username - Roblox username
 * @return {Promise<string|null>} User ID or null
 */
async function getUserIdFromUsername(username) {
  try {
    const searchUrl = `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`;
    const response = await fetch(searchUrl);

    if (response.ok) {
      const data = await response.json();
      const user = data.data.find((u) => u.name.toLowerCase() === username.toLowerCase());
      return user ? user.id.toString() : null;
    }

    return null;
  } catch (error) {
    logger.error("Error getting user ID:", error);
    return null;
  }
}

/**
 * Get CSRF token for authenticated requests
 * @param {string} cookie - Bot's .ROBLOSECURITY cookie
 * @return {Promise<string>} CSRF token
 */
async function getCSRFToken(cookie) {
  try {
    const response = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: {
        "Cookie": `.ROBLOSECURITY=${cookie}`,
      },
    });

    return response.headers.get("x-csrf-token") || "";
  } catch (error) {
    logger.error("Error getting CSRF token:", error);
    return "";
  }
}

// Bot Trading System
const BotTradingSystem = {
  // Mock bot data - in production, this would be in a database
  bots: {
    "8737899170": [ // Pet Simulator 99
      {
        id: "bot_ps99_01",
        robloxUserId: "1234567890",
        robloxUsername: "StarPetsBot01",
        status: "online",
        currentTrades: 0,
        maxTrades: 5,
      },
      {
        id: "bot_ps99_02",
        robloxUserId: "1234567891",
        robloxUsername: "StarPetsBot02",
        status: "online",
        currentTrades: 0,
        maxTrades: 5,
      },
    ],
  },

  // Mock trade storage - in production, this would be in Firestore
  trades: new Map(),

  findAvailableBot(gameId) {
    const bots = this.bots[gameId] || [];
    const availableBots = bots.filter((bot) =>
      bot.status === "online" && bot.currentTrades < bot.maxTrades,
    );

    if (availableBots.length === 0) {
      return null;
    }

    return availableBots.sort((a, b) => a.currentTrades - b.currentTrades)[0];
  },

  createTrade(tradeData) {
    const trade = {
      ...tradeData,
      status: "pending",
      createdAt: new Date(),
    };
    this.trades.set(trade.id, trade);
    return trade;
  },

  updateTradeStatus(tradeId, status, additionalData = {}) {
    const trade = this.trades.get(tradeId);
    if (trade) {
      Object.assign(trade, {status, ...additionalData});
      this.trades.set(tradeId, trade);
    }
    return trade;
  },

  getTrade(tradeId) {
    return this.trades.get(tradeId);
  },
};

/**
 * Handle bot trading endpoints
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} path - API path
 * @param {string} method - HTTP method
 * @return {Promise} Response promise
 */
async function handleBotTradingEndpoint(req, res, path, method) {
  const endpoint = path.replace("/bot-trading/", "");

  try {
    if (endpoint === "initiate" && method === "POST") {
      const tradeData = req.body;

      // Validate required fields
      if (!tradeData.buyerId || !tradeData.buyerRobloxUsername ||
          !tradeData.petId || !tradeData.gameId) {
        return res.status(400).json({
          error: "Missing required trade data",
        });
      }

      // Find available bot
      const bot = BotTradingSystem.findAvailableBot(tradeData.gameId);
      if (!bot) {
        return res.status(503).json({
          error: "No trading bots available. Please try again later.",
        });
      }

      // Create trade request
      const trade = BotTradingSystem.createTrade({
        ...tradeData,
        botId: bot.id,
        botUsername: bot.robloxUsername,
      });

      logger.info("Bot trade initiated:", {tradeId: trade.id});

      // Simulate bot sending friend request after 2 seconds
      setTimeout(() => {
        BotTradingSystem.updateTradeStatus(trade.id, "friend_request_sent");
        logger.info("Friend request sent:", {tradeId: trade.id});

        // Simulate friend acceptance after 30 seconds
        setTimeout(() => {
          BotTradingSystem.updateTradeStatus(trade.id, "friend_accepted");
          logger.info("Friend request accepted:", {tradeId: trade.id});
        }, 30000);
      }, 2000);

      return res.json({
        success: true,
        trade,
        botInfo: {
          username: bot.robloxUsername,
          userId: bot.robloxUserId,
        },
      });
    } else if (endpoint === "friend-request" && method === "POST") {
      const {tradeId} = req.body;

      if (!tradeId) {
        return res.status(400).json({error: "Trade ID required"});
      }

      const trade = BotTradingSystem.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({error: "Trade not found"});
      }

      // Update status to friend request sent
      BotTradingSystem.updateTradeStatus(tradeId, "friend_request_sent");

      logger.info("Manual friend request sent:", {tradeId});

      return res.json({success: true, message: "Friend request sent"});
    } else if (endpoint.startsWith("status/") && method === "GET") {
      const tradeId = endpoint.replace("status/", "");

      const trade = BotTradingSystem.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({error: "Trade not found"});
      }

      return res.json(trade);
    } else if (endpoint === "join-server" && method === "POST") {
      const {tradeId, serverId} = req.body;

      if (!tradeId) {
        return res.status(400).json({error: "Trade ID required"});
      }

      const trade = BotTradingSystem.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({error: "Trade not found"});
      }

      // Update status to in game
      BotTradingSystem.updateTradeStatus(tradeId, "in_game", {
        gameServerId: serverId,
      });

      logger.info("Bot joining server:", {tradeId, serverId});

      // Simulate bot joining and trading after 10 seconds
      setTimeout(() => {
        BotTradingSystem.updateTradeStatus(tradeId, "trading");
        logger.info("Bot started trading:", {tradeId});

        // Complete trade after 15 seconds
        setTimeout(() => {
          BotTradingSystem.updateTradeStatus(tradeId, "completed", {
            completedAt: new Date(),
          });
          logger.info("Trade completed:", {tradeId});
        }, 15000);
      }, 10000);

      return res.json({success: true, message: "Bot joining server"});
    } else if (endpoint === "execute" && method === "POST") {
      const {tradeId} = req.body;

      if (!tradeId) {
        return res.status(400).json({error: "Trade ID required"});
      }

      const trade = BotTradingSystem.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({error: "Trade not found"});
      }

      // Execute the trade
      BotTradingSystem.updateTradeStatus(tradeId, "completed", {
        completedAt: new Date(),
      });

      logger.info("Trade executed:", {tradeId});

      return res.json({success: true, message: "Trade completed"});
    } else if (endpoint === "custody/initiate" && method === "POST") {
      // Handle pet custody initiation
      const {sellerId, sellerRobloxUsername, petData, gameId} = req.body;

      if (!sellerId || !sellerRobloxUsername || !petData) {
        return res.status(400).json({
          error: "Missing required custody data",
        });
      }

      // Find available bot for custody
      const bot = BotTradingSystem.findAvailableBot(gameId || "8737899170");
      if (!bot) {
        return res.status(503).json({
          error: "No custody bots available. Please try again later.",
        });
      }

      // Create custody request
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const custodyId = `custody_${timestamp}_${randomId}`;
      const custody = {
        custodyId,
        sellerId,
        sellerRobloxUsername,
        petData,
        botId: bot.id,
        botInfo: {
          username: bot.robloxUsername,
          userId: bot.robloxUserId,
        },
        status: "pending",
        createdAt: new Date(),
      };

      BotTradingSystem.trades.set(custodyId, custody);

      logger.info("Pet custody initiated:", {custodyId});

      // Send real friend request using bot
      setTimeout(async () => {
        try {
          // Call real bot service to send friend request
          const friendRequestSent = await sendRealFriendRequest(
              bot.robloxUserId,
              sellerRobloxUsername,
          );

          if (friendRequestSent) {
            BotTradingSystem.updateTradeStatus(custodyId, "friend_request_sent");
            logger.info("Real friend request sent:", {custodyId});

            // Start monitoring for friend acceptance
            startFriendshipMonitoring(custodyId, bot.robloxUserId, sellerRobloxUsername);
          } else {
            BotTradingSystem.updateTradeStatus(custodyId, "failed");
            logger.error("Failed to send friend request:", {custodyId});
          }
        } catch (error) {
          logger.error("Error sending friend request:", error);
          BotTradingSystem.updateTradeStatus(custodyId, "failed");
        }
      }, 2000);

      return res.json({
        success: true,
        custodyId,
        botInfo: custody.botInfo,
      });
    } else if (endpoint.startsWith("custody/status/") && method === "GET") {
      const custodyId = endpoint.replace("custody/status/", "");

      const custody = BotTradingSystem.getTrade(custodyId);
      if (!custody) {
        return res.status(404).json({error: "Custody request not found"});
      }

      return res.json(custody);
    } else {
      return res.status(404).json({error: "Bot trading endpoint not found"});
    }
  } catch (error) {
    logger.error("Bot trading error:", error);
    return res.status(500).json({
      error: error.message || "Bot trading system error",
    });
  }
}

// Main API handler
exports.api = onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const path = req.path;
      const method = req.method;

      logger.info(`API Request: ${method} ${path}`, {body: req.body});

      // Handle Roblox login
      if (path === "/auth/roblox/login" && method === "POST") {
        const {username} = req.body;

        if (!username || typeof username !== "string") {
          return res.status(400).json({error: "Username is required"});
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          const errorMsg = "Username can only contain letters, numbers, " +
            "and underscores";
          return res.status(400).json({error: errorMsg});
        }

        if (username.length < 3 || username.length > 20) {
          return res.status(400).json({
            error: "Username must be between 3 and 20 characters",
          });
        }

        try {
          // Search for user on Roblox
          const robloxUserData = await RobloxAPI.searchUserByUsername(username);

          if (!robloxUserData) {
            return res.status(404).json({
              error: "Roblox user not found. Please check the username.",
            });
          }

          if (robloxUserData.isBanned) {
            return res.status(400).json({
              error: "This Roblox account is banned",
            });
          }

          // Get user avatar
          const avatarUrl = await RobloxAPI.getUserAvatar(robloxUserData.id);

          // Return user data without custom token (using anonymous auth)
          const logData = {
            robloxId: robloxUserData.id.toString(),
            robloxUsername: robloxUserData.name,
          };
          logger.info("Returning Roblox user data:", logData);

          return res.json({
            success: true,
            robloxId: robloxUserData.id.toString(),
            robloxUsername: robloxUserData.name,
            displayName: robloxUserData.displayName || robloxUserData.name,
            avatarUrl,
            hasVerifiedBadge: robloxUserData.hasVerifiedBadge || false,
          });
        } catch (error) {
          logger.error("Error during Roblox login:", error);
          return res.status(500).json({
            error: error.message || "Failed to authenticate with Roblox",
          });
        }
      } else if (path === "/auth/roblox/verify" && method === "POST") {
        // Handle Roblox verification
        const {verificationCode} = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({error: "Authorization token required"});
        }

        const idToken = authHeader.split("Bearer ")[1];

        try {
          // Verify the Firebase ID token
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          const uid = decodedToken.uid;
          const robloxId = decodedToken.robloxId;

          if (!robloxId) {
            return res.status(400).json({
              error: "Roblox ID not found in token",
            });
          }

          // Generate expected verification code
          const expectedCode = `STARPETS_${uid.substring(7, 15).toUpperCase()}`;

          if (verificationCode !== expectedCode) {
            return res.status(400).json({
              error: "Invalid verification code. Please check your input.",
            });
          }

          // Check user's Roblox status
          const userStatus = await RobloxAPI.getUserStatus(parseInt(robloxId));

          if (!userStatus.includes(expectedCode)) {
            const message = "Verification code not found in your Roblox " +
              "status. Please update your Roblox status and try again.";
            return res.status(400).json({error: message});
          }

          return res.json({
            success: true,
            message: "Roblox account verified successfully",
          });
        } catch (error) {
          logger.error("Error during Roblox verification:", error);
          return res.status(500).json({
            error: error.message || "Verification failed",
          });
        }
      } else if (path.startsWith("/bot-trading/")) {
        // Handle bot trading endpoints
        return handleBotTradingEndpoint(req, res, path, method);
      } else {
        // Handle unknown routes
        return res.status(404).json({error: "API endpoint not found"});
      }
    } catch (error) {
      logger.error("Unexpected API error:", error);
      return res.status(500).json({error: "Internal server error"});
    }
  });
});
