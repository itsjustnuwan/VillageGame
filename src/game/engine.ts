
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.gameObjects = new Map();
    this.setupCanvas();
  }

  private setupCanvas() {
    this.canvas.width = 800;
    this.canvas.height = 600;
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
    this.buildings.forEach(building => {
      this.ctx.fillStyle = building.type === 'defense' ? '#8B5CF6' : '#4FC3F7';
      this.ctx.fillRect(building.x, building.y, building.width, building.height);
    });
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
}
