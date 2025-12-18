
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 110; 
export const ENEMY_SIZE = 100;
export const BOSS_SIZE = 230;
export const ITEM_SIZE = 45;

export const PLAYER_SPEED = 9; 
export const DASH_SPEED = 28;

// THEME COLORS: Enhanced Cyber Street
export const COLOR_NEON_PURPLE = '#bf5af2';
export const COLOR_NEON_GREEN = '#32d74b';
export const COLOR_NEON_CYAN = '#5ac8fa';
export const COLOR_STREET_DARK = '#050508';

export const WEAPON_STATS = {
    FISTS: { damage: 25, cooldown: 18, range: 75, color: '#aaa' },
    SWORD: { damage: 65, cooldown: 20, range: 120, color: COLOR_NEON_GREEN }, 
    HAMMER: { damage: 120, cooldown: 50, range: 140, color: '#ff9f0a' }, 
    DUAL_BLADES: { damage: 45, cooldown: 10, range: 105, color: COLOR_NEON_CYAN }, 
};

export const SKILL_COOLDOWN_AMBUSH = 150; 
export const HEAL_COST = 50; 
export const HEAL_AMOUNT = 50;
export const UPGRADE_COST_BASE = 120;

/** 
 * ASSETS: Optimized Prompts for higher loading success rate.
 * We use shorter, more descriptive prompts and ensure "white background" is prominent.
 */
export const PLAYER_IMG = "https://image.pollinations.ai/prompt/3d%20anime%20girl%20soldier%20cyber%20armor%20purple%20theme%20two%20healthy%20eyes%20short%20hair%20full%20body%20white%20background?width=512&height=512&nologo=true"; 

export const ENEMY_IMG_BASE = "https://image.pollinations.ai/prompt/3d%20anime%20street%20thug%20punk%20yellow%20messy%20hair%20tattered%20clothes%20angry%20gangster%20full%20body%20white%20background?width=512&height=512&nologo=true";

export const BOSS_IMG = "https://image.pollinations.ai/prompt/3d%20anime%20huge%20obese%20man%20boss%20spiky%20red%20hair%20exposed%20belly%20red%20jacket%20beer%20bottle%20angry%20villain%20full%20body%20white%20background?width=512&height=512&nologo=true";

export const LEVEL_CONFIG = {
    1: { enemyCount: 3, enemySpeed: 2.3, enemyHealth: 60, boss: false },
    2: { enemyCount: 5, enemySpeed: 2.7, enemyHealth: 90, boss: false },
    3: { enemyCount: 7, enemySpeed: 3.3, enemyHealth: 130, boss: false },
    4: { enemyCount: 9, enemySpeed: 3.8, enemyHealth: 160, boss: false },
    5: { enemyCount: 2, enemySpeed: 4.5, enemyHealth: 600, boss: true },
};
