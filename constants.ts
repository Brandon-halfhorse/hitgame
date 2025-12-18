export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 90;
export const ENEMY_SIZE = 80;
export const BOSS_SIZE = 160;
export const ITEM_SIZE = 40;

export const PLAYER_SPEED = 9; 
export const DASH_SPEED = 28;

// THEME COLORS
export const COLOR_WHEAT = '#f5deb3';
export const COLOR_GREEN = '#22c55e';
export const COLOR_DARK_GREEN = '#14532d';

export const WEAPON_STATS = {
    FISTS: { damage: 25, cooldown: 18, range: 70, color: COLOR_WHEAT },
    SWORD: { damage: 55, cooldown: 22, range: 110, color: COLOR_GREEN }, 
    HAMMER: { damage: 100, cooldown: 55, range: 130, color: '#d97706' }, 
    DUAL_BLADES: { damage: 35, cooldown: 12, range: 95, color: '#84cc16' }, 
};

export const SKILL_COOLDOWN_AMBUSH = 150; 
export const HEAL_COST = 40; 
export const HEAL_AMOUNT = 50;
export const UPGRADE_COST_BASE = 100;

// ASSETS: Specific AI Prompts
export const PLAYER_IMG = "https://image.pollinations.ai/prompt/3d%20anime%20girl%20special%20forces%20soldier%20uniform%20two%20healthy%20eyes%20open%20no%20eyepatch%20holding%20flare%20gun%20full%20body%20white%20background%20wheat%20and%20green%20military%20palette?width=512&height=512&nologo=true"; 

export const ENEMY_IMG_BASE = "https://image.pollinations.ai/prompt/3d%20anime%20thug%20yellow%20messy%20hair%20tattered%20clothes%20holding%20blue%20flare%20gun%20throwing%20black%20round%20bomb%20white%20background?width=512&height=512&nologo=true";

export const BOSS_IMG = "https://image.pollinations.ai/prompt/giant%20armored%20warlord%20yellow%20hair%20tattered%20cape%20blue%20energy%20flare%20gun%20throwing%20massive%20bombs%203d%20render%20white%20background?width=512&height=512&nologo=true";

export const LEVEL_CONFIG = {
    1: { enemyCount: 3, enemySpeed: 2.2, enemyHealth: 60, boss: false },
    2: { enemyCount: 5, enemySpeed: 2.6, enemyHealth: 80, boss: false },
    3: { enemyCount: 6, enemySpeed: 3.2, enemyHealth: 110, boss: false },
    4: { enemyCount: 8, enemySpeed: 3.8, enemyHealth: 140, boss: false },
    5: { enemyCount: 2, enemySpeed: 4.5, enemyHealth: 450, boss: true },
};