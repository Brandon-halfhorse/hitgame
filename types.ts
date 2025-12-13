export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY_MELEE = 'ENEMY_MELEE',
  ENEMY_BOSS = 'ENEMY_BOSS'
}

export enum WeaponType {
  FISTS = 'FISTS',
  SWORD = 'SWORD', // Balanced
  HAMMER = 'HAMMER', // Slow, High Dmg, Knockback
  DUAL_BLADES = 'DUAL_BLADES' // Fast, Low Dmg
}

export interface Position {
  x: number;
  y: number;
}

export interface Item {
  id: number;
  type: 'WEAPON' | 'HEALTH_PACK' | 'CURRENCY';
  subtype?: WeaponType;
  amount?: number; // For currency or healing amount
  pos: Position;
  size: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  size: number;
  speed: number;
  health: number;
  maxHealth: number;
  
  // Combat stats
  weapon: WeaponType;
  damage: number;
  attackCooldown: number;
  maxAttackCooldown: number;
  
  // States
  isAttacking?: boolean;
  hitFlashTimer?: number;
  facing: 'left' | 'right';
  visualUrl: string;
  
  // Skills
  dashCooldown?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // Frames to live
  velocity: { x: number; y: number };
}

export interface GameState {
  player: Entity;
  enemies: Entity[];
  items: Item[];
  particles: FloatingText[];
  level: number;
  score: number;
  currency: number; // New: Data Shards
  status: GameStatus;
  gameBounds: { width: number; height: number };
  loreText: string;
  shakeIntensity: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  skill1: boolean; // Ambush
  buy: boolean; // Buy health
}