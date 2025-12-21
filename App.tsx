
import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { WarehouseView } from './components/WarehouseView';
import { GameState, GameStatus, Entity, EntityType, FloatingText, WeaponType, Item, Task } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG, WEAPON_STATS, ITEM_SIZE, HEAL_COST, HEAL_AMOUNT, UPGRADE_COST_BASE, COLOR_NEON_PURPLE, COLOR_NEON_CYAN, COLOR_NEON_GREEN, ALLY_IMG_GOLD } from './constants';
import { generateLevelLore } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Zap, Volume2, ShoppingBag, ArrowUpCircle, Activity } from 'lucide-react';

const INITIAL_TASKS: Task[] = [
    { id: 't1', title: '信号回收', description: '清除街区外围的低级程序（已模拟）', reward: 200, completed: false },
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
    allies: [],
    items: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    status: GameStatus.IDLE,
    gameBounds: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    loreText: "紫岚战队，全员待命。目标已锁定赛博街区，清除所有暴徒。",
    shakeIntensity: 0,
    hasRecruitedFriend: false,
    tasks: INITIAL_TASKS
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

  const spawnBloodSplat = (x: number, y: number, currentParticles: FloatingText[]) => {
      for (let i = 0; i < 6; i++) {
        particleIdCounter.current++;
        currentParticles.push({ 
            id: particleIdCounter.current, 
            x: x + (Math.random()-0.5)*40, 
            y: y + (Math.random()-0.5)*40, 
            text: "◆", 
            color: COLOR_NEON_PURPLE, 
            life: 25, 
            velocity: { x: (Math.random()-0.5)*10, y: (Math.random()-0.5)*10 } 
        });
      }
  }

  const spawnItem = (x: number, y: number, type: 'WEAPON' | 'CURRENCY', subtype?: WeaponType, currentItems?: Item[]) => {
    itemIdCounter.current++;
    const item: Item = { id: itemIdCounter.current, type, subtype, amount: type === 'CURRENCY' ? 50 : 0, pos: { x, y }, size: ITEM_SIZE };
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

    // --- Upgrade Logic ---
    const upgradeCost = UPGRADE_COST_BASE * (newPlayer.upgradeLevel || 1);
    if (input.upgrade && newCurrency >= upgradeCost) {
        newCurrency -= upgradeCost;
        newPlayer.upgradeLevel = (newPlayer.upgradeLevel || 1) + 1;
        newPlayer.maxHealth += 60;
        newPlayer.health = newPlayer.maxHealth;
        newPlayer.damage += 30;
        newPlayer.speed += 0.5;
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "OVERCLOCK COMPLETE", COLOR_NEON_PURPLE, newParticles);
        audioManager.playSfx('loot');
        inputRef.current.upgrade = false;
    }

    if (input.buy && newCurrency >= HEAL_COST && newPlayer.health < newPlayer.maxHealth) {
        newCurrency -= HEAL_COST;
        newPlayer.health = Math.min(newPlayer.health + HEAL_AMOUNT, newPlayer.maxHealth);
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "ENERGY REPAIRED", COLOR_NEON_GREEN, newParticles);
        audioManager.playSfx('buy');
        inputRef.current.buy = false;
    }

    // --- Movement ---
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
            if (dist < range + 70) {
                const dmg = newPlayer.damage + Math.floor(Math.random()*40);
                enemy.health -= dmg;
                enemy.hitFlashTimer = 12;
                spawnFloatingText(enemy.pos.x, enemy.pos.y, `FATAL: -${dmg}`, "#ff0000", newParticles);
                audioManager.playSfx('hit');
                newShake = 30;
            }
        });
    }

    // --- Allies AI ---
    newAllies.forEach(ally => {
        if (ally.attackCooldown > 0) ally.attackCooldown--;
        else ally.isAttacking = false;

        // Simple follow player or fight nearest enemy
        const target = newEnemies[0];
        if (target) {
            const adx = (target.pos.x + target.size/2) - (ally.pos.x + ally.size/2);
            const ady = (target.pos.y + target.size/2) - (ally.pos.y + ally.size/2);
            const dist = Math.hypot(adx, ady);
            ally.isMoving = dist > 100;
            if (dist > 80) {
                ally.pos.x += (adx / dist) * ally.speed;
                ally.pos.y += (ady / dist) * ally.speed;
                ally.facing = adx > 0 ? 'right' : 'left';
            } else if (ally.attackCooldown <= 0) {
                ally.isAttacking = true;
                ally.attackCooldown = ally.maxAttackCooldown;
                target.health -= ally.damage;
                target.hitFlashTimer = 8;
                spawnFloatingText(target.pos.x, target.pos.y, `ALLY: -${ally.damage}`, COLOR_NEON_CYAN, newParticles);
            }
        } else {
            // No enemies? Stay near player
            const adx = (newPlayer.pos.x - 50) - ally.pos.x;
            const ady = (newPlayer.pos.y) - ally.pos.y;
            const dist = Math.hypot(adx, ady);
            if (dist > 50) {
                ally.pos.x += (adx / dist) * ally.speed;
                ally.pos.y += (ady / dist) * ally.speed;
                ally.facing = adx > 0 ? 'right' : 'left';
                ally.isMoving = true;
            } else {
                ally.isMoving = false;
            }
        }
    });

    // Items
    newItems = newItems.filter(item => {
        const d = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (item.pos.x + item.size/2), (newPlayer.pos.y + newPlayer.size/2) - (item.pos.y + item.size/2));
        if (d < 65) {
            if (item.type === 'WEAPON' && item.subtype) {
                newPlayer.weapon = item.subtype;
                const s = WEAPON_STATS[item.subtype];
                newPlayer.damage = s.damage + (newPlayer.upgradeLevel || 1) * 25;
                newPlayer.maxAttackCooldown = s.cooldown;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `EQUIPPED: ${s.name}`, s.color, newParticles);
            } else {
                newCurrency += item.amount || 50;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "+CREDITS", "#ffd60a", newParticles);
            }
            audioManager.playSfx('loot');
            return false;
        }
        return true;
    });

    // --- Enemies ---
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

            if (dist < 100 && frameCountRef.current % 35 === 0) {
                newPlayer.health -= enemy.damage;
                newPlayer.hitFlashTimer = 12;
                audioManager.playSfx('damage');
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `!! SYSTEM ERROR !!`, "#ffffff", newParticles);
                spawnBloodSplat(newPlayer.pos.x + newPlayer.size/2, newPlayer.pos.y + newPlayer.size/2, newParticles);
                newShake = 22;
            }
        } else {
            newScore += 2000;
            newCurrency += 80;
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
            if (currentState.level === 1) {
                setGameState(p => ({ ...p, status: GameStatus.WAREHOUSE }));
            } else {
                setGameState(p => ({ ...p, status: p.level >= 5 ? GameStatus.VICTORY : GameStatus.LEVEL_TRANSITION }));
            }
        }, 2500);
    }

    frameCountRef.current++;
    setGameState(prev => ({ ...prev, player: newPlayer, enemies: newEnemies, allies: newAllies, items: newItems, particles: newParticles, status: isCelebrating ? prev.status : newStatus, score: newScore, currency: newCurrency, shakeIntensity: newShake }));
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
    const allies: Entity[] = [];

    // If recruited, add the ally to the field
    if (gameState.hasRecruitedFriend) {
        allies.push({
            id: 'ally_gingo', type: EntityType.ALLY, pos: { x: 100, y: CANVAS_HEIGHT/2 },
            size: PLAYER_SIZE, speed: PLAYER_SPEED * 0.8, health: 300, maxHealth: 300,
            weapon: WeaponType.SWORD, damage: 30, attackCooldown: 0, maxAttackCooldown: 30, facing: 'right', visualUrl: ALLY_IMG_GOLD
        });
    }

    for(let i=0; i<config.enemyCount; i++) {
        const uniqueSeed = `zilan_s10_${levelNum}_${i}_${Date.now()}`;
        enemies.push({
            id: `e_${levelNum}_${i}`, type: EntityType.ENEMY_MELEE,
            pos: { x: Math.random() > 0.5 ? -250 : CANVAS_WIDTH + 250, y: Math.random() * CANVAS_HEIGHT },
            size: ENEMY_SIZE, speed: config.enemySpeed, health: config.enemyHealth, maxHealth: config.enemyHealth,
            weapon: WeaponType.FISTS, damage: 25 + levelNum * 5, attackCooldown: 0, maxAttackCooldown: 60, facing: 'right',
            visualUrl: `${ENEMY_IMG_BASE}&seed=${uniqueSeed}`
        });
    }
    if (config.boss) {
        enemies.push({
            id: 'boss', type: EntityType.ENEMY_BOSS, pos: { x: CANVAS_WIDTH/2 - BOSS_SIZE/2, y: 180 },
            size: BOSS_SIZE, speed: config.enemySpeed * 0.8, health: config.enemyHealth * 6, maxHealth: config.enemyHealth * 6,
            weapon: WeaponType.HAMMER, damage: 65, attackCooldown: 0, maxAttackCooldown: 85, facing: 'left', 
            visualUrl: `${BOSS_IMG}&seed=zilan_boss_${Date.now()}`
        });
    }
    
    setGameState(prev => ({ ...prev, player: pState, enemies, allies, items: [], level: levelNum, score, currency: curr, status: GameStatus.PLAYING, loreText: lore }));
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
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-[#010102] relative font-sans overflow-hidden">
      
      {/* Warehouse View Overlay */}
      {gameState.status === GameStatus.WAREHOUSE && (
          <WarehouseView 
            currency={gameState.currency}
            tasks={gameState.tasks}
            hasRecruited={gameState.hasRecruitedFriend}
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
          />
      )}

      {/* HUD Layer */}
      <div className="w-[800px] flex justify-between items-end mb-2 p-6 bg-black/90 rounded-t-[2.5rem] border-x-4 border-t-4 border-purple-500/30 backdrop-blur-3xl z-20 shadow-[0_-25px_60px_rgba(168,85,247,0.4)]">
        <div className="flex gap-8">
            <div className="flex flex-col">
                <div className="flex items-center gap-4 text-cyan-400 mb-2">
                    <Activity size={32} className="animate-pulse shadow-[0_0_15px_cyan]" />
                    <span className="font-mono text-4xl font-black italic tracking-tighter">INTEGRITY: {Math.round(gameState.player.health)}</span>
                </div>
                <div className="w-80 h-4 bg-black/95 rounded-full border border-cyan-500/20 overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.8)] transition-all duration-700 ease-out" style={{ width: `${(gameState.player.health/gameState.player.maxHealth)*100}%` }}></div>
                </div>
            </div>
            
            <div className="flex gap-4">
                <button onClick={() => inputRef.current.upgrade = true} className={`group flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all active:scale-90 ${gameState.currency >= UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1) ? 'bg-purple-600 border-purple-200 text-white shadow-[0_0_40px_rgba(223,36,255,0.7)]' : 'bg-gray-950 border-gray-800 text-gray-700'}`}>
                    <ArrowUpCircle size={30} className="group-hover:rotate-180 transition-transform duration-700" />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black tracking-widest opacity-80 uppercase">Overclock [U]</span>
                        <span className="text-xl font-black">{UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1)}</span>
                    </div>
                </button>
                <button onClick={() => inputRef.current.buy = true} className={`group flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all active:scale-90 ${gameState.currency >= HEAL_COST ? 'bg-green-600 border-green-200 text-white shadow-[0_0_40px_rgba(57,255,20,0.5)]' : 'bg-gray-950 border-gray-800 text-gray-700'}`}>
                    <Heart size={30} className="group-hover:scale-125 transition-transform" />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black tracking-widest opacity-80 uppercase">Repair [B]</span>
                        <span className="text-xl font-black">{HEAL_COST}</span>
                    </div>
                </button>
            </div>
        </div>

        <div className="flex flex-col items-end">
            <div className="flex items-center gap-12 text-white font-mono">
                <div className="text-right">
                    <span className="block text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">Credits</span>
                    <span className="text-4xl font-black flex items-center gap-2"><ShoppingBag size={24} className="text-cyan-400"/> {gameState.currency}</span>
                </div>
                <div className="text-right border-l-2 border-purple-500/20 pl-10">
                    <span className="block text-[11px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">Rating</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">{gameState.score}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="relative z-10">
        <GameCanvas 
            player={gameState.player} 
            enemies={gameState.enemies} 
            items={gameState.items} 
            particles={gameState.particles}
            width={CANVAS_WIDTH} height={CANVAS_HEIGHT} shakeIntensity={gameState.shakeIntensity} isCelebrating={isCelebrating}
        />
        
        {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 bg-black/99 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-3xl">
                <h1 className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-300 to-purple-800 mb-10 italic tracking-tighter drop-shadow-[0_0_60px_rgba(168,85,247,0.8)]">
                    紫岚战队
                </h1>
                <p className="text-cyan-100/60 text-3xl mb-16 max-w-4xl italic font-thin tracking-[0.1em] border-y-2 border-purple-500/30 py-10 uppercase leading-relaxed">
                    "{gameState.loreText}"
                </p>
                <button onClick={startGame} className="group relative px-28 py-10 bg-white text-black rounded-full font-black text-5xl transition-all hover:scale-110 hover:shadow-[0_0_120px_rgba(255,255,255,0.6)] flex items-center gap-8">
                    <Play size={60} fill="currentColor" /> 执行突围
                </button>
            </div>
        )}

        {(gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.VICTORY) && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-3xl ${gameState.status === GameStatus.VICTORY ? 'bg-purple-950/95' : 'bg-red-950/95'}`}>
                {gameState.status === GameStatus.VICTORY ? <Shield size={200} className="text-cyan-400 mb-10 drop-shadow-[0_0_80px_rgba(34,211,238,1)]"/> : <Zap size={200} className="text-red-500 mb-10 animate-bounce drop-shadow-[0_0_80px_red]"/>}
                <h2 className="text-[120px] font-black text-white mb-16 tracking-tighter italic">
                    {gameState.status === GameStatus.VICTORY ? 'MISSION CLEAR' : 'LINK SEVERED'}
                </h2>
                <button onClick={() => window.location.reload()} className="group flex items-center gap-8 px-24 py-10 bg-white text-black rounded-full font-black text-4xl hover:bg-cyan-400 transition-all shadow-[0_0_80px_rgba(255,255,255,0.4)]">
                    <RotateCcw size={48} className="group-hover:rotate-180 transition-transform duration-700" /> 战术复归
                </button>
            </div>
        )}
      </div>
      
       <div className="mt-12 flex justify-between w-[800px] text-purple-950 font-black text-[14px] tracking-[0.8em] uppercase opacity-40">
        <span>Unit: Z-Alpha // Grid: Urban-Core</span>
        <span className="flex items-center gap-6"><Volume2 size={24} /> Sync Status: 100%</span>
      </div>
    </div>
  );
}
