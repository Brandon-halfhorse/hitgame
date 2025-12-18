
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 110; 
export const ENEMY_SIZE = 100;
export const BOSS_SIZE = 240;
export const ITEM_SIZE = 50;

export const PLAYER_SPEED = 9; 
export const DASH_SPEED = 28;

// THEME COLORS: High-Vibrancy Cyberpunk
export const COLOR_NEON_PURPLE = '#df24ff'; // 极光紫 (更亮)
export const COLOR_NEON_GREEN = '#39ff14';  // 荧光绿
export const COLOR_NEON_CYAN = '#00f3ff';   // 电子青
export const COLOR_STREET_DARK = '#020204';

export const WEAPON_STATS = {
    FISTS: { name: '量子拳套', damage: 30, cooldown: 18, range: 75, color: '#ffffff' },
    SWORD: { name: '离子光剑', damage: 75, cooldown: 20, range: 130, color: COLOR_NEON_GREEN }, 
    HAMMER: { name: '重核粉碎者', damage: 140, cooldown: 55, range: 150, color: '#ff9f0a' }, 
    DUAL_BLADES: { name: '等离子弧刃', damage: 55, cooldown: 10, range: 110, color: COLOR_NEON_CYAN }, 
};

export const SKILL_COOLDOWN_AMBUSH = 150; 
export const HEAL_COST = 60; 
export const HEAL_AMOUNT = 50;
export const UPGRADE_COST_BASE = 150;

// ASSETS: High-Stability AI Prompts
export const PLAYER_IMG = "https://image.pollinations.ai/prompt/3d%20cyberpunk%20anime%20girl%20soldier%20neon%20purple%20exoskeleton%20armor%20short%20glowing%20hair%20full%20body%20white%20background?width=512&height=512&nologo=true"; 

export const ENEMY_IMG_BASE = "https://image.pollinations.ai/prompt/3d%20anime%20gangster%20punk%20cyborg%20parts%20yellow%20hair%20angry%20full%20body%20white%20background?width=512&height=512&nologo=true";

export const BOSS_IMG = "https://image.pollinations.ai/prompt/3d%20anime%20huge%20cyborg%20fat%20man%20boss%20red%20spiky%20hair%20exposed%20belly%20cybernetic%20red%20coat%20holding%20energy%20bottle%20angry%20white%20background?width=512&height=512&nologo=true";

export const LEVEL_CONFIG = {
    1: { enemyCount: 3, enemySpeed: 2.5, enemyHealth: 70, boss: false },
    2: { enemyCount: 5, enemySpeed: 3.0, enemyHealth: 100, boss: false },
    3: { enemyCount: 7, enemySpeed: 3.5, enemyHealth: 140, boss: false },
    4: { enemyCount: 9, enemySpeed: 4.0, enemyHealth: 180, boss: false },
    5: { enemyCount: 2, enemySpeed: 4.8, enemyHealth: 800, boss: true },
};
