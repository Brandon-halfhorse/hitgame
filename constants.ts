export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 64;
export const ENEMY_SIZE = 56;
export const BOSS_SIZE = 120;
export const ITEM_SIZE = 32;

export const PLAYER_SPEED = 6;
export const DASH_SPEED = 20;

// Weapon Configs
export const WEAPON_STATS = {
    FISTS: { damage: 15, cooldown: 20, range: 70, color: '#94a3b8' },
    SWORD: { damage: 35, cooldown: 25, range: 100, color: '#3b82f6' }, // Blue
    HAMMER: { damage: 60, cooldown: 50, range: 110, color: '#f59e0b' }, // Orange/Gold
    DUAL_BLADES: { damage: 20, cooldown: 12, range: 80, color: '#10b981' }, // Emerald
};

export const SKILL_COOLDOWN_AMBUSH = 180; // 3 seconds at 60fps
export const HEAL_COST = 50; // Cost in shards
export const HEAL_AMOUNT = 40;

// 3D Render style images
export const PLAYER_IMG = "https://images.unsplash.com/photo-1635468872214-8d30953f0057?q=80&w=200&auto=format&fit=crop"; 
export const ENEMY_IMG_BASE = "https://images.unsplash.com/photo-1592147318318-7712396b2706?q=80&w=200&auto=format&fit=crop";
export const BOSS_IMG = "https://images.unsplash.com/photo-1618516947932-51a824cb5879?q=80&w=300&auto=format&fit=crop";

export const LEVEL_CONFIG = {
  1: { enemyCount: 2, enemyHealth: 40, enemySpeed: 1.5, boss: false },
  2: { enemyCount: 4, enemyHealth: 50, enemySpeed: 2.5, boss: false },
  3: { enemyCount: 6, enemyHealth: 70, enemySpeed: 3.5, boss: false },
  4: { enemyCount: 8, enemyHealth: 90, enemySpeed: 4.5, boss: false },
  5: { enemyCount: 5, enemyHealth: 150, enemySpeed: 5.5, boss: true }, 
};