
import { GameEngine, Building, Guard } from './engine';
import { Player, BuildingType } from './player';
import { Enemy } from './enemy';
import { toast } from 'sonner';

export class GameController {
  private engine: GameEngine;
  private player: Player;
  private keysPressed: Set<string> = new Set();
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private enemies: Enemy[] = [];
  private guards: Guard[] = [];
  private waveNumber: number = 0;
  private buildMode: boolean = false;
  private gameOver: boolean = false;
  private resourceTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new GameEngine(canvas);
    
    // Create player in the middle of the screen
    this.player = new Player(canvas.width / 2 - 16, canvas.height / 2);
    this.engine.addGameObject(this.player);
    
    this.setupEventListeners(canvas);
    this.setupResourceGeneration();
  }

  public start() {
    this.engine.start();
    this.spawnWave();
    toast('Night is coming! Get ready to defend your village!', {
      description: 'Use WASD to move, SPACE to attack, and E to switch weapons',
    });
  }

  public stop() {
    this.engine.stop();
  }
  
  private setupResourceGeneration() {
    document.addEventListener('resource-generated', (e: any) => {
      const buildingId = e.detail.buildingId;
      // Add coins for the player
      this.player.addCoins(5);
      toast(`+5 coins generated from resource building`);
    });
  }
  
  private setupEventListeners(canvas: HTMLCanvasElement) {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.key.toLowerCase());
      
      // Handle single key presses
      switch (e.key.toLowerCase()) {
        case ' ':
          // Attack
          if (this.player.attack()) {
            // Check for enemy hits
            this.checkEnemyHits();
          }
          break;
        case 'e':
          // Switch weapon
          this.player.switchWeapon();
          const currentWeapon = this.player.getCurrentWeapon();
          toast(`Switched to ${currentWeapon.name}`);
          break;
        case 'b':
          // Toggle build mode
          this.buildMode = !this.buildMode;
          toast(this.buildMode ? 'Build Mode: ON' : 'Build Mode: OFF');
          break;
        case 'q':
          // Previous building selection
          if (this.buildMode) {
            const building = this.player.previousBuilding();
            toast(`Selected: ${building.name} (${building.cost} coins)`);
          }
          break;
        case 'r':
          // Next building selection
          if (this.buildMode) {
            const building = this.player.nextBuilding();
            toast(`Selected: ${building.name} (${building.cost} coins)`);
          }
          break;
        case 'h':
          // Heal player (if they have enough coins)
          if (this.player.coins >= 20) {
            this.player.useCoins(20);
            this.player.heal(25);
            toast('Healed 25 health for 20 coins');
          } else {
            toast('Not enough coins to heal');
          }
          break;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });
    
    // Mouse input
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
    });
    
    canvas.addEventListener('click', (e) => {
      if (this.buildMode) {
        this.placeBuilding();
      }
    });
  }
  
  private placeBuilding() {
    const selectedBuilding = this.player.getSelectedBuilding();
    
    if (!this.player.canAffordCurrentBuilding()) {
      toast(`Not enough coins to place ${selectedBuilding.name}`);
      return;
    }
    
    const buildingSize = { width: 40, height: 40 };
    
    if (selectedBuilding.type === 'guard-post') {
      buildingSize.width = 50;
      buildingSize.height = 60;
    }
    
    // Check if there's enough space to place the building
    const buildingX = this.mousePosition.x - buildingSize.width / 2;
    const buildingY = this.mousePosition.y - buildingSize.height / 2;
    
    // Check for collisions with existing buildings
    const buildings = this.engine.getAllBuildings();
    for (const building of buildings) {
      if (
        buildingX < building.x + building.width &&
        buildingX + buildingSize.width > building.x &&
        buildingY < building.y + building.height &&
        buildingY + buildingSize.height > building.y
      ) {
        toast('Cannot place building here - overlaps with another building');
        return;
      }
    }
    
    // Spend coins
    this.player.useCoins(selectedBuilding.cost);
    
    const newBuilding: Building = {
      id: `building-${Date.now()}`,
      name: selectedBuilding.name,
      health: selectedBuilding.health,
      defense: selectedBuilding.defense || 0,
      type: selectedBuilding.type,
      x: buildingX,
      y: buildingY,
      width: buildingSize.width,
      height: buildingSize.height
    };
    
    // If it's a resource building, add timer for generating resources
    if (selectedBuilding.type === 'resource') {
      newBuilding.lastAction = 0;
      newBuilding.actionInterval = 10; // Generate resources every 10 seconds
    }
    
    // If it's a guard post, spawn a guard
    if (selectedBuilding.type === 'guard-post') {
      setTimeout(() => {
        const guard = new Guard(
          newBuilding.x + newBuilding.width / 2,
          newBuilding.y + newBuilding.height
        );
        this.guards.push(guard);
        this.engine.addGameObject(guard);
        toast('Guard spawned from guard post');
      }, 2000);
    }
    
    this.engine.addBuilding(newBuilding);
    toast(`Placed a ${selectedBuilding.name} for ${selectedBuilding.cost} coins`);
  }
  
  private checkEnemyHits() {
    const weapon = this.player.getCurrentWeapon();
    const attackRange = weapon.range;
    const attackDirection = this.player.direction;
    let attackArea;
    
    if (attackDirection === 'right') {
      attackArea = {
        x: this.player.x + this.player.width,
        y: this.player.y,
        width: attackRange,
        height: this.player.height
      };
    } else {
      attackArea = {
        x: this.player.x - attackRange,
        y: this.player.y,
        width: attackRange,
        height: this.player.height
      };
    }
    
    for (const enemy of this.enemies) {
      if (this.checkCollision(attackArea, enemy)) {
        const isDead = enemy.takeDamage(weapon.damage);
        if (isDead) {
          // Collect coins from defeated enemy
          const coinsRewarded = enemy.getReward();
          this.player.addCoins(coinsRewarded);
          toast(`+${coinsRewarded} coins from defeated enemy`);
          
          const index = this.enemies.indexOf(enemy);
          if (index !== -1) {
            this.enemies.splice(index, 1);
            this.engine.removeGameObject(enemy.id);
          }
        }
      }
    }
  }
  
  private checkCollision(rect1: { x: number, y: number, width: number, height: number }, 
                         rect2: { x: number, y: number, width: number, height: number }) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  private spawnWave() {
    // Check if we should spawn enemies (only at night)
    setInterval(() => {
      const { cycle } = this.engine.getDayCycleInfo();
      
      if (cycle === 'night' && !this.gameOver) {
        this.waveNumber++;
        const enemyCount = 3 + Math.floor(this.waveNumber / 2);
        
        toast(`Wave ${this.waveNumber} incoming!`, {
          description: `${enemyCount} enemies are approaching the village!`
        });
        
        // Spawn enemies at the edges of the screen
        for (let i = 0; i < enemyCount; i++) {
          setTimeout(() => this.spawnEnemy(), i * 2000);
        }
      }
    }, 60000); // Check every minute
    
    // Update enemies
    setInterval(() => {
      if (this.gameOver) return;
      
      this.updateEnemies();
      this.updateGuards();
      this.checkVillageStatus();
    }, 1000 / 60); // 60 fps check
  }
  
  private spawnEnemy() {
    if (this.gameOver) return;
    
    const canvas = this.engine['canvas'];
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    let x, y;
    
    // Determine enemy type based on wave number
    let enemyTypes: Array<'zombie' | 'skeleton' | 'ghost' | 'bat' | 'slime' | 'dragon'> = ['zombie', 'skeleton'];
    
    if (this.waveNumber >= 2) {
      enemyTypes.push('ghost', 'bat');
    }
    
    if (this.waveNumber >= 4) {
      enemyTypes.push('slime');
    }
    
    if (this.waveNumber >= 6) {
      enemyTypes.push('dragon');
    }
    
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    switch (edge) {
      case 0: // Top
        x = Math.random() * canvas.width;
        y = -50;
        break;
      case 1: // Right
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
        break;
      case 2: // Bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
        break;
      case 3: // Left
        x = -50;
        y = Math.random() * canvas.height;
        break;
      default:
        x = -50;
        y = -50;
    }
    
    const enemy = new Enemy(x, y, enemyType);
    
    // Target the player or a random building
    const targetBuilding = Math.random() < 0.7; // 70% chance to target a building
    
    if (targetBuilding) {
      // Get a building to target
      const buildings = this.engine['buildings'];
      if (buildings.length > 0) {
        const building = buildings[Math.floor(Math.random() * buildings.length)];
        enemy.setTarget(building.x + building.width / 2, building.y + building.height / 2);
      } else {
        enemy.setTarget(this.player.x, this.player.y);
      }
    } else {
      enemy.setTarget(this.player.x, this.player.y);
    }
    
    this.enemies.push(enemy);
    this.engine.addGameObject(enemy);
  }
  
  private updateEnemies() {
    // Handle enemy movement, attacks, and targeting
    for (const enemy of this.enemies) {
      // Check collision with player
      if (this.checkCollision(enemy, this.player)) {
        const damage = enemy.attack();
        if (damage > 0) {
          const isDead = this.player.takeDamage(damage);
          
          if (isDead) {
            this.endGame('Player died! The village is lost!');
          }
        }
      }
      
      // Check collision with buildings
      for (const building of this.engine['buildings']) {
        if (this.checkCollision(enemy, building)) {
          const damage = enemy.attack();
          if (damage > 0) {
            building.health -= damage;
            
            if (building.health <= 0) {
              // Remove building
              const index = this.engine['buildings'].indexOf(building);
              if (index !== -1) {
                this.engine['buildings'].splice(index, 1);
                
                if (building.type === 'main') {
                  // Village center destroyed!
                  this.endGame('Village center destroyed! Game over!');
                } else {
                  toast(`A ${building.name} was destroyed!`);
                }
              }
            }
          }
          break;
        }
      }
    }
  }
  
  private updateGuards() {
    // Update guards to target and attack nearby enemies
    for (const guard of this.guards) {
      // Find the nearest enemy within range
      let nearestEnemy = null;
      let shortestDistance = guard.range;
      
      for (const enemy of this.enemies) {
        const dx = enemy.x - guard.x;
        const dy = enemy.y - guard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestEnemy = enemy;
        }
      }
      
      if (nearestEnemy) {
        guard.setTarget(nearestEnemy);
        
        // Attack the enemy if in range
        const damage = guard.attack();
        if (damage > 0) {
          const isDead = nearestEnemy.takeDamage(damage);
          if (isDead) {
            const index = this.enemies.indexOf(nearestEnemy);
            if (index !== -1) {
              this.enemies.splice(index, 1);
              this.engine.removeGameObject(nearestEnemy.id);
            }
          }
        }
      }
    }
  }
  
  private checkVillageStatus() {
    // Process player input
    if (this.keysPressed.has('w')) {
      this.player.y -= this.player.speed / 60;
    }
    if (this.keysPressed.has('s')) {
      this.player.y += this.player.speed / 60;
    }
    if (this.keysPressed.has('a')) {
      this.player.moveLeft(1/60);
    }
    if (this.keysPressed.has('d')) {
      this.player.moveRight(1/60);
    }
    
    // Check village health
    const villageHealth = this.engine.getVillageHealth();
    
    if (villageHealth <= 0) {
      this.endGame('Village health depleted! Game over!');
    }
  }
  
  private endGame(message: string) {
    if (this.gameOver) return;
    
    this.gameOver = true;
    toast(message, {
      description: 'Refresh to start a new game.',
      duration: 5000
    });
    
    // Stop game loop
    this.engine.stop();
  }
}
