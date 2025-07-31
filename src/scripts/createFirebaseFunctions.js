// This file contains the Firebase Cloud Functions code for Roblox authentication
// Deploy these functions to your Firebase project

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// Function to verify Roblox username and create custom token
exports.robloxLogin = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  try {
    // Get Roblox user ID from username
    const userResponse = await axios.post('https://users.roblox.com/v1/usernames/users', {
      usernames: [username],
      excludeBannedUsers: true
    });

    if (!userResponse.data.data || userResponse.data.data.length === 0) {
      res.status(404).json({ error: 'Roblox user not found' });
      return;
    }

    const robloxUser = userResponse.data.data[0];
    const robloxId = robloxUser.id.toString();

    // Get user avatar
    const avatarResponse = await axios.get(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=false`
    );
    
    const avatarUrl = avatarResponse.data.data[0]?.imageUrl || null;

    // Create custom token
    const uid = `roblox_${robloxId}`;
    const customToken = await admin.auth().createCustomToken(uid, {
      robloxId,
      robloxUsername: username
    });

    res.status(200).json({
      customToken,
      robloxId,
      avatarUrl
    });

  } catch (error) {
    console.error('Error in robloxLogin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to verify Roblox account ownership
exports.verifyRobloxAccount = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Verify Firebase ID token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const { verificationCode } = req.body;

    if (!verificationCode) {
      res.status(400).json({ error: 'Verification code is required' });
      return;
    }

    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    const robloxUsername = userData.robloxUsername;

    // Here you would implement actual Roblox account verification
    // For example, checking if the user has set a specific status message
    // or joined a verification game
    // For now, we'll use a simple verification code system

    const expectedCode = `STARPETS_${uid.substring(0, 8).toUpperCase()}`;
    
    if (verificationCode !== expectedCode) {
      res.status(400).json({ 
        error: 'Invalid verification code',
        hint: `Please set your Roblox status to: ${expectedCode}`
      });
      return;
    }

    // Mark user as verified
    await admin.firestore().collection('users').doc(uid).update({
      isVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error in verifyRobloxAccount:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to handle Roblox teleportation data
exports.getRobloxTeleportData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sellerId, petId } = data;

  if (!sellerId || !petId) {
    throw new functions.https.HttpsError('invalid-argument', 'Seller ID and Pet ID are required');
  }

  try {
    // Get seller's Roblox info
    const sellerDoc = await admin.firestore().collection('users').doc(sellerId).get();
    if (!sellerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Seller not found');
    }

    const sellerData = sellerDoc.data();
    
    // Generate teleport data for the bot game
    const teleportData = {
      placeId: functions.config().roblox.bot_place_id || '13822889', // Your bot game's place ID
      jobId: null, // Will be populated when seller's bot is ready
      accessCode: Math.random().toString(36).substring(2, 15),
      sellerRobloxId: sellerData.robloxId,
      sellerUsername: sellerData.robloxUsername,
      buyerUsername: context.auth.token.robloxUsername,
      petId: petId,
      timestamp: Date.now()
    };

    // Store teleport data for verification
    await admin.firestore().collection('pending_trades').add({
      ...teleportData,
      buyerId: context.auth.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return teleportData;

  } catch (error) {
    console.error('Error in getRobloxTeleportData:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate teleport data');
  }
});