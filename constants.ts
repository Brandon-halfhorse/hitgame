
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 110; 
export const ENEMY_SIZE = 100;
export const BOSS_SIZE = 220;
export const ITEM_SIZE = 45;

export const PLAYER_SPEED = 9; 
export const DASH_SPEED = 28;

// THEME COLORS
export const COLOR_WHEAT = '#f5deb3';
export const COLOR_GREEN = '#22c55e';
export const COLOR_PURPLE = '#a855f7'; // 紫岚 - 紫

export const WEAPON_STATS = {
    FISTS: { damage: 25, cooldown: 18, range: 75, color: COLOR_WHEAT },
    SWORD: { damage: 60, cooldown: 22, range: 115, color: COLOR_GREEN }, 
    HAMMER: { damage: 110, cooldown: 55, range: 135, color: '#d97706' }, 
    DUAL_BLADES: { damage: 40, cooldown: 12, range: 100, color: '#84cc16' }, 
};

export const SKILL_COOLDOWN_AMBUSH = 150; 
export const HEAL_COST = 40; 
export const HEAL_AMOUNT = 50;
export const UPGRADE_COST_BASE = 100;

// ASSETS: Specific AI Prompts
// 特种兵双眼健全
export const PLAYER_IMG = "https://image.pollinations.ai/prompt/3d%20anime%20girl%20special%20forces%20soldier%20uniform%20two%20functional%20healthy%20eyes%20open%20no%20eyepatch%20holding%20flare%20gun%20standing%20full%20body%20white%20background?width=512&height=512&nologo=true"; 

export const ENEMY_IMG_BASE = "https://image.pollinations.ai/prompt/3d%20anime%20thug%20messy%20yellow%20hair%20tattered%20clothes%20angry%20holding%20blue%20flare%20gun%20full%20body%20white%20background?width=512&height=512&nologo=true";

// BOSS: 炸毛红发、露肚皮、肥胖男人、红色爆炸外衫、啤酒瓶
export const BOSS_IMG = "https://image.pollinations.ai/prompt/3d%20anime%20very%20fat%20man%20boss%20messy%20spiky%20red%20hair%20exposed%20belly%20holding%20beer%20bottle%20wearing%20red%20bomber%20jacket%20angry%20standing%20full%20body%20white%20background?width=512&height=512&nologo=true";

export const LEVEL_CONFIG = {
    1: { enemyCount: 3, enemySpeed: 2.3, enemyHealth: 60, boss: false },
    2: { enemyCount: 5, enemySpeed: 2.7, enemyHealth: 85, boss: false },
    3: { enemyCount: 6, enemySpeed: 3.3, enemyHealth: 120, boss: false },
    4: { enemyCount: 8, enemySpeed: 3.8, enemyHealth: 150, boss: false },
    5: { enemyCount: 2, enemySpeed: 4.5, enemyHealth: 500, boss: true },
};
