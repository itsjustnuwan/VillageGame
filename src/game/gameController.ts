
import { GameEngine, Building } from './engine';
import { Player } from './player';
import { Enemy } from './enemy';
import { toast } from 'sonner';

export class GameController {
  private engine: GameEngine;
  private player: Player;
  private keysPressed: Set<string> = new Set();
  private mousePosition: { x: number, y: number } = { x: 0, y: 0 };
  private enemies: Enemy[] = [];
  private waveNumber: number = 0;
  private buildMode: boolean = false;
  private selectedBuildingType: string = 'defense';
  private gameOver: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new GameEngine(canvas);
    
    // Create player in the middle of the screen
    this.player = new Player(canvas.width / 2 - 16, canvas.height / 2);
    this.engine.addGameObject(this.player);
    
    this.setupEventListeners(canvas);
    
    // Create initial buildings (village center)
    const villageCenter: Building = {
      id: 'village-center',
      name: 'Village Center',
      health: 200,
      defense: 0,
      type: 'main',
      x: canvas.width / 2 - 50,
      y: canvas.height / 2 + 100,
      width: 100,
      height: 80
    };
    
    this.engine.addBuilding(villageCenter);
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
        case '1':
          // Select defense building
          if (this.buildMode) {
            this.selectedBuildingType = 'defense';
            toast('Selected: Defense Tower');
          }
          break;
        case '2':
          // Select resource building
          if (this.buildMode) {
            this.selectedBuildingType = 'resource';
            toast('Selected: Resource Building');
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
    const buildingSize = { width: 40, height: 40 };
    
    const newBuilding: Building = {
      id: `building-${Date.now()}`,
      name: this.selectedBuildingType === 'defense' ? 'Defense Tower' : 'Resource Building',
      health: 100,
      defense: this.selectedBuildingType === 'defense' ? 10 : 0,
      type: this.selectedBuildingType,
      x: this.mousePosition.x - buildingSize.width / 2,
      y: this.mousePosition.y - buildingSize.height / 2,
      width: buildingSize.width,
      height: buildingSize.height
    };
    
    this.engine.addBuilding(newBuilding);
    toast(`Placed a ${newBuilding.name}`);
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
      this.checkVillageStatus();
    }, 1000 / 60); // 60 fps check
  }
  
  private spawnEnemy() {
    if (this.gameOver) return;
    
    const canvas = this.engine['canvas'];
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    let x, y;
    const types: Array<'zombie' | 'skeleton' | 'ghost'> = ['zombie', 'skeleton', 'ghost'];
    const enemyType = types[Math.floor(Math.random() * types.length)];
    
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
