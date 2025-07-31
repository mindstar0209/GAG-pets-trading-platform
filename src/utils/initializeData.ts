import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { samplePets } from '../data/samplePets';

export const initializeSampleData = async () => {
  try {
    const petsCollection = collection(db, 'pets');
    
    for (const pet of samplePets) {
      await addDoc(petsCollection, {
        ...pet,
        createdAt: new Date()
      });
    }
    
    console.log('Sample data initialized successfully!');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};