import React, { useState, useEffect } from 'react';
import { useTraditionalAuth } from '../hooks/useTraditionalAuth';
import { RobloxTeleportService } from '../services/robloxTeleport';
import './GameTeleporter.css';

interface GameTeleporterProps {
  gameId?: string;
  gameName?: string;
  showServerSelection?: boolean;
  autoFindBestServer?: boolean;
}

const GameTeleporter: React.FC<GameTeleporterProps> = ({
  gameId = "8737899170", // Pet Simulator 99
  gameName = "Pet Simulator 99",
  showServerSelection = false,
  autoFindBestServer = true
}) => {
  const { user } = useTraditionalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [showServers, setShowServers] = useState(false);

  useEffect(() => {
    if (showServerSelection) {
      loadServers();
    }
  }, [gameId, showServerSelection]);

  const loadServers = async () => {
    try {
      const gameServers = await RobloxTeleportService.getGameServers(gameId, 20);
      setServers(gameServers);
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const handleQuickJoin = async () => {
    if (!user) {
      alert('Please login to your account first');
      return;
    }

    setIsLoading(true);

    try {
      if (autoFindBestServer) {
        await RobloxTeleportService.teleportToBestServer(gameId);
      } else {
        RobloxTeleportService.teleportToGame(gameId);
      }
    } catch (error) {
      console.error('Teleport failed:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  const handleServerJoin = (serverId: string) => {
    if (!user) {
      alert('Please login to your account first');
      return;
    }

    setIsLoading(true);
    RobloxTeleportService.teleportToGame(gameId, serverId);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="game-teleporter">
      <div className="teleporter-header">
        <h3>{gameName}</h3>
        <p>Join the game to complete your pet trade</p>
      </div>

      <div className="teleporter-actions">
        <button 
          onClick={handleQuickJoin}
          disabled={isLoading || !user}
          className="quick-join-btn"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner">⏳</span>
              Launching Roblox...
            </>
          ) : (
            <>
              <span className="game-icon">🚀</span>
              Quick Join {autoFindBestServer ? '(Best Server)' : ''}
            </>
          )}
        </button>

        {showServerSelection && (
          <button 
            onClick={() => setShowServers(!showServers)}
            className="server-select-btn"
          >
            <span className="server-icon">🌐</span>
            Choose Server
          </button>
        )}
      </div>

      {showServers && (
        <div className="server-list">
          <h4>Available Servers</h4>
          <div className="servers-grid">
            {servers.map((server, index) => (
              <div key={server.id} className="server-card">
                <div className="server-info">
                  <span className="server-number">Server #{index + 1}</span>
                  <span className="server-players">
                    {server.playing}/{server.maxPlayers} players
                  </span>
                  <span className="server-ping">
                    {server.ping}ms ping
                  </span>
                </div>
                <button 
                  onClick={() => handleServerJoin(server.id)}
                  disabled={server.playing >= server.maxPlayers}
                  className="join-server-btn"
                >
                  {server.playing >= server.maxPlayers ? 'Full' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <div className="login-prompt">
          <p>⚠️ Please login to use teleportation features</p>
        </div>
      )}
    </div>
  );
};

export default GameTeleporter;