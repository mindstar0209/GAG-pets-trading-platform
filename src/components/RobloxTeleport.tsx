import React, { useState } from 'react';
import { useRobloxAuth } from '../hooks/useFirebaseRobloxAuth';
import './RobloxTeleport.css';

interface RobloxTeleportProps {
  gameId?: string;
  placeId?: string;
  serverId?: string;
  buttonText?: string;
  className?: string;
}

const RobloxTeleport: React.FC<RobloxTeleportProps> = ({
  gameId = "606849621", // Default to Pet Simulator 99
  placeId,
  serverId,
  buttonText = "Join Game",
  className = ""
}) => {
  const { user } = useRobloxAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleTeleport = async () => {
    if (!user) {
      alert('Please login with your Roblox account first');
      return;
    }

    setIsLoading(true);

    try {
      // Method 1: Direct Roblox protocol link (most reliable)
      const robloxUrl = serverId 
        ? `roblox://placeId=${placeId || gameId}&gameInstanceId=${serverId}`
        : `roblox://placeId=${placeId || gameId}`;
      
      // Try to open Roblox directly
      window.location.href = robloxUrl;
      
      // Fallback: Open Roblox website if app doesn't open
      setTimeout(() => {
        const webUrl = serverId
          ? `https://www.roblox.com/games/start?placeId=${placeId || gameId}&gameInstanceId=${serverId}`
          : `https://www.roblox.com/games/${gameId}`;
        
        window.open(webUrl, '_blank');
      }, 1000);

    } catch (error) {
      console.error('Error teleporting to Roblox:', error);
      
      // Fallback: Open game page
      const fallbackUrl = `https://www.roblox.com/games/${gameId}`;
      window.open(fallbackUrl, '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleTeleport}
      disabled={isLoading || !user}
      className={`roblox-teleport-btn ${className}`}
    >
      {isLoading ? (
        <>
          <span className="loading-spinner">⏳</span>
          Launching Roblox...
        </>
      ) : (
        <>
          <span className="roblox-icon">🎮</span>
          {buttonText}
        </>
      )}
    </button>
  );
};

export default RobloxTeleport;