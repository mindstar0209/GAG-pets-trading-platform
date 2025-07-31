export interface GamePetData {
  petId: string;
  name: string;
  type: string;
  rarity: string;
  age: string;
  flyRide: {
    fly: boolean;
    ride: boolean;
  };
  neon: boolean;
  mega: boolean;
  purchaseDate: string;
  originalOwner: string;
  gameCompatible: boolean;
}

export const generatePetExportData = (pet: any, buyerName: string): GamePetData => {
  return {
    petId: pet.gameData?.petId || `${pet.id}-${Date.now()}`,
    name: pet.name,
    type: pet.type,
    rarity: pet.rarity,
    age: pet.age,
    flyRide: pet.flyRide || { fly: false, ride: false },
    neon: pet.neon || false,
    mega: pet.mega || false,
    purchaseDate: new Date().toISOString().split('T')[0],
    originalOwner: pet.sellerName,
    gameCompatible: true
  };
};

export const downloadPetData = (petData: GamePetData) => {
  const dataStr = JSON.stringify(petData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${petData.name.replace(/\s+/g, '_')}_${petData.petId}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const generatePetImportInstructions = (petName: string): string => {
  return `
🎮 How to Import Your ${petName} into Adopt Me:

1. Download the JSON file provided
2. Open Adopt Me in Roblox
3. Go to Settings > Import Pet Data
4. Select the downloaded JSON file
5. Your pet will appear in your inventory!

⚠️ Important Notes:
- Make sure you're logged into the correct Roblox account
- The import feature requires Adopt Me Premium (optional)
- Contact support if you encounter any issues

📧 Need Help? Contact our support team with your order ID.
  `.trim();
};