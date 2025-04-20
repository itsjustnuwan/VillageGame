
import { GameObject } from "./engine";

export interface EnemyConfig {
  type: 'zombie' | 'skeleton' | 'ghost' | 'bat' | 'slime' | 'dragon';
  speed: number;
  health: number;
  damage: number;
  color: string;
  isFlying: boolean;
  rewardCoins: number;
  animationSpeed: number;
}

const ENEMY_TYPES: Record<string, EnemyConfig> = {
  zombie: {
    type: 'zombie',
    speed: 50,
    health: 30,
    damage: 5,
    color: '#58B368',
    isFlying: false,
    rewardCoins: 5,
    animationSpeed: 0.5
  },
  skeleton: {
    type: 'skeleton',
    speed: 70,
    health: 20,
    damage: 7,
    color: '#E0E0E0',
    isFlying: false,
    rewardCoins: 8,
    animationSpeed: 0.7
  },
  ghost: {
    type: 'ghost',
    speed: 90,
    health: 15,
    damage: 10,
    color: '#81D4FA',
    isFlying: true,
    rewardCoins: 10,
    animationSpeed: 1.2
  },
  bat: {
    type: 'bat',
    speed: 110,
    health: 10,
    damage: 3,
    color: '#673AB7',
    isFlying: true,
    rewardCoins: 7,
    animationSpeed: 1.5
  },
  slime: {
    type: 'slime',
    speed: 40,
    health: 45,
    damage: 6,
    color: '#4CAF50',
    isFlying: false,
    rewardCoins: 12,
    animationSpeed: 0.3
  },
  dragon: {
    type: 'dragon',
    speed: 85,
    health: 100,
    damage: 15,
    color: '#F44336',
    isFlying: true,
    rewardCoins: 25,
    animationSpeed: 0.8
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
  isFlying: boolean;
  rewardCoins: number;
  animationCounter: number = 0;
  animationSpeed: number;
  animationFrame: number = 0;
  
  constructor(x: number, y: number, type: 'zombie' | 'skeleton' | 'ghost' | 'bat' | 'slime' | 'dragon' = 'zombie') {
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
    this.isFlying = config.isFlying;
    this.rewardCoins = config.rewardCoins;
    this.animationSpeed = config.animationSpeed;
  }
  
  update(delta: number) {
    // Update animation
    this.animationCounter += delta * this.animationSpeed;
    if (this.animationCounter >= 1) {
      this.animationCounter = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }

    // Flying enemies have wavy movement
    let offsetY = 0;
    if (this.isFlying) {
      offsetY = Math.sin(this.animationCounter * Math.PI * 2) * 5;
    }
    
    // Move towards target if it exists
    if (this.target) {
      const dx = this.target.x - (this.x + this.width / 2);
      const dy = this.target.y - (this.y + this.height / 2) + offsetY;
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
    // Apply floating effect for flying enemies
    const yOffset = this.isFlying ? Math.sin(Date.now() / 200) * 5 : 0;
    
    // Draw enemy based on type
    switch (ENEMY_TYPES[this.id.split('-')[1] as keyof typeof ENEMY_TYPES]?.type) {
      case 'bat':
        this.renderBat(ctx, yOffset);
        break;
      case 'slime':
        this.renderSlime(ctx, yOffset);
        break;
      case 'dragon':
        this.renderDragon(ctx, yOffset);
        break;
      case 'ghost':
        this.renderGhost(ctx, yOffset);
        break;
      default:
        this.renderDefault(ctx, yOffset);
        break;
    }
    
    // Draw health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x, this.y - 10 + yOffset, this.width, 5);
    
    ctx.fillStyle = '#F44336';
    ctx.fillRect(this.x, this.y - 10 + yOffset, this.width * (this.health / this.maxHealth), 5);
  }

  renderDefault(ctx: CanvasRenderingContext2D, yOffset: number) {
    // Draw enemy body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y + yOffset, this.width, this.height);
    
    // Draw enemy head
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x + this.width / 4, this.y - this.height / 6 + yOffset, this.width / 2, this.height / 6);
    
    // Draw animation (walking)
    const legOffset = Math.sin(this.animationCounter * Math.PI * 2) * 5;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x + 5, this.y + this.height + yOffset, 8, 5 + legOffset);
    ctx.fillRect(this.x + this.width - 13, this.y + this.height + yOffset, 8, 5 - legOffset);
  }

  renderGhost(ctx: CanvasRenderingContext2D, yOffset: number) {
    // Draw wavy ghost body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + yOffset);
    ctx.lineTo(this.x + this.width, this.y + yOffset);
    ctx.lineTo(this.x + this.width, this.y + this.height * 0.7 + yOffset);

    // Wavy bottom
    const waveHeight = 5;
    const segments = 3;
    for (let i = 0; i <= segments; i++) {
      const xPos = this.x + this.width - (i / segments) * this.width;
      const yPos = this.y + this.height * 0.7 + 
        Math.sin((this.animationCounter * Math.PI * 2) + (i / segments) * Math.PI) * waveHeight + yOffset;
      ctx.lineTo(xPos, yPos);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + this.width / 4, this.y + this.height / 3 + yOffset, 5, 5);
    ctx.fillRect(this.x + this.width * 3 / 4 - 5, this.y + this.height / 3 + yOffset, 5, 5);
  }

  renderBat(ctx: CanvasRenderingContext2D, yOffset: number) {
    // Draw bat body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2 + yOffset,
      this.width / 3,
      this.height / 4,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw wings based on animation frame
    const wingSpread = Math.abs(Math.sin(this.animationCounter * Math.PI * 2)) * 15;
    
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2 + yOffset);
    ctx.quadraticCurveTo(
      this.x + this.width / 2 - 15,
      this.y + this.height / 2 - wingSpread + yOffset,
      this.x - 5,
      this.y + this.height / 2 + yOffset
    );
    ctx.quadraticCurveTo(
      this.x + this.width / 4,
      this.y + this.height / 2 + 5 + yOffset,
      this.x + this.width / 2,
      this.y + this.height / 2 + yOffset
    );
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2 + yOffset);
    ctx.quadraticCurveTo(
      this.x + this.width / 2 + 15,
      this.y + this.height / 2 - wingSpread + yOffset,
      this.x + this.width + 5,
      this.y + this.height / 2 + yOffset
    );
    ctx.quadraticCurveTo(
      this.x + this.width * 3 / 4,
      this.y + this.height / 2 + 5 + yOffset,
      this.x + this.width / 2,
      this.y + this.height / 2 + yOffset
    );
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(this.x + this.width / 3, this.y + this.height / 2 - 2 + yOffset, 3, 3);
    ctx.fillRect(this.x + this.width * 2 / 3, this.y + this.height / 2 - 2 + yOffset, 3, 3);
  }

  renderSlime(ctx: CanvasRenderingContext2D, yOffset: number) {
    // Bouncing animation
    const bounceHeight = Math.sin(this.animationCounter * Math.PI) * 10;
    const squish = Math.cos(this.animationCounter * Math.PI);
    const height = this.height - Math.abs(bounceHeight);
    const width = this.width + Math.abs(squish * 10);
    
    // Draw slime body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(
      this.x + width / 2,
      this.y + height / 2 - bounceHeight / 2 + yOffset,
      width / 2,
      height / 2,
      0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + width / 3, this.y + height / 3 - bounceHeight / 2 + yOffset, 5, 5);
    ctx.fillRect(this.x + width * 2 / 3 - 5, this.y + height / 3 - bounceHeight / 2 + yOffset, 5, 5);
  }

  renderDragon(ctx: CanvasRenderingContext2D, yOffset: number) {
    // Draw dragon body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y + yOffset, this.width, this.height / 2);
    
    // Draw head
    ctx.beginPath();
    ctx.moveTo(this.x + this.width, this.y + this.height / 4 + yOffset);
    ctx.lineTo(this.x + this.width + 10, this.y + yOffset);
    ctx.lineTo(this.x + this.width + 10, this.y + this.height / 2 + yOffset);
    ctx.closePath();
    ctx.fill();
    
    // Draw wings
    const wingHeight = Math.sin(this.animationCounter * Math.PI * 2) * 15;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y + this.height / 4 + yOffset);
    ctx.lineTo(this.x + this.width / 2, this.y - wingHeight + yOffset);
    ctx.lineTo(this.x + this.width * 3 / 4, this.y + this.height / 4 + yOffset);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 4, this.y + this.height / 4 + yOffset);
    ctx.lineTo(this.x + this.width / 4, this.y - wingHeight + yOffset);
    ctx.lineTo(this.x, this.y + this.height / 4 + yOffset);
    ctx.closePath();
    ctx.fill();
    
    // Draw fire breath on animation
    if (this.animationFrame === 2 || this.animationFrame === 3) {
      ctx.fillStyle = '#FFA000';
      ctx.beginPath();
      ctx.moveTo(this.x + this.width + 10, this.y + this.height / 4 + yOffset);
      ctx.lineTo(this.x + this.width + 30, this.y - 5 + yOffset);
      ctx.lineTo(this.x + this.width + 30, this.y + this.height / 2 + 5 + yOffset);
      ctx.closePath();
      ctx.fill();
    }
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

  getReward(): number {
    return this.rewardCoins;
  }
}
