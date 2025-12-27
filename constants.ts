
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PLAYER_SIZE = 110; 
export const ENEMY_SIZE = 100;
export const BOSS_SIZE = 240;
export const ITEM_SIZE = 55;

export const PLAYER_SPEED = 9; 
export const DASH_SPEED = 28;

// THEME COLORS
export const COLOR_NEON_PURPLE = '#df24ff'; 
export const COLOR_NEON_GREEN = '#39ff14';  
export const COLOR_NEON_CYAN = '#00f3ff';   
export const COLOR_DREAMY_BLUE = '#007aff';
export const COLOR_STREET_DARK = '#020204';

export const WEAPON_STATS = {
    FISTS: { name: '超磁力量子拳', damage: 35, cooldown: 18, range: 75, color: '#ffffff' },
    SWORD: { name: '弧光切裂者 "村正"', damage: 85, cooldown: 18, range: 140, color: COLOR_NEON_GREEN }, 
    HAMMER: { name: '大地构造破坏锤', damage: 160, cooldown: 50, range: 160, color: '#ff9f0a' }, 
    DUAL_BLADES: { name: '时空断裂双刃', damage: 60, cooldown: 8, range: 120, color: COLOR_NEON_CYAN }, 
};

export const HEAL_COST = 80; 
export const HEAL_AMOUNT = 60;
export const UPGRADE_COST_BASE = 200;

// High-detail Cyber Teammate Visuals (Ensuring Profile Pictures via specific seeds)
export const PLAYER_IMG = "https://image.pollinations.ai/prompt/3d%20cyberpunk%20anime%20girl%20soldier%20neon%20purple%20exoskeleton%20armor%20short%20glowing%20hair%20full%20body%20white%20background?width=512&height=512&nologo=true&seed=player_v1"; 
export const ALLY_IMG_CYAN = "https://image.pollinations.ai/prompt/3d%20cyberpunk%20anime%20tech%20specialist%20aqua%20neon%20armor%20visors%20full%20body%20white%20background?width=512&height=512&nologo=true&seed=teammate_aqua";
export const ALLY_IMG_GOLD = "https://image.pollinations.ai/prompt/3d%20cyberpunk%20anime%20heavy%20soldier%20gold%20mechanical%20armor%20full%20body%20white%20background?width=512&height=512&nologo=true&seed=teammate_gingo";
export const ALLY_IMG_ROSE = "https://image.pollinations.ai/prompt/3d%20cyberpunk%20anime%20intel%20officer%20rose%20neon%20glow%20full%20body%20white%20background?width=512&height=512&nologo=true&seed=teammate_rose";

export const ENEMY_IMG_BASE = "https://image.pollinations.ai/prompt/3d%20anime%20gangster%20punk%20cyborg%20parts%20yellow%20hair%20angry%20full%20body%20white%20background?width=512&height=512&nologo=true";
export const BOSS_IMG = "https://image.pollinations.ai/prompt/3d%20anime%20huge%20cyborg%20fat%20man%20boss%20red%20spiky%20hair%20exposed%20belly%20cybernetic%20red%20coat%20holding%20energy%20bottle%20angry%20white%20background?width=512&height=512&nologo=true";

// Missions: Defeat 3 bosses, 15 bosses, 20 bosses
export const LEVEL_CONFIG = {
    1: { bossCount: 3, enemySpeed: 2.6, bossHealth: 200, bossDamage: 15 },
    2: { bossCount: 15, enemySpeed: 3.2, bossHealth: 300, bossDamage: 25 },
    3: { bossCount: 20, enemySpeed: 4.0, bossHealth: 500, bossDamage: 40 },
    4: { bossCount: 25, enemySpeed: 4.5, bossHealth: 700, bossDamage: 55 },
    5: { bossCount: 1, enemySpeed: 5.0, bossHealth: 3000, bossDamage: 80, isFinal: true },
};
