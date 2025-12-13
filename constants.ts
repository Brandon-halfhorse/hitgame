export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 64;
export const ENEMY_SIZE = 56;
export const BOSS_SIZE = 120;

export const PLAYER_SPEED = 6;
export const ATTACK_RANGE = 90;
export const ATTACK_COOLDOWN = 15; // Faster combat

// 3D Render style images
export const PLAYER_IMG = "https://images.unsplash.com/photo-1635468872214-8d30953f0057?q=80&w=200&auto=format&fit=crop"; // Cyberpunk helmet / 3D look
export const ENEMY_IMG_BASE = "https://images.unsplash.com/photo-1592147318318-7712396b2706?q=80&w=200&auto=format&fit=crop"; // Robot/Drone look
export const BOSS_IMG = "https://images.unsplash.com/photo-1618516947932-51a824cb5879?q=80&w=300&auto=format&fit=crop"; // Abstract dark 3D shape

export const LEVEL_CONFIG = {
  // Level 1: Very slow, tutorial pace
  1: { enemyCount: 2, enemyHealth: 30, enemySpeed: 1.5, boss: false },
  // Level 2: Slightly faster
  2: { enemyCount: 4, enemyHealth: 40, enemySpeed: 2.5, boss: false },
  // Level 3: Moderate speed
  3: { enemyCount: 6, enemyHealth: 60, enemySpeed: 3.5, boss: false },
  // Level 4: Fast, swarming
  4: { enemyCount: 8, enemyHealth: 80, enemySpeed: 4.5, boss: false },
  // Level 5: Very fast + Boss
  5: { enemyCount: 5, enemyHealth: 120, enemySpeed: 5.5, boss: true }, 
};