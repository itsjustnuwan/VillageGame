
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sword, Shield, Sun, Moon, Coins, Building, Ghost } from 'lucide-react';
import { BuildingType } from '@/game/player';

interface GameUIProps {
  villageHealth: number;
  playerHealth: number;
  currentWeapon: string;
  dayCycle: 'day' | 'night';
  waveNumber: number;
  buildMode: boolean;
  coins: number;
  selectedBuilding: BuildingType | null;
  onStartGame: () => void;
}

const GameUI: React.FC<Partial<GameUIProps>> = ({
  villageHealth = 100,
  playerHealth = 100,
  currentWeapon = 'Sword',
  dayCycle = 'day',
  waveNumber = 0,
  buildMode = false,
  coins = 0,
  selectedBuilding = null,
  onStartGame
}) => {
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
    if (onStartGame) onStartGame();
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Game Start UI */}
      {!isStarted && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto">
          <div className="bg-white p-6 rounded-lg max-w-md text-center">
            <h1 className="text-3xl font-bold mb-4 text-pixel-green">Duskwood Guardians</h1>
            <p className="mb-6 text-gray-700">
              Defend your village from waves of enemies that attack at night. 
              Build defenses, upgrade your weapons, and survive as long as you can!
            </p>
            <ul className="text-left mb-6">
              <li className="mb-2">• <span className="font-bold">WASD</span> - Movement</li>
              <li className="mb-2">• <span className="font-bold">SPACE</span> - Attack</li>
              <li className="mb-2">• <span className="font-bold">E</span> - Switch weapon</li>
              <li className="mb-2">• <span className="font-bold">B</span> - Toggle build mode</li>
              <li className="mb-2">• <span className="font-bold">Q/R</span> - Select building type</li>
              <li className="mb-2">• <span className="font-bold">H</span> - Heal (20 coins)</li>
            </ul>
            <Button onClick={handleStart} className="bg-pixel-green hover:bg-pixel-green/80 text-white">
              Start Game
            </Button>
          </div>
        </div>
      )}

      {/* In-game UI */}
      {isStarted && (
        <>
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 bg-black/60 text-white p-2 flex justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {dayCycle === 'day' ? (
                  <Sun className="h-5 w-5 text-yellow-400 mr-1" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-300 mr-1" />
                )}
                <span className="capitalize">{dayCycle}</span>
              </div>
              <div className="flex items-center ml-3">
                <Coins className="h-5 w-5 text-yellow-400 mr-1" />
                <span className="font-semibold">{coins}</span>
              </div>
              {waveNumber > 0 && (
                <div className="ml-4 bg-red-500/70 px-2 py-1 rounded-md text-xs font-bold animate-pulse-pixel">
                  Wave {waveNumber}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {buildMode && (
                <div className="bg-blue-500/70 px-2 py-1 rounded-md text-xs">
                  Build Mode
                </div>
              )}
              <div className="flex items-center">
                <Sword className="h-4 w-4 mr-1" />
                {currentWeapon}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 flex justify-between">
            <div className="flex flex-col w-1/3">
              <div className="text-xs mb-1">Player Health</div>
              <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-red-400" 
                  style={{ width: `${playerHealth}%` }}
                ></div>
              </div>
            </div>
            <div className="flex flex-col w-1/3 ml-4">
              <div className="text-xs mb-1">Village Health</div>
              <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400" 
                  style={{ width: `${villageHealth}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Building Selection (when in build mode) */}
          {buildMode && selectedBuilding && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/70 text-white p-3 rounded-md">
              <div className="text-center font-bold mb-1">{selectedBuilding.name}</div>
              <div className="flex items-center justify-center mb-1">
                <Coins className="h-4 w-4 text-yellow-400 mr-1" />
                <span className={coins >= selectedBuilding.cost ? "text-green-400" : "text-red-400"}>
                  {selectedBuilding.cost}
                </span>
              </div>
              <div className="text-xs text-center opacity-80">{selectedBuilding.description}</div>
              <div className="text-xs text-center mt-1">Press Q/R to change building</div>
            </div>
          )}

          {/* Inventory Quickbar */}
          <div className="absolute bottom-16 left-0 right-0 flex justify-center">
            <div className="bg-black/50 border border-gray-700 rounded-md p-1 flex gap-1">
              <div className="bg-gray-800/80 p-1 rounded border border-gray-600 flex items-center justify-center w-12 h-12">
                <Sword className="h-8 w-8 text-gray-300" />
              </div>
              <div className="bg-gray-900/80 p-1 rounded border border-gray-700 flex items-center justify-center w-12 h-12">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <div className="bg-gray-900/80 p-1 rounded border border-gray-700 flex items-center justify-center w-12 h-12">
                <Building className="h-8 w-8 text-blue-300" />
              </div>
              <div className="bg-gray-900/80 p-1 rounded border border-gray-700 flex items-center justify-center w-12 h-12">
                <Ghost className="h-8 w-8 text-purple-300" />
              </div>
            </div>
          </div>

          {/* Controls Reminder */}
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/30 px-3 py-1 rounded-full">
            Press H to heal (20 coins)
          </div>
        </>
      )}
    </div>
  );
};

export default GameUI;
