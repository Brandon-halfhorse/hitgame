export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 80;
export const ENEMY_SIZE = 70;
export const BOSS_SIZE = 150;
export const ITEM_SIZE = 40;

// SPEED: Fast paced
export const PLAYER_SPEED = 10; 
export const DASH_SPEED = 30;

// Weapon Configs (Wheat & Green Theme)
export const WEAPON_STATS = {
    FISTS: { damage: 25, cooldown: 18, range: 70, color: '#f5deb3' }, // Wheat
    SWORD: { damage: 55, cooldown: 22, range: 110, color: '#22c55e' }, // Green
    HAMMER: { damage: 90, cooldown: 50, range: 120, color: '#d97706' }, 
    DUAL_BLADES: { damage: 30, cooldown: 10, range: 90, color: '#84cc16' }, 
};

export const SKILL_COOLDOWN_AMBUSH = 140; 
export const HEAL_COST = 50; 
export const HEAL_AMOUNT = 40;

// ASSETS: Pollinations AI with specific prompts
// Player: Two eyes, Special Forces, Flare Gun, Wheat/Green theme
export const PLAYER_IMG = "https://image.pollinations.ai/prompt/cute%203d%20anime%20girl%20special%20forces%20soldier%20uniform%20no%20eyepatch%20two%20eyes%20open%20holding%20flare%20gun%20full%20body%20white%20background%20wheat%20and%20green%20color%20palette?width=400&height=400&nologo=true"; 

// Enemy: Yellow hair, Tattered clothes, Blue flare gun
export const ENEMY_IMG_BASE = "https://image.pollinations.ai/prompt/3d%20anime%20thug%20yellow%20hair%20tattered%20clothes%20holding%20blue%20flare%20gun%20throwing%20bomb%20white%20background?width=400&height=400&nologo=true";

export const BOSS_IMG = "https://image.pollinations.ai/prompt/giant%20armored%20mech%20robot%20boss%20green%20and%20wheat%20military%20camo%20white%20background?width=600&height=600&nologo=true";

export const LEVEL_CONFIG = {
    1: { enemyCount: 3, enemySpeed: 2, enemyHealth: 50, boss: false },
    2: { enemyCount: 5, enemySpeed: 2.5, enemyHealth: 70, boss: false },
    3: { enemyCount: 6, enemySpeed: 3, enemyHealth: 90, boss: false },
    4: { enemyCount: 8, enemySpeed: 3.5, enemyHealth: 110, boss: false },
    5: { enemyCount: 1, enemySpeed: 4, enemyHealth: 300, boss: true },
};