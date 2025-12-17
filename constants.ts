export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 72;
export const ENEMY_SIZE = 64;
export const BOSS_SIZE = 140;
export const ITEM_SIZE = 40;

// INCREASED SPEED for fast-paced street battle
export const PLAYER_SPEED = 9; 
export const DASH_SPEED = 28;

// Weapon Configs (High damage for lethal street combat)
export const WEAPON_STATS = {
    FISTS: { damage: 25, cooldown: 18, range: 70, color: '#94a3b8' },
    SWORD: { damage: 55, cooldown: 22, range: 110, color: '#3b82f6' }, 
    HAMMER: { damage: 90, cooldown: 50, range: 120, color: '#f59e0b' }, 
    DUAL_BLADES: { damage: 30, cooldown: 10, range: 90, color: '#10b981' }, 
};

export const SKILL_COOLDOWN_AMBUSH = 150; // Faster cooldown for skill
export const HEAL_COST = 50; 
export const HEAL_AMOUNT = 40;

// ASSETS: Street Runner / Cyberpunk Thugs
// Player: Streetwear Runner
export const PLAYER_IMG = "https://img.freepik.com/premium-photo/cool-anime-boy-streetwear-cyberpunk-style-3d-render-white-background_890746-19343.jpg?w=740"; 

// Enemies: Cyber Punks / Robots
export const ENEMY_IMG_BASE = "https://img.freepik.com/premium-photo/evil-cyborg-robot-soldier-3d-render-white-background_890746-17482.jpg?w=360";
export const BOSS_IMG = "https://img.freepik.com/premium-photo/massive-armored-mech-robot-boss-3d-render-isolated_890746-9281.jpg?w=740";

// DIFFICULTY: Much harder, faster enemies
export const LEVEL_CONFIG = {
  1: { enemyCount: 3, enemyHealth: 40, enemySpeed: 2.5, boss: false }, // Fast start
  2: { enemyCount: 4, enemyHealth: 60, enemySpeed: 3.2, boss: false },
  3: { enemyCount: 6, enemyHealth: 80, enemySpeed: 4.0, boss: false }, // Very fast
  4: { enemyCount: 8, enemyHealth: 100, enemySpeed: 4.8, boss: false }, // Swarm
  5: { enemyCount: 5, enemyHealth: 200, enemySpeed: 5.5, boss: true }, // Lethal
};