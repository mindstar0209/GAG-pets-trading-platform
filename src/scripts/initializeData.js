// This script initializes sample pet data in Firebase
// Run it once to populate the database with sample pets

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample pet data
const samplePets = [
  {
    name: 'Shadow Dragon',
    type: 'Dragon',
    rarity: 'legendary',
    price: 45.99,
    age: 'full-grown',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/3/33/ShadowDragon.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: true },
    neon: false,
    mega: false,
    description: 'A rare and powerful Shadow Dragon with Fly and Ride abilities!'
  },
  {
    name: 'Frost Fury',
    type: 'Dragon',
    rarity: 'legendary',
    price: 25.99,
    age: 'teen',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/5/5f/Frost_Fury.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: false },
    neon: true,
    mega: false,
    description: 'Beautiful Neon Frost Fury with Fly ability!'
  },
  {
    name: 'Golden Unicorn',
    type: 'Unicorn',
    rarity: 'legendary',
    price: 35.50,
    age: 'post-teen',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/8/82/GoldenUnicorn.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: false, ride: true },
    neon: false,
    mega: false,
    description: 'Majestic Golden Unicorn with Ride ability!'
  },
  {
    name: 'Owl',
    type: 'Owl',
    rarity: 'legendary',
    price: 55.00,
    age: 'full-grown',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/f/f8/Owl.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: true },
    neon: false,
    mega: true,
    description: 'Ultra-rare Mega Owl with Fly and Ride!'
  },
  {
    name: 'Arctic Reindeer',
    type: 'Reindeer',
    rarity: 'legendary',
    price: 40.00,
    age: 'full-grown',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/7/7b/Arctic_Reindeer.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: true },
    neon: true,
    mega: false,
    description: 'Neon Arctic Reindeer with Fly and Ride!'
  },
  {
    name: 'Blue Dog',
    type: 'Dog',
    rarity: 'uncommon',
    price: 15.99,
    age: 'junior',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/d/d2/Blue_Dog.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: false, ride: false },
    neon: false,
    mega: false,
    description: 'Classic Blue Dog, great for beginners!'
  },
  {
    name: 'Phoenix',
    type: 'Phoenix',
    rarity: 'legendary',
    price: 30.00,
    age: 'newborn',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/f/f5/Phoenix.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: false },
    neon: false,
    mega: false,
    description: 'Mythical Phoenix with Fly ability!'
  },
  {
    name: 'Turtle',
    type: 'Turtle',
    rarity: 'legendary',
    price: 28.50,
    age: 'pre-teen',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/9/90/Turtle.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: false, ride: true },
    neon: false,
    mega: false,
    description: 'Adorable Turtle with Ride ability!'
  },
  {
    name: 'Kangaroo',
    type: 'Kangaroo',
    rarity: 'legendary',
    price: 32.00,
    age: 'full-grown',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/5/54/Kangaroo.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: true },
    neon: false,
    mega: false,
    description: 'Australian Kangaroo with Fly and Ride!'
  },
  {
    name: 'Frost Dragon',
    type: 'Dragon',
    rarity: 'legendary',
    price: 75.00,
    age: 'full-grown',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/f/f5/Frost_Dragon.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: true },
    neon: false,
    mega: false,
    description: 'Extremely rare Frost Dragon with Fly and Ride!'
  },
  {
    name: 'Parrot',
    type: 'Parrot',
    rarity: 'legendary',
    price: 38.00,
    age: 'post-teen',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/4/45/Parrot.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: true, ride: false },
    neon: true,
    mega: false,
    description: 'Neon Parrot with Fly ability!'
  },
  {
    name: 'Evil Unicorn',
    type: 'Unicorn',
    rarity: 'legendary',
    price: 42.00,
    age: 'teen',
    imageUrl: 'https://static.wikia.nocookie.net/adoptme/images/5/57/EvilUnicorn.png',
    sellerId: 'system',
    sellerName: 'StarPets Official',
    listed: true,
    flyRide: { fly: false, ride: true },
    neon: false,
    mega: false,
    description: 'Dark and mysterious Evil Unicorn with Ride!'
  }
];

async function initializeData() {
  try {
    // Check if data already exists
    const petsCollection = collection(db, 'pets');
    const existingPets = await getDocs(query(petsCollection, limit(1)));
    
    if (!existingPets.empty) {
      console.log('❌ Database already contains pet data. Skipping initialization.');
      return;
    }

    console.log('🚀 Starting to initialize sample pet data...');
    
    // Add each pet to the database
    for (const pet of samplePets) {
      const docRef = await addDoc(petsCollection, {
        ...pet,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Added pet: ${pet.name} (ID: ${docRef.id})`);
    }
    
    console.log(`\n🎉 Successfully initialized ${samplePets.length} sample pets!`);
    console.log('You can now see these pets in your marketplace.');
    
  } catch (error) {
    console.error('❌ Error initializing data:', error);
  }
  
  // Exit the process
  process.exit(0);
}

// Run the initialization
initializeData();