
import { GameObject } from "./engine";

export interface EnemyConfig {
  type: 'zombie' | 'skeleton' | 'ghost';
  speed: number;
  health: number;
  damage: number;
  color: string;
}

const ENEMY_TYPES: Record<string, EnemyConfig> = {
  zombie: {
    type: 'zombie',
    speed: 50,
    health: 30,
    damage: 5,
    color: '#58B368'
  },
  skeleton: {
    type: 'skeleton',
    speed: 70,
    health: 20,
    damage: 7,
    color: '#E0E0E0'
  },
  ghost: {
    type: 'ghost',
    speed: 90,
    health: 15,
    damage: 10,
    color: '#81D4FA'
  }
};

let enemyCounter = 0;

export class Enemy implements GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  speed: number;
  health: number;
  maxHealth: number;
  damage: number;
  color: string;
  target: { x: number, y: number } | null = null;
  attackCooldown: number = 0;
  
  constructor(x: number, y: number, type: 'zombie' | 'skeleton' | 'ghost' = 'zombie') {
    const config = ENEMY_TYPES[type];
    
    this.id = `enemy-${enemyCounter++}`;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 45;
    this.type = 'enemy';
    this.speed = config.speed;
    this.health = config.health;
    this.maxHealth = config.health;
    this.damage = config.damage;
    this.color = config.color;
  }
  
  update(delta: number) {
    // Move towards target if it exists
    if (this.target) {
      const dx = this.target.x - (this.x + this.width / 2);
      const dy = this.target.y - (this.y + this.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        this.x += (dx / distance) * this.speed * delta;
        this.y += (dy / distance) * this.speed * delta;
      }
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    // Draw enemy body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw enemy head
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x + this.width / 4, this.y - this.height / 6, this.width / 2, this.height / 6);
    
    // Draw health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x, this.y - 10, this.width, 5);
    
    ctx.fillStyle = '#F44336';
    ctx.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 5);
  }
  
  setTarget(x: number, y: number) {
    this.target = { x, y };
  }
  
  attack(): number {
    if (this.attackCooldown <= 0) {
      this.attackCooldown = 1; // 1 second cooldown between attacks
      return this.damage;
    }
    return 0;
  }
  
  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }
}
