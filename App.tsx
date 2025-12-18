
import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState, GameStatus, Entity, EntityType, FloatingText, WeaponType, Item } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG, WEAPON_STATS, ITEM_SIZE, HEAL_COST, HEAL_AMOUNT, UPGRADE_COST_BASE, COLOR_NEON_PURPLE } from './constants';
import { generateLevelLore } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Zap, Volume2, ShoppingBag, ArrowUpCircle } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      health: 100,
      maxHealth: 100,
      damage: 40,
      weapon: WeaponType.FISTS,
      attackCooldown: 0,
      maxAttackCooldown: 20,
      facing: 'right',
      visualUrl: PLAYER_IMG,
      dashCooldown: 0,
      upgradeLevel: 1
    },
    enemies: [],
    items: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    status: GameStatus.IDLE,
    gameBounds: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    loreText: "紫岚战队，全员待命。目标已锁定赛博街区，清除所有暴徒。",
    shakeIntensity: 0
  });

  const [isCelebrating, setIsCelebrating] = useState(false);
  const stateRef = useRef<GameState>(gameState);
  const inputRef = useRef({ up: false, down: false, left: false, right: false, attack: false, skill1: false, buy: false, upgrade: false });
  const loopRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);
  const itemIdCounter = useRef<number>(0);

  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': inputRef.current.up = true; break;
        case 's': case 'arrowdown': inputRef.current.down = true; break;
        case 'a': case 'arrowleft': inputRef.current.left = true; break;
        case 'd': case 'arrowright': inputRef.current.right = true; break;
        case ' ': case 'j': inputRef.current.attack = true; break;
        case '1': inputRef.current.skill1 = true; break;
        case 'b': inputRef.current.buy = true; break;
        case 'u': inputRef.current.upgrade = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': inputRef.current.up = false; break;
        case 's': case 'arrowdown': inputRef.current.down = false; break;
        case 'a': case 'arrowleft': inputRef.current.left = false; break;
        case 'd': case 'arrowright': inputRef.current.right = false; break;
        case ' ': case 'j': inputRef.current.attack = false; break;
        case '1': inputRef.current.skill1 = false; break;
        case 'b': inputRef.current.buy = false; break;
        case 'u': inputRef.current.upgrade = false; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const spawnFloatingText = (x: number, y: number, text: string, color: string, currentParticles: FloatingText[]) => {
    particleIdCounter.current++;
    currentParticles.push({ id: particleIdCounter.current, x, y, text, color, life: 40, velocity: { x: 0, y: -2 } });
  };

  const spawnItem = (x: number, y: number, type: 'WEAPON' | 'CURRENCY', subtype?: WeaponType, currentItems?: Item[]) => {
    itemIdCounter.current++;
    const item: Item = { id: itemIdCounter.current, type, subtype, amount: type === 'CURRENCY' ? 40 : 0, pos: { x, y }, size: ITEM_SIZE };
    if (currentItems) currentItems.push(item);
    return item;
  };

  const updateGame = () => {
    const currentState = stateRef.current;
    if (currentState.status !== GameStatus.PLAYING || isCelebrating) return;

    const input = inputRef.current;
    let newPlayer = { ...currentState.player };
    let newEnemies = currentState.enemies.map(e => ({...e}));
    let newItems = [...currentState.items];
    let newParticles = currentState.particles.map(p => ({...p, life: p.life - 1})).filter(p => p.life > 0);
    let newStatus: GameStatus = currentState.status;
    let newScore = currentState.score;
    let newCurrency = currentState.currency;
    let newShake = Math.max(0, currentState.shakeIntensity - 3);

    // --- Upgrade Logic ---
    const upgradeCost = UPGRADE_COST_BASE * (newPlayer.upgradeLevel || 1);
    if (input.upgrade && newCurrency >= upgradeCost) {
        newCurrency -= upgradeCost;
        newPlayer.upgradeLevel = (newPlayer.upgradeLevel || 1) + 1;
        newPlayer.maxHealth += 50;
        newPlayer.health = newPlayer.maxHealth;
        newPlayer.damage += 25;
        newPlayer.speed += 0.4;
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "OVERCLOCK!", COLOR_NEON_PURPLE, newParticles);
        audioManager.playSfx('loot');
        inputRef.current.upgrade = false;
    }

    if (input.buy && newCurrency >= HEAL_COST && newPlayer.health < newPlayer.maxHealth) {
        newCurrency -= HEAL_COST;
        newPlayer.health = Math.min(newPlayer.health + HEAL_AMOUNT, newPlayer.maxHealth);
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "RESTORE!", "#32d74b", newParticles);
        audioManager.playSfx('buy');
        inputRef.current.buy = false;
    }

    // --- Player Movement ---
    let dx = 0; let dy = 0;
    if (input.up) dy -= newPlayer.speed;
    if (input.down) dy += newPlayer.speed;
    if (input.left) { dx -= newPlayer.speed; newPlayer.facing = 'left'; }
    if (input.right) { dx += newPlayer.speed; newPlayer.facing = 'right'; }
    
    newPlayer.isMoving = dx !== 0 || dy !== 0;
    newPlayer.pos = {
        x: Math.min(Math.max(newPlayer.pos.x + dx, 0), CANVAS_WIDTH - newPlayer.size),
        y: Math.min(Math.max(newPlayer.pos.y + dy, 0), CANVAS_HEIGHT - newPlayer.size)
    };

    if (newPlayer.attackCooldown > 0) newPlayer.attackCooldown--;
    else newPlayer.isAttacking = false;
    if (newPlayer.hitFlashTimer && newPlayer.hitFlashTimer > 0) newPlayer.hitFlashTimer--;

    // Attack
    if (input.attack && newPlayer.attackCooldown <= 0) {
        newPlayer.isAttacking = true;
        newPlayer.attackCooldown = newPlayer.maxAttackCooldown;
        audioManager.playSfx('attack');
        const range = WEAPON_STATS[newPlayer.weapon].range;
        
        newEnemies.forEach(enemy => {
            const dist = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2), (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2));
            if (dist < range + 60) {
                const dmg = newPlayer.damage + Math.floor(Math.random()*25);
                enemy.health -= dmg;
                enemy.hitFlashTimer = 12;
                spawnFloatingText(enemy.pos.x, enemy.pos.y, `HIT! -${dmg}`, "#ff3b30", newParticles);
                audioManager.playSfx('hit');
                newShake = 25;
            }
        });
    }

    // Item Interaction
    newItems = newItems.filter(item => {
        const d = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (item.pos.x + item.size/2), (newPlayer.pos.y + newPlayer.size/2) - (item.pos.y + item.size/2));
        if (d < 55) {
            if (item.type === 'WEAPON' && item.subtype) {
                newPlayer.weapon = item.subtype;
                const s = WEAPON_STATS[item.subtype];
                newPlayer.damage = s.damage + (newPlayer.upgradeLevel || 1) * 20;
                newPlayer.maxAttackCooldown = s.cooldown;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `ARMED: ${item.subtype}`, s.color, newParticles);
            } else {
                newCurrency += item.amount || 40;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "+CREDITS", "#ffd60a", newParticles);
            }
            audioManager.playSfx('loot');
            return false;
        }
        return true;
    });

    // --- Enemies Logic ---
    const aliveEnemies: Entity[] = [];
    newEnemies.forEach(enemy => {
        if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
        if (enemy.health > 0) {
            aliveEnemies.push(enemy);
            const edx = (newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2);
            const edy = (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2);
            const dist = Math.hypot(edx, edy);
            
            enemy.isMoving = dist > 60;
            if (dist > 50) {
                enemy.pos.x += (edx / dist) * enemy.speed;
                enemy.pos.y += (edy / dist) * enemy.speed;
                enemy.facing = edx > 0 ? 'right' : 'left';
            }

            if (dist < 90 && frameCountRef.current % 40 === 0) {
                newPlayer.health -= enemy.damage;
                newPlayer.hitFlashTimer = 12;
                audioManager.playSfx('damage');
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `DMG -${enemy.damage}`, "#fff", newParticles);
                newShake = 18;
            }
        } else {
            newScore += 1000;
            newCurrency += 60;
            spawnItem(enemy.pos.x, enemy.pos.y, 'CURRENCY', undefined, newItems);
        }
    });
    newEnemies = aliveEnemies;

    if (newPlayer.health <= 0) { newStatus = GameStatus.GAME_OVER; audioManager.stopBgm(); }
    else if (newEnemies.length === 0 && !isCelebrating) {
        setIsCelebrating(true);
        audioManager.playSfx('victory');
        setTimeout(() => {
            setIsCelebrating(false);
            setGameState(p => ({ ...p, status: p.level >= 5 ? GameStatus.VICTORY : GameStatus.LEVEL_TRANSITION }));
        }, 2200);
    }

    frameCountRef.current++;
    setGameState(prev => ({ ...prev, player: newPlayer, enemies: newEnemies, items: newItems, particles: newParticles, status: isCelebrating ? prev.status : newStatus, score: newScore, currency: newCurrency, shakeIntensity: newShake }));
  };

  const gameLoop = () => { updateGame(); loopRef.current = requestAnimationFrame(gameLoop); };
  useEffect(() => { if (gameState.status === GameStatus.PLAYING) loopRef.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(loopRef.current); }, [gameState.status, isCelebrating]);

  const startGame = async () => {
    audioManager.init();
    const lore = await generateLevelLore(1, false);
    startLevel(1, { ...gameState.player, health: 100, upgradeLevel: 1, weapon: WeaponType.FISTS }, 0, 0, lore);
  };

  const startLevel = (levelNum: number, pState: Entity, score: number, curr: number, lore: string) => {
    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG];
    const enemies: Entity[] = [];
    for(let i=0; i<config.enemyCount; i++) {
        /** 
         * CRITICAL: Added unique timestamp-based seed for every single enemy 
         * to ensure images load properly and bypass broken cache.
         */
        const uniqueSeed = `zilan_s7_${levelNum}_${i}_${Date.now()}`;
        enemies.push({
            id: `e_${levelNum}_${i}`, type: EntityType.ENEMY_MELEE,
            pos: { x: Math.random() > 0.5 ? -200 : CANVAS_WIDTH + 200, y: Math.random() * CANVAS_HEIGHT },
            size: ENEMY_SIZE, speed: config.enemySpeed, health: config.enemyHealth, maxHealth: config.enemyHealth,
            weapon: WeaponType.FISTS, damage: 20 + levelNum * 3, attackCooldown: 0, maxAttackCooldown: 60, facing: 'right',
            visualUrl: `${ENEMY_IMG_BASE}&seed=${uniqueSeed}`
        });
    }
    if (config.boss) {
        enemies.push({
            id: 'boss', type: EntityType.ENEMY_BOSS, pos: { x: CANVAS_WIDTH/2 - BOSS_SIZE/2, y: 150 },
            size: BOSS_SIZE, speed: config.enemySpeed * 0.75, health: config.enemyHealth * 5, maxHealth: config.enemyHealth * 5,
            weapon: WeaponType.HAMMER, damage: 55, attackCooldown: 0, maxAttackCooldown: 85, facing: 'left', 
            visualUrl: `${BOSS_IMG}&seed=zilan_boss_${Date.now()}`
        });
    }
    const items: Item[] = [];
    if (levelNum > 0) {
        items.push({ id: Date.now(), type: 'WEAPON', subtype: [WeaponType.SWORD, WeaponType.HAMMER, WeaponType.DUAL_BLADES][Math.floor(Math.random()*3)], pos: { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 }, size: ITEM_SIZE });
    }

    setGameState({ ...gameState, player: pState, enemies, items, level: levelNum, score, currency: curr, status: GameStatus.PLAYING, loreText: lore });
    audioManager.playBgm(levelNum);
  };

  useEffect(() => {
      if (gameState.status === GameStatus.LEVEL_TRANSITION) {
          const next = async () => {
              const nl = gameState.level + 1;
              const lore = await generateLevelLore(nl, LEVEL_CONFIG[nl as keyof typeof LEVEL_CONFIG]?.boss || false);
              startLevel(nl, gameState.player, gameState.score, gameState.currency, lore);
          };
          next();
      }
  }, [gameState.status]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-[#020204] relative font-sans overflow-hidden">
      
      {/* HUD Layer */}
      <div className="w-[800px] flex justify-between items-end mb-2 p-6 bg-black/85 rounded-t-3xl border-x-4 border-t-4 border-purple-950/40 backdrop-blur-3xl z-20 shadow-[0_-20px_50px_rgba(168,85,247,0.25)]">
        <div className="flex gap-10">
            <div className="flex flex-col">
                <div className="flex items-center gap-4 text-purple-200 mb-2">
                    <Heart size={28} className="fill-purple-600 animate-pulse" />
                    <span className="font-mono text-4xl font-black italic tracking-tighter">STRUCTURAL: {Math.round(gameState.player.health)}%</span>
                </div>
                <div className="w-72 h-6 bg-black/90 rounded-full border border-purple-500/20 overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-500" style={{ width: `${(gameState.player.health/gameState.player.maxHealth)*100}%` }}></div>
                </div>
            </div>
            
            <button 
                onClick={() => inputRef.current.upgrade = true}
                className={`group flex items-center gap-5 px-8 py-3 rounded-2xl border-2 transition-all active:scale-90 ${gameState.currency >= UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1) ? 'bg-purple-700 border-purple-300 text-white shadow-[0_0_35px_rgba(168,85,247,0.8)]' : 'bg-gray-950 border-gray-800 text-gray-600'}`}
            >
                <ArrowUpCircle size={32} className="group-hover:rotate-180 transition-transform duration-700" />
                <div className="flex flex-col items-start leading-tight">
                    <span className="text-[11px] font-black tracking-[0.2em] uppercase opacity-70">Overclock [U]</span>
                    <span className="text-xl font-black">{UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1)} CREDITS</span>
                </div>
            </button>
        </div>

        <div className="flex flex-col items-end">
            <div className="flex items-center gap-10 text-white font-mono">
                <div className="text-right">
                    <span className="block text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-1">CASH_FLOW</span>
                    <span className="text-4xl font-black flex items-center gap-3"><ShoppingBag size={24} className="text-cyan-400"/> {gameState.currency}</span>
                </div>
                <div className="text-right border-l border-purple-500/30 pl-10">
                    <span className="block text-[11px] font-black text-purple-400 uppercase tracking-widest mb-1">TOTAL_OPS_PTS</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">{gameState.score}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="relative z-10">
        <GameCanvas 
            player={gameState.player} enemies={gameState.enemies} items={gameState.items} particles={gameState.particles}
            width={CANVAS_WIDTH} height={CANVAS_HEIGHT} shakeIntensity={gameState.shakeIntensity} isCelebrating={isCelebrating}
        />
        
        {/* State Overlays */}
        {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 bg-black/99 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-3xl">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="absolute top-10 left-10 text-purple-700/10 text-[12vw] font-black select-none pointer-events-none italic">紫岚</div>
                <h1 className="text-[100px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-300 to-purple-900 mb-10 italic tracking-tighter drop-shadow-[0_0_50px_rgba(168,85,247,0.7)]">
                    紫岚战队
                </h1>
                <p className="text-cyan-100/70 text-3xl mb-16 max-w-3xl italic font-extralight tracking-[0.1em] border-y-2 border-purple-500/20 py-10 leading-relaxed uppercase">
                    "{gameState.loreText}"
                </p>
                <button onClick={startGame} className="group relative px-24 py-8 bg-white text-black rounded-full font-black text-4xl transition-all hover:scale-110 hover:shadow-[0_0_100px_rgba(255,255,255,0.5)] flex items-center gap-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Play size={50} fill="currentColor" /> 启动作战
                    <div className="absolute inset-[-6px] border-2 border-white/20 rounded-full scale-110 group-hover:scale-130 transition-transform duration-700"></div>
                </button>
                <div className="mt-16 text-xs text-gray-600 font-mono tracking-[0.8em] uppercase">Tactical Engine Alpha-9 // [WASD] [SPACE] [U] [B]</div>
            </div>
        )}

        {(gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.VICTORY) && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-3xl ${gameState.status === GameStatus.VICTORY ? 'bg-purple-950/95 shadow-[inset_0_0_200px_rgba(168,85,247,0.5)]' : 'bg-red-950/95 shadow-[inset_0_0_200px_rgba(255,0,0,0.5)]'}`}>
                {gameState.status === GameStatus.VICTORY ? <Shield size={160} className="text-cyan-400 mb-10 drop-shadow-[0_0_60px_rgba(34,211,238,0.8)]"/> : <Zap size={160} className="text-red-500 mb-10 animate-pulse drop-shadow-[0_0_60px_red]"/>}
                <h2 className="text-9xl font-black text-white mb-16 tracking-tighter italic uppercase underline decoration-purple-500 decoration-8 underline-offset-[20px]">
                    {gameState.status === GameStatus.VICTORY ? 'OPS CLEAR' : 'LINK LOST'}
                </h2>
                <button onClick={() => window.location.reload()} className="group flex items-center gap-6 px-20 py-8 bg-white text-black rounded-full font-black text-3xl hover:bg-cyan-400 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95">
                    <RotateCcw size={40} className="group-hover:rotate-180 transition-transform duration-700" /> 战术重启
                </button>
            </div>
        )}
      </div>
      
       <div className="mt-10 flex justify-between w-[800px] text-purple-950 font-black text-[12px] tracking-[0.6em] uppercase opacity-50">
        <span>UNIT: ZILAN-ZERO // SECTOR: URBAN-CORE</span>
        <span className="flex items-center gap-4 animate-pulse"><Volume2 size={18} /> ENCRYPTED COMMS ACTIVE</span>
      </div>
    </div>
  );
}
