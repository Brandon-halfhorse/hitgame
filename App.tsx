
import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { WarehouseView } from './components/WarehouseView';
import { GameState, GameStatus, Entity, EntityType, FloatingText, WeaponType, Item, Task } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG, WEAPON_STATS, ITEM_SIZE, HEAL_COST, HEAL_AMOUNT, UPGRADE_COST_BASE, COLOR_NEON_PURPLE, COLOR_NEON_CYAN, COLOR_NEON_GREEN, ALLY_IMG_GOLD } from './constants';
import { generateLevelLore } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Zap, Volume2, ShoppingBag, ArrowUpCircle, Activity } from 'lucide-react';

const INITIAL_TASKS: Task[] = [
    { id: 't1', title: '信号回收', description: '清除街区外围的低级程序', reward: 200, completed: false },
    { id: 't2', title: '能源补给', description: '从仓库底层回收备用电池盒', reward: 350, completed: false },
    { id: 't3', title: '系统纠错', description: '重置受损的AI逻辑网格', reward: 500, completed: false }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      health: 120,
      maxHealth: 120,
      damage: 45,
      weapon: WeaponType.FISTS,
      attackCooldown: 0,
      maxAttackCooldown: 20,
      facing: 'right',
      visualUrl: PLAYER_IMG,
      dashCooldown: 0,
      upgradeLevel: 1
    },
    enemies: [],
    allies: [],
    items: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    status: GameStatus.IDLE,
    gameBounds: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    loreText: "紫岚战队，全员待命。突围行动开始。",
    shakeIntensity: 0,
    hasRecruitedFriend: false,
    tasks: INITIAL_TASKS,
    deductionTarget: ""
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

  const spawnBloodSplat = (x: number, y: number, currentParticles: FloatingText[]) => {
      for (let i = 0; i < 8; i++) {
        particleIdCounter.current++;
        currentParticles.push({ 
            id: particleIdCounter.current, 
            x: x + (Math.random()-0.5)*50, 
            y: y + (Math.random()-0.5)*50, 
            text: "◆", 
            color: COLOR_NEON_PURPLE, 
            life: 30, 
            velocity: { x: (Math.random()-0.5)*12, y: (Math.random()-0.5)*12 } 
        });
      }
  }

  const spawnItem = (x: number, y: number, type: 'WEAPON' | 'CURRENCY', subtype?: WeaponType, currentItems?: Item[]) => {
    itemIdCounter.current++;
    const item: Item = { id: itemIdCounter.current, type, subtype, amount: type === 'CURRENCY' ? 60 : 0, pos: { x, y }, size: ITEM_SIZE };
    if (currentItems) currentItems.push(item);
    return item;
  };

  const updateGame = () => {
    const currentState = stateRef.current;
    if (currentState.status !== GameStatus.PLAYING || isCelebrating) return;

    const input = inputRef.current;
    let newPlayer = { ...currentState.player };
    let newEnemies = currentState.enemies.map(e => ({...e}));
    let newAllies = currentState.allies.map(a => ({...a}));
    let newItems = [...currentState.items];
    let newParticles = currentState.particles.map(p => ({...p, life: p.life - 1})).filter(p => p.life > 0);
    let newStatus: GameStatus = currentState.status;
    let newScore = currentState.score;
    let newCurrency = currentState.currency;
    let newShake = Math.max(0, currentState.shakeIntensity - 3);

    // --- Stats Upgrade ---
    const upgradeCost = UPGRADE_COST_BASE * (newPlayer.upgradeLevel || 1);
    if (input.upgrade && newCurrency >= upgradeCost) {
        newCurrency -= upgradeCost;
        newPlayer.upgradeLevel = (newPlayer.upgradeLevel || 1) + 1;
        newPlayer.maxHealth += 80;
        newPlayer.health = newPlayer.maxHealth;
        newPlayer.damage += 35;
        newPlayer.speed += 0.6;
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "SYSTEM EVOLUTION", COLOR_NEON_PURPLE, newParticles);
        audioManager.playSfx('loot');
        inputRef.current.upgrade = false;
    }

    if (input.buy && newCurrency >= HEAL_COST && newPlayer.health < newPlayer.maxHealth) {
        newCurrency -= HEAL_COST;
        newPlayer.health = Math.min(newPlayer.health + HEAL_AMOUNT, newPlayer.maxHealth);
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "NANOBOT REPAIR", COLOR_NEON_GREEN, newParticles);
        audioManager.playSfx('buy');
        inputRef.current.buy = false;
    }

    // --- Player Core Movement ---
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

    // Combat Logic
    if (input.attack && newPlayer.attackCooldown <= 0) {
        newPlayer.isAttacking = true;
        newPlayer.attackCooldown = newPlayer.maxAttackCooldown;
        audioManager.playSfx('attack');
        const range = WEAPON_STATS[newPlayer.weapon].range;
        newEnemies.forEach(enemy => {
            const dist = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2), (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2));
            if (dist < range + 80) {
                const dmg = newPlayer.damage + Math.floor(Math.random()*50);
                enemy.health -= dmg;
                enemy.hitFlashTimer = 15;
                spawnFloatingText(enemy.pos.x, enemy.pos.y, `CRIT: -${dmg}`, "#ff0000", newParticles);
                audioManager.playSfx('hit');
                newShake = 35;
            }
        });
    }

    // Allies AI: Target nearest enemy
    newAllies.forEach(ally => {
        if (ally.attackCooldown > 0) ally.attackCooldown--;
        else ally.isAttacking = false;

        const target = newEnemies.reduce((closest, current) => {
            const dCurrent = Math.hypot(current.pos.x - ally.pos.x, current.pos.y - ally.pos.y);
            const dClosest = closest ? Math.hypot(closest.pos.x - ally.pos.x, closest.pos.y - ally.pos.y) : Infinity;
            return dCurrent < dClosest ? current : closest;
        }, null as any);

        if (target) {
            const adx = (target.pos.x + target.size/2) - (ally.pos.x + ally.size/2);
            const ady = (target.pos.y + target.size/2) - (ally.pos.y + ally.size/2);
            const dist = Math.hypot(adx, ady);
            if (dist > 120) {
                ally.pos.x += (adx / dist) * ally.speed;
                ally.pos.y += (ady / dist) * ally.speed;
                ally.facing = adx > 0 ? 'right' : 'left';
                ally.isMoving = true;
            } else if (ally.attackCooldown <= 0) {
                ally.isAttacking = true;
                ally.attackCooldown = ally.maxAttackCooldown;
                target.health -= ally.damage;
                target.hitFlashTimer = 10;
                spawnFloatingText(target.pos.x, target.pos.y, `ALLY SUPP: -${ally.damage}`, COLOR_NEON_CYAN, newParticles);
            }
        } else {
            // Idle state: Follow player at distance
            const pDistX = newPlayer.pos.x - 60 - ally.pos.x;
            const pDistY = newPlayer.pos.y - ally.pos.y;
            const dist = Math.hypot(pDistX, pDistY);
            if (dist > 60) {
                ally.pos.x += (pDistX / dist) * ally.speed;
                ally.pos.y += (pDistY / dist) * ally.speed;
                ally.isMoving = true;
            } else { ally.isMoving = false; }
        }
    });

    // Loot Pickup
    newItems = newItems.filter(item => {
        const d = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (item.pos.x + item.size/2), (newPlayer.pos.y + newPlayer.size/2) - (item.pos.y + item.size/2));
        if (d < 70) {
            if (item.type === 'WEAPON' && item.subtype) {
                newPlayer.weapon = item.subtype;
                const s = WEAPON_STATS[item.subtype];
                newPlayer.damage = s.damage + (newPlayer.upgradeLevel || 1) * 30;
                newPlayer.maxAttackCooldown = s.cooldown;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `SYNC: ${s.name}`, s.color, newParticles);
            } else {
                newCurrency += item.amount || 60;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "+60 CREDITS", "#ffd60a", newParticles);
            }
            audioManager.playSfx('loot');
            return false;
        }
        return true;
    });

    // Enemies Core
    const aliveEnemies: Entity[] = [];
    newEnemies.forEach(enemy => {
        if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
        if (enemy.health > 0) {
            aliveEnemies.push(enemy);
            const edx = (newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2);
            const edy = (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2);
            const dist = Math.hypot(edx, edy);
            
            if (dist > 60) {
                enemy.pos.x += (edx / dist) * enemy.speed;
                enemy.pos.y += (edy / dist) * enemy.speed;
                enemy.facing = edx > 0 ? 'right' : 'left';
                enemy.isMoving = true;
            }

            if (dist < 110 && frameCountRef.current % 30 === 0) {
                newPlayer.health -= enemy.damage;
                newPlayer.hitFlashTimer = 15;
                audioManager.playSfx('damage');
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `DATA CORRUPTION`, "#ffffff", newParticles);
                spawnBloodSplat(newPlayer.pos.x + newPlayer.size/2, newPlayer.pos.y + newPlayer.size/2, newParticles);
                newShake = 25;
            }
        } else {
            newScore += 5000;
            newCurrency += 100;
            if (Math.random() > 0.7) spawnItem(enemy.pos.x, enemy.pos.y, 'WEAPON', [WeaponType.SWORD, WeaponType.HAMMER, WeaponType.DUAL_BLADES][Math.floor(Math.random()*3)], newItems);
            else spawnItem(enemy.pos.x, enemy.pos.y, 'CURRENCY', undefined, newItems);
        }
    });
    newEnemies = aliveEnemies;

    if (newPlayer.health <= 0) { newStatus = GameStatus.GAME_OVER; audioManager.stopBgm(); }
    else if (newEnemies.length === 0 && !isCelebrating) {
        setIsCelebrating(true);
        audioManager.playSfx('victory');
        setTimeout(() => {
            setIsCelebrating(false);
            if (currentState.level === 1 && currentState.status === GameStatus.PLAYING) {
                setGameState(p => ({ ...p, status: GameStatus.WAREHOUSE }));
            } else {
                setGameState(p => ({ ...p, status: p.level >= 5 ? GameStatus.VICTORY : GameStatus.LEVEL_TRANSITION }));
            }
        }, 2800);
    }

    frameCountRef.current++;
    setGameState(prev => ({ ...prev, player: newPlayer, enemies: newEnemies, allies: newAllies, items: newItems, particles: newParticles, status: isCelebrating ? prev.status : newStatus, score: newScore, currency: newCurrency, shakeIntensity: newShake }));
  };

  const gameLoop = () => { updateGame(); loopRef.current = requestAnimationFrame(gameLoop); };
  useEffect(() => { if (gameState.status === GameStatus.PLAYING) loopRef.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(loopRef.current); }, [gameState.status, isCelebrating]);

  const startGame = async () => {
    audioManager.init();
    const lore = await generateLevelLore(1, false);
    startLevel(1, { ...gameState.player, health: 120, upgradeLevel: 1, weapon: WeaponType.FISTS }, 0, 0, lore);
  };

  const startLevel = (levelNum: number, pState: Entity, score: number, curr: number, lore: string) => {
    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG];
    const enemies: Entity[] = [];
    const allies: Entity[] = [];

    if (stateRef.current.hasRecruitedFriend) {
        allies.push({
            id: 'ally_gingo', type: EntityType.ALLY, pos: { x: 100, y: CANVAS_HEIGHT/2 },
            size: PLAYER_SIZE, speed: PLAYER_SPEED * 0.9, health: 1000, maxHealth: 1000,
            weapon: WeaponType.SWORD, damage: 50, attackCooldown: 0, maxAttackCooldown: 25, facing: 'right', visualUrl: ALLY_IMG_GOLD
        });
    }

    // Missions based on bossCount
    for(let i=0; i<config.bossCount; i++) {
        const uniqueSeed = `boss_arena_${levelNum}_${i}_${Date.now()}`;
        enemies.push({
            id: `boss_${levelNum}_${i}`, type: EntityType.ENEMY_BOSS,
            pos: { x: Math.random() > 0.5 ? -300 : CANVAS_WIDTH + 300, y: Math.random() * CANVAS_HEIGHT },
            size: BOSS_SIZE * 0.8, speed: config.enemySpeed * (0.8 + Math.random()*0.4), health: config.bossHealth, maxHealth: config.bossHealth,
            weapon: WeaponType.HAMMER, damage: config.bossDamage, attackCooldown: 0, maxAttackCooldown: 50, facing: 'right',
            visualUrl: `${BOSS_IMG}&seed=${uniqueSeed}`
        });
    }

    setGameState(prev => ({ ...prev, player: pState, enemies, allies, items: [], level: levelNum, score, currency: curr, status: GameStatus.PLAYING, loreText: lore }));
    audioManager.playBgm(levelNum);
  };

  useEffect(() => {
      if (gameState.status === GameStatus.LEVEL_TRANSITION) {
          const next = async () => {
              const nl = gameState.level + 1;
              const lore = await generateLevelLore(nl, nl >= 3);
              startLevel(nl, gameState.player, gameState.score, gameState.currency, lore);
          };
          next();
      }
  }, [gameState.status]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-[#010103] relative font-sans overflow-hidden">
      
      {gameState.status === GameStatus.WAREHOUSE && (
          <WarehouseView 
            currency={gameState.currency} tasks={gameState.tasks} hasRecruited={gameState.hasRecruitedFriend}
            onClose={() => setGameState(p => ({ ...p, status: GameStatus.LEVEL_TRANSITION }))}
            onBuy={(item, cost) => {
                if (gameState.currency >= cost) {
                    setGameState(p => ({ ...p, currency: p.currency - cost }));
                    audioManager.playSfx('buy');
                }
            }}
            onRecruit={() => setGameState(p => ({ ...p, hasRecruitedFriend: true }))}
            onCompleteTask={(tid) => {
                const task = gameState.tasks.find(t => t.id === tid);
                if (task && !task.completed) {
                    setGameState(p => ({
                        ...p,
                        currency: p.currency + task.reward,
                        tasks: p.tasks.map(t => t.id === tid ? { ...t, completed: true } : t)
                    }));
                    audioManager.playSfx('loot');
                }
            }}
            onDeductionResult={(correct) => {
                if (correct) {
                    setGameState(p => ({ ...p, currency: p.currency + 10 }));
                    audioManager.playSfx('loot');
                    alert("推演成功！+10 CREDITS");
                } else {
                    alert("致命错误：系统重启...");
                    window.location.reload();
                }
            }}
          />
      )}

      {/* HUD High-End */}
      <div className="w-[800px] flex justify-between items-end mb-2 p-8 bg-[#0a0a12]/90 rounded-t-[3rem] border-x-4 border-t-4 border-blue-500/20 backdrop-blur-3xl z-20 shadow-[0_-30px_80px_rgba(0,122,255,0.3)]">
        <div className="flex gap-12">
            <div className="flex flex-col">
                <div className="flex items-center gap-5 text-blue-400 mb-3">
                    <Activity size={36} className="animate-pulse shadow-[0_0_20px_blue]" />
                    <span className="font-mono text-5xl font-black italic tracking-tighter">CORES: {Math.round(gameState.player.health)}</span>
                </div>
                <div className="w-96 h-5 bg-black/95 rounded-full border border-blue-500/20 overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-300 shadow-[0_0_25px_rgba(0,122,255,0.8)] transition-all duration-1000" style={{ width: `${(gameState.player.health/gameState.player.maxHealth)*100}%` }}></div>
                </div>
            </div>
            
            <div className="flex gap-6">
                <button onClick={() => inputRef.current.upgrade = true} className={`group flex flex-col items-center justify-center w-24 h-24 rounded-3xl border-2 transition-all active:scale-90 ${gameState.currency >= UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1) ? 'bg-purple-700 border-white text-white shadow-[0_0_50px_rgba(223,36,255,0.8)]' : 'bg-gray-950 border-gray-800 text-gray-700'}`}>
                    <ArrowUpCircle size={32} className="mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">[U] LV{gameState.player.upgradeLevel}</span>
                </button>
                <button onClick={() => inputRef.current.buy = true} className={`group flex flex-col items-center justify-center w-24 h-24 rounded-3xl border-2 transition-all active:scale-90 ${gameState.currency >= HEAL_COST ? 'bg-green-700 border-white text-white shadow-[0_0_50px_rgba(57,255,20,0.6)]' : 'bg-gray-950 border-gray-800 text-gray-700'}`}>
                    <Heart size={32} className="mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">[B] REPAIR</span>
                </button>
            </div>
        </div>

        <div className="flex flex-col items-end">
            <div className="flex items-center gap-14 text-white font-mono">
                <div className="text-right">
                    <span className="block text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Sync Points</span>
                    <span className="text-5xl font-black italic flex items-center gap-3"><ShoppingBag size={28} className="text-blue-400"/> {gameState.currency}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="relative z-10">
        <GameCanvas 
            player={gameState.player} enemies={gameState.enemies} allies={gameState.allies} items={gameState.items} particles={gameState.particles}
            width={CANVAS_WIDTH} height={CANVAS_HEIGHT} shakeIntensity={gameState.shakeIntensity} isCelebrating={isCelebrating}
        />
        
        {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 bg-black/99 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-3xl">
                <h1 className="text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-400 to-blue-900 mb-12 italic tracking-tighter drop-shadow-[0_0_80px_rgba(0,122,255,1)]">
                    紫岚战队
                </h1>
                <p className="text-cyan-100/60 text-4xl mb-20 max-w-5xl italic font-thin tracking-widest border-y-2 border-blue-500/20 py-12 uppercase leading-tight">
                    "进入战场，首战击败3个头目。"
                </p>
                <button onClick={startGame} className="group relative px-32 py-12 bg-white text-blue-900 rounded-[2rem] font-black text-6xl transition-all hover:scale-110 hover:shadow-[0_0_150px_rgba(255,255,255,0.7)] flex items-center gap-10">
                    <Play size={80} fill="currentColor" /> 开始任务
                </button>
            </div>
        )}

        {(gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.VICTORY) && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-[60px] ${gameState.status === GameStatus.VICTORY ? 'bg-blue-950/95 shadow-[inset_0_0_200px_blue]' : 'bg-red-950/95 shadow-[inset_0_0_200px_red]'}`}>
                {gameState.status === GameStatus.VICTORY ? <Shield size={250} className="text-white mb-14 drop-shadow-[0_0_100px_cyan]"/> : <Zap size={250} className="text-white mb-14 animate-pulse drop-shadow-[0_0_100px_red]"/>}
                <h2 className="text-[140px] font-black text-white mb-20 tracking-tighter italic uppercase underline decoration-white decoration-8 underline-offset-[30px]">
                    {gameState.status === GameStatus.VICTORY ? 'OPS CLEAR' : 'LINK LOST'}
                </h2>
                <button onClick={() => window.location.reload()} className="group flex items-center gap-10 px-28 py-12 bg-white text-black rounded-[2rem] font-black text-5xl hover:bg-blue-400 hover:text-white transition-all shadow-[0_0_100px_rgba(255,255,255,0.5)]">
                    <RotateCcw size={60} className="group-hover:rotate-180 transition-transform duration-1000" /> 重连系统
                </button>
            </div>
        )}
      </div>
      
       <div className="mt-12 flex justify-between w-[800px] text-blue-900 font-black text-[16px] tracking-[1em] uppercase opacity-30">
        <span>ZILAN_CORP // URBAN_STRIKE</span>
        <span className="flex items-center gap-8"><Volume2 size={28} /> SIGNAL_MAX</span>
      </div>
    </div>
  );
}
