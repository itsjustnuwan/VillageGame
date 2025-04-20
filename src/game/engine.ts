
export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  update?: (delta: number) => void;
  render?: (ctx: CanvasRenderingContext2D) => void;
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  range: number;
  cooldown: number;
  lastUsed: number;
}

export interface Building {
  id: string;
  name: string;
  health: number;
  defense: number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lastAction?: number;
  actionInterval?: number;
}

export class Guard implements GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  damage: number;
  range: number;
  targetEnemy: GameObject | null = null;
  attackCooldown: number = 0;
  
  constructor(x: number, y: number) {
    this.id = `guard-${Date.now()}`;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.type = 'guard';
    this.damage = 5;
    this.range = 150;
  }
  
  update(delta: number) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // Draw guard body
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw guard head
    ctx.fillStyle = '#D7CCC8';
    ctx.fillRect(this.x + this.width / 4, this.y - this.height / 6, this.width / 2, this.height / 6);
  }
  
  setTarget(enemy: GameObject) {
    this.targetEnemy = enemy;
  }
  
  attack(): number {
    if (this.attackCooldown <= 0) {
      this.attackCooldown = 1.5; // 1.5 second cooldown between attacks
      return this.damage;
    }
    return 0;
  }
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameObjects: Map<string, GameObject>;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  private cycle: 'day' | 'night' = 'day';
  private cycleTime: number = 0;
  private cycleDuration: number = 60; // seconds for a full cycle
  private buildings: Building[] = [];
  private villageHealth: number = 100;
  private houses: Building[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.gameObjects = new Map();
    this.setupCanvas();
  }

  private setupCanvas() {
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Initialize village houses
    this.setupVillage();
  }
  
  private setupVillage() {
    // Create a layout of houses around the village center
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2 + 100;
    
    // Main village center
    const villageCenter: Building = {
      id: 'village-center',
      name: 'Village Center',
      health: 200,
      defense: 0,
      type: 'main',
      x: centerX - 50,
      y: centerY,
      width: 100,
      height: 80
    };
    this.buildings.push(villageCenter);
    
    // Add houses around the village center
    const housePositions = [
      { x: centerX - 150, y: centerY - 80 },
      { x: centerX + 80, y: centerY - 60 },
      { x: centerX - 180, y: centerY + 50 },
      { x: centerX + 120, y: centerY + 30 },
      { x: centerX - 80, y: centerY - 120 }
    ];
    
    housePositions.forEach((pos, index) => {
      const house: Building = {
        id: `house-${index}`,
        name: `Villager House ${index + 1}`,
        health: 100,
        defense: 0,
        type: 'house',
        x: pos.x,
        y: pos.y,
        width: 60,
        height: 50
      };
      this.buildings.push(house);
      this.houses.push(house);
    });
  }

  public addGameObject(gameObject: GameObject) {
    this.gameObjects.set(gameObject.id, gameObject);
  }

  public removeGameObject(id: string) {
    this.gameObjects.delete(id);
  }

  public getGameObjectById(id: string): GameObject | undefined {
    return this.gameObjects.get(id);
  }
  
  public addBuilding(building: Building) {
    this.buildings.push(building);
  }
  
  public getAllBuildings(): Building[] {
    return this.buildings;
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop(0);
    }
  }

  public stop() {
    this.isRunning = false;
  }

  public getDayCycleInfo() {
    return {
      cycle: this.cycle,
      progress: this.cycleTime / this.cycleDuration
    };
  }

  public getVillageHealth() {
    return this.villageHealth;
  }

  public damageVillage(amount: number) {
    this.villageHealth = Math.max(0, this.villageHealth - amount);
    return this.villageHealth <= 0;
  }

  private updateDayCycle(delta: number) {
    this.cycleTime += delta;
    if (this.cycleTime >= this.cycleDuration) {
      this.cycleTime = 0;
      this.cycle = this.cycle === 'day' ? 'night' : 'day';
    }
  }
  
  private updateBuildings(delta: number) {
    for (const building of this.buildings) {
      // Handle resource buildings generating coins
      if (building.type === 'resource' && building.lastAction !== undefined && building.actionInterval !== undefined) {
        building.lastAction += delta;
        if (building.lastAction >= building.actionInterval) {
          building.lastAction = 0;
          // Signal that resource was generated (handled by game controller)
          const customEvent = new CustomEvent('resource-generated', {
            detail: { buildingId: building.id }
          });
          document.dispatchEvent(customEvent);
        }
      }
    }
  }

  private gameLoop(timestamp: number) {
    if (!this.isRunning) return;

    const delta = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.update(delta);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(delta: number) {
    this.updateDayCycle(delta);
    this.updateBuildings(delta);
    
    // Update all game objects
    for (const gameObject of this.gameObjects.values()) {
      if (gameObject.update) {
        gameObject.update(delta);
      }
    }
  }

  private render() {
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background based on day/night cycle
    this.drawBackground();

    // Render all game objects
    for (const gameObject of this.gameObjects.values()) {
      if (gameObject.render) {
        gameObject.render(this.ctx);
      }
    }

    // Render buildings
    this.renderBuildings();
  }

  private drawBackground() {
    // Draw sky
    this.ctx.fillStyle = this.cycle === 'day' ? '#33C3F0' : '#1A1F2C';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

    // Draw ground
    this.ctx.fillStyle = this.cycle === 'day' ? '#F2FCE2' : '#222222';
    this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);

    // Draw sun or moon
    const celestialBodyX = this.canvas.width * (this.cycleTime / this.cycleDuration);
    const celestialBodyY = this.canvas.height * 0.2;
    const celestialBodyRadius = 30;

    this.ctx.beginPath();
    this.ctx.arc(celestialBodyX, celestialBodyY, celestialBodyRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.cycle === 'day' ? '#FFC107' : '#E0E0E0';
    this.ctx.fill();
  }
  
  private renderBuildings() {
    this.buildings.forEach(building => {
      switch (building.type) {
        case 'main':
          this.renderVillageCenter(building);
          break;
        case 'house':
          this.renderHouse(building);
          break;
        case 'defense':
          this.renderDefense(building);
          break;
        case 'resource':
          this.renderResource(building);
          break;
        case 'wall':
          this.renderWall(building);
          break;
        case 'guard-post':
          this.renderGuardPost(building);
          break;
        default:
          // Fallback rendering
          this.ctx.fillStyle = '#4FC3F7';
          this.ctx.fillRect(building.x, building.y, building.width, building.height);
      }
      
      // Render building health bar
      this.renderBuildingHealth(building);
    });
  }
  
  private renderVillageCenter(building: Building) {
    // Draw main building body
    this.ctx.fillStyle = '#6D4C41';
    this.ctx.fillRect(building.x, building.y, building.width, building.height);
    
    // Draw roof
    this.ctx.beginPath();
    this.ctx.moveTo(building.x - 10, building.y);
    this.ctx.lineTo(building.x + building.width / 2, building.y - 40);
    this.ctx.lineTo(building.x + building.width + 10, building.y);
    this.ctx.closePath();
    this.ctx.fillStyle = '#D32F2F';
    this.ctx.fill();
    
    // Draw door
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(building.x + building.width / 2 - 10, building.y + building.height - 30, 20, 30);
    
    // Draw windows
    this.ctx.fillStyle = '#FFF9C4';
    this.ctx.fillRect(building.x + 15, building.y + 15, 20, 20);
    this.ctx.fillRect(building.x + building.width - 35, building.y + 15, 20, 20);
    
    // Draw flag
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(building.x + building.width / 2, building.y - 40, 5, 40);
    this.ctx.fillStyle = '#FFEB3B';
    this.ctx.beginPath();
    this.ctx.moveTo(building.x + building.width / 2 + 5, building.y - 40);
    this.ctx.lineTo(building.x + building.width / 2 + 25, building.y - 30);
    this.ctx.lineTo(building.x + building.width / 2 + 5, building.y - 20);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  private renderHouse(building: Building) {
    // Draw house body
    this.ctx.fillStyle = '#8D6E63';
    this.ctx.fillRect(building.x, building.y, building.width, building.height);
    
    // Draw roof
    this.ctx.beginPath();
    this.ctx.moveTo(building.x - 5, building.y);
    this.ctx.lineTo(building.x + building.width / 2, building.y - 20);
    this.ctx.lineTo(building.x + building.width + 5, building.y);
    this.ctx.closePath();
    this.ctx.fillStyle = '#795548';
    this.ctx.fill();
    
    // Draw door
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(building.x + building.width / 2 - 7, building.y + building.height - 20, 14, 20);
    
    // Draw window
    this.ctx.fillStyle = '#BBDEFB';
    this.ctx.fillRect(building.x + 10, building.y + 10, 15, 15);
    this.ctx.fillRect(building.x + building.width - 25, building.y + 10, 15, 15);
  }
  
  private renderDefense(building: Building) {
    // Draw defense tower base
    this.ctx.fillStyle = '#78909C';
    this.ctx.fillRect(building.x, building.y + building.height / 3, building.width, building.height * 2 / 3);
    
    // Draw tower top
    this.ctx.fillStyle = '#8B5CF6';
    this.ctx.fillRect(building.x + 5, building.y, building.width - 10, building.height / 3);
    
    // Draw firing point
    this.ctx.beginPath();
    this.ctx.arc(building.x + building.width / 2, building.y + building.height / 6, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#F44336';
    this.ctx.fill();
  }
  
  private renderResource(building: Building) {
    // Draw resource building base
    this.ctx.fillStyle = '#A1887F';
    this.ctx.fillRect(building.x, building.y, building.width, building.height);
    
    // Draw mining symbol
    this.ctx.fillStyle = '#FFEB3B';
    this.ctx.beginPath();
    this.ctx.moveTo(building.x + building.width / 2, building.y + 5);
    this.ctx.lineTo(building.x + building.width - 10, building.y + building.height / 2);
    this.ctx.lineTo(building.x + building.width / 2, building.y + building.height - 5);
    this.ctx.lineTo(building.x + 10, building.y + building.height / 2);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  private renderWall(building: Building) {
    // Draw stone wall
    this.ctx.fillStyle = '#757575';
    this.ctx.fillRect(building.x, building.y, building.width, building.height);
    
    // Draw wall pattern
    this.ctx.fillStyle = '#616161';
    for (let i = 0; i < building.width; i += 10) {
      for (let j = 0; j < building.height; j += 5) {
        if ((i + j) % 2 === 0) {
          this.ctx.fillRect(building.x + i, building.y + j, 5, 5);
        }
      }
    }
  }
  
  private renderGuardPost(building: Building) {
    // Draw guard post platform
    this.ctx.fillStyle = '#5D4037';
    this.ctx.fillRect(building.x, building.y + building.height / 2, building.width, building.height / 2);
    
    // Draw guard post tower
    this.ctx.fillStyle = '#8D6E63';
    this.ctx.fillRect(building.x + building.width / 4, building.y, building.width / 2, building.height / 2);
    
    // Draw flag
    this.ctx.fillStyle = '#689F38';
    this.ctx.fillRect(building.x + building.width * 3 / 4, building.y, 3, building.height / 2);
    this.ctx.fillStyle = '#CDDC39';
    this.ctx.beginPath();
    this.ctx.moveTo(building.x + building.width * 3 / 4 + 3, building.y);
    this.ctx.lineTo(building.x + building.width, building.y + 10);
    this.ctx.lineTo(building.x + building.width * 3 / 4 + 3, building.y + 20);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  private renderBuildingHealth(building: Building) {
    // Only render health bar if not at full health
    if (building.health < 200) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(building.x, building.y - 10, building.width, 5);
      
      const healthPercent = building.health / 200;
      this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
      this.ctx.fillRect(building.x, building.y - 10, building.width * healthPercent, 5);
    }
  }
}
