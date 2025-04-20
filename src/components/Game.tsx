
import React, { useEffect, useRef, useState } from 'react';
import GameUI from './GameUI';
import { GameController } from '../game/gameController';
import { BuildingType } from '../game/player';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameController, setGameController] = useState<GameController | null>(null);
  const [gameStats, setGameStats] = useState({
    villageHealth: 100,
    playerHealth: 100,
    currentWeapon: 'Sword',
    dayCycle: 'day',
    waveNumber: 0,
    buildMode: false,
    coins: 50,
    selectedBuilding: null as BuildingType | null
  });

  // Initialize game when component mounts
  useEffect(() => {
    if (!canvasRef.current) return;

    const controller = new GameController(canvasRef.current);
    setGameController(controller);

    // Update game stats every 500ms
    const intervalId = setInterval(() => {
      if (controller) {
        const dayCycleInfo = controller['engine']['getDayCycleInfo']();
        const player = controller['player'];
        const selectedBuilding = player.getSelectedBuilding();
        
        setGameStats({
          villageHealth: controller['engine']['getVillageHealth'](),
          playerHealth: player.health,
          currentWeapon: player.getCurrentWeapon().name,
          dayCycle: dayCycleInfo.cycle,
          waveNumber: controller['waveNumber'],
          buildMode: controller['buildMode'],
          coins: player.coins,
          selectedBuilding: controller['buildMode'] ? selectedBuilding : null
        });
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      if (gameController) {
        gameController.stop();
      }
    };
  }, []);

  const handleStartGame = () => {
    if (gameController) {
      gameController.start();
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex items-center justify-center overflow-hidden">
      <div className="relative border-4 border-gray-700 rounded-lg shadow-2xl">
        <canvas ref={canvasRef} className="block bg-black" width="800" height="600"></canvas>
        <GameUI
          villageHealth={gameStats.villageHealth}
          playerHealth={gameStats.playerHealth}
          currentWeapon={gameStats.currentWeapon}
          dayCycle={gameStats.dayCycle as 'day' | 'night'}
          waveNumber={gameStats.waveNumber}
          buildMode={gameStats.buildMode}
          coins={gameStats.coins}
          selectedBuilding={gameStats.selectedBuilding}
          onStartGame={handleStartGame}
        />
      </div>
      <div className="absolute bottom-2 left-0 right-0 text-center text-gray-400 text-xs">
        WASD to move • SPACE to attack • E to switch weapons • B for build mode • Q/R to select building
      </div>
    </div>
  );
};

export default Game;
