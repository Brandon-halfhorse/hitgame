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
  SWORD = 'SWORD', 
  HAMMER = 'HAMMER', 
  DUAL_BLADES = 'DUAL_BLADES'
}

export interface Position {
  x: number;
  y: number;
}

export interface Item {
  id: number;
  type: 'WEAPON' | 'HEALTH_PACK' | 'CURRENCY';
  subtype?: WeaponType;
  amount?: number;
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
  
  weapon: WeaponType;
  damage: number;
  attackCooldown: number;
  maxAttackCooldown: number;
  
  isAttacking?: boolean;
  isMoving?: boolean;
  hitFlashTimer?: number;
  facing: 'left' | 'right';
  visualUrl: string;
  
  dashCooldown?: number;
  upgradeLevel?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  velocity: { x: number; y: number };
}

export interface GameState {
  player: Entity;
  enemies: Entity[];
  items: Item[];
  particles: FloatingText[];
  level: number;
  score: number;
  currency: number;
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
  skill1: boolean;
  buy: boolean;
  upgrade: boolean;
}