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

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  size: number;
  speed: number;
  health: number;
  maxHealth: number;
  damage: number;
  isAttacking?: boolean;
  attackCooldown?: number;
  hitFlashTimer?: number; // For visual feedback when hit
  facing: 'left' | 'right';
  visualUrl: string; 
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
  particles: FloatingText[];
  level: number;
  score: number;
  status: GameStatus;
  gameBounds: { width: number; height: number };
  loreText: string;
  shakeIntensity: number; // Screen shake effect
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
}