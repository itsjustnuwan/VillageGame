
import { GameObject, Weapon, Building } from "./engine";

export type BuildingType = {
  id: string;
  name: string;
  cost: number;
  type: string;
  defense?: number;
  health: number;
  description: string;
};

export type InventoryItem = BuildingType | Weapon;

export class Player implements GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  speed: number;
  direction: 'left' | 'right';
  weapons: Weapon[];
  currentWeapon: number;
  isAttacking: boolean;
  attackCooldown: number;
  health: number;
  maxHealth: number;
  coins: number;
  inventory: InventoryItem[];
  buildings: BuildingType[];
  selectedBuildingIndex: number;
  
  constructor(x: number, y: number) {
    this.id = 'player';
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 48;
    this.type = 'player';
    this.speed = 200;
    this.direction = 'right';
    this.weapons = [
      { id: 'sword', name: 'Sword', damage: 10, range: 50, cooldown: 0.5, lastUsed: 0 },
      { id: 'bow', name: 'Bow', damage: 5, range: 200, cooldown: 1, lastUsed: 0 },
    ];
    this.currentWeapon = 0;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.coins = 50; // Starting coins
    
    // Define available buildings
    this.buildings = [
      { 
        id: 'defense-tower', 
        name: 'Defense Tower', 
        cost: 25,
        type: 'defense',
        defense: 10,
        health: 100,
        description: 'Attacks nearby enemies automatically'
      },
      { 
        id: 'resource-building', 
        name: 'Resource Building', 
        cost: 40,
        type: 'resource',
        health: 80,
        description: 'Generates coins over time'
      },
      { 
        id: 'wall', 
        name: 'Wall', 
        cost: 15,
        type: 'defense',
        defense: 5,
        health: 150,
        description: 'Blocks enemy path'
      },
      { 
        id: 'guard-post', 
        name: 'Guard Post', 
        cost: 60,
        type: 'defense',
        defense: 15,
        health: 120,
        description: 'Spawns guards to help defend'
      }
    ];

    this.inventory = [...this.weapons, ...this.buildings];
    this.selectedBuildingIndex = 0;
  }

  update(delta: number) {
    // Handle attack cooldown
    if (this.isAttacking) {
      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0) {
        this.isAttacking = false;
      }
    }

    // Update weapon cooldowns
    this.weapons.forEach(weapon => {
      if (weapon.lastUsed > 0) {
        weapon.lastUsed = Math.max(0, weapon.lastUsed - delta);
      }
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    // Draw player body
    ctx.fillStyle = '#F44336'; // Red for player
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw player head
    ctx.fillStyle = '#FFCCBC';
    ctx.fillRect(this.x + this.width / 4, this.y - this.height / 4, this.width / 2, this.height / 4);
    
    // Draw weapon
    const currentWeapon = this.weapons[this.currentWeapon];
    const weaponLength = currentWeapon.id === 'sword' ? 20 : 15;
    
    ctx.fillStyle = currentWeapon.id === 'sword' ? '#9E9E9E' : '#8D6E63';
    
    if (this.direction === 'right') {
      ctx.fillRect(this.x + this.width, this.y + this.height / 2, weaponLength, 5);
    } else {
      ctx.fillRect(this.x - weaponLength, this.y + this.height / 2, weaponLength, 5);
    }
    
    // If attacking, draw attack animation
    if (this.isAttacking) {
      ctx.fillStyle = 'rgba(255, 235, 59, 0.5)';
      const range = this.weapons[this.currentWeapon].range;
      
      if (this.direction === 'right') {
        ctx.fillRect(this.x + this.width, this.y, range, this.height);
      } else {
        ctx.fillRect(this.x - range, this.y, range, this.height);
      }
    }
    
    // Draw health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x, this.y - 15, this.width, 5);
    
    ctx.fillStyle = this.health > 50 ? '#4CAF50' : this.health > 25 ? '#FFC107' : '#F44336';
    ctx.fillRect(this.x, this.y - 15, this.width * (this.health / this.maxHealth), 5);
  }
  
  moveLeft(delta: number) {
    this.x -= this.speed * delta;
    this.direction = 'left';
  }
  
  moveRight(delta: number) {
    this.x += this.speed * delta;
    this.direction = 'right';
  }
  
  attack() {
    const weapon = this.weapons[this.currentWeapon];
    
    if (weapon.lastUsed <= 0) {
      this.isAttacking = true;
      this.attackCooldown = 0.2; // Attack animation duration
      weapon.lastUsed = weapon.cooldown;
      return true;
    }
    
    return false;
  }
  
  switchWeapon() {
    this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length;
  }
  
  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }
  
  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  
  getCurrentWeapon() {
    return this.weapons[this.currentWeapon];
  }
  
  addCoins(amount: number) {
    this.coins += amount;
  }
  
  useCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      return true;
    }
    return false;
  }
  
  getSelectedBuilding(): BuildingType {
    return this.buildings[this.selectedBuildingIndex];
  }
  
  nextBuilding() {
    this.selectedBuildingIndex = (this.selectedBuildingIndex + 1) % this.buildings.length;
    return this.getSelectedBuilding();
  }
  
  previousBuilding() {
    this.selectedBuildingIndex = (this.selectedBuildingIndex - 1 + this.buildings.length) % this.buildings.length;
    return this.getSelectedBuilding();
  }
  
  canAffordCurrentBuilding(): boolean {
    return this.coins >= this.getSelectedBuilding().cost;
  }
}
