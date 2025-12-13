export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 72; // Slightly larger for better detail
export const ENEMY_SIZE = 64;
export const BOSS_SIZE = 140;
export const ITEM_SIZE = 40;

export const PLAYER_SPEED = 7; // Player slightly faster
export const DASH_SPEED = 22;

// Weapon Configs
export const WEAPON_STATS = {
    FISTS: { damage: 20, cooldown: 20, range: 70, color: '#94a3b8' }, // Buffed fists
    SWORD: { damage: 45, cooldown: 25, range: 110, color: '#3b82f6' }, 
    HAMMER: { damage: 80, cooldown: 55, range: 120, color: '#f59e0b' }, 
    DUAL_BLADES: { damage: 25, cooldown: 12, range: 90, color: '#10b981' }, 
};

export const SKILL_COOLDOWN_AMBUSH = 180; 
export const HEAL_COST = 40; // Cheaper heal
export const HEAL_AMOUNT = 50; // More heal

// 3D Style Assets (Cute 3D Render / Low Poly style)
// Player: Green/Teal hair 3D anime style
export const PLAYER_IMG = "https://img.freepik.com/premium-photo/cute-3d-anime-girl-with-green-hair-cat-ears-standing-full-body-isolated-background_890746-2489.jpg?w=740"; 

// Enemies: 3D Robots / Monsters
export const ENEMY_IMG_BASE = "https://img.freepik.com/premium-photo/cute-little-robot-character-3d-rendering_1240525-11606.jpg?w=360";
export const BOSS_IMG = "https://img.freepik.com/premium-photo/monster-creature-character-design-video-game-3d-illustration_717906-816.jpg?w=740";

export const LEVEL_CONFIG = {
  // Reduced speed (was 1.5 -> 1.0) and reduced count slightly for early levels
  1: { enemyCount: 2, enemyHealth: 30, enemySpeed: 1.0, boss: false },
  2: { enemyCount: 3, enemyHealth: 45, enemySpeed: 1.2, boss: false },
  3: { enemyCount: 5, enemyHealth: 60, enemySpeed: 1.5, boss: false },
  4: { enemyCount: 7, enemyHealth: 80, enemySpeed: 1.8, boss: false },
  5: { enemyCount: 4, enemyHealth: 120, enemySpeed: 2.0, boss: true }, 
};