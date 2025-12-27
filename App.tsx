
import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { WarehouseView } from './components/WarehouseView';
import { GameState, GameStatus, Entity, EntityType, FloatingText, WeaponType, Item, Task } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG, WEAPON_STATS, ITEM_SIZE, HEAL_COST, HEAL_AMOUNT, UPGRADE_COST_BASE, COLOR_NEON_PURPLE, COLOR_NEON_CYAN, COLOR_NEON_GREEN, ALLY_IMG_GOLD } from './constants';
import { generateLevelLore } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Zap, Volume2, ShoppingBag, ArrowUpCircle, Activity } from 'lucide-react';

const INITIAL_TASKS: Task[] = [
    { id: 't1', title: '数据切片回收', description: '从前线扇区回收损毁的内存模块', reward: 300, completed: false },
    { id: 't2', title: '核心能源过载', description: '手动重载仓库备用发电机组', reward: 500, completed: false },
    { id: 't3', title: '逻辑协议修复', description: '清除受到污染的导航脚本', reward: 800, completed: false }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      health: 150,
      maxHealth: 150,
      damage: 55,
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
    loreText: "紫岚战队：作战协议已启动，目标定位中。",
    shakeIntensity: 0,
    hasRecruitedFriend: false,
    tasks: INITIAL_TASKS,
    deductionTarget: ""
  });

  const [isCelebrating, setIsCelebrating] = useState(false);
  const [scale, setScale] = useState(1);
  const stateRef = useRef<GameState>(gameState);
  const inputRef = useRef({ up: false, down: false, left: false, right: false, attack: false, skill1: false, buy: false, upgrade: false });
  const loopRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);
  const itemIdCounter = useRef<number>(0);

  // Responsive Scaling Logic
  useEffect(() => {
    const handleResize = () => {
      const padding = 120; // Room for HUD and footer
      const availableWidth = window.innerWidth - 40;
      const availableHeight = window.innerHeight - padding;
      const scaleW = availableWidth / CANVAS_WIDTH;
      const scaleH = availableHeight / (CANVAS_HEIGHT + 200); // 200 for HUD and spacing
      setScale(Math.min(1, scaleW, scaleH));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            velocity: { x: (Math.random()-0.5)*15, y: (Math.random()-0.5)*15 } 
        });
      }
  }

  const spawnItem = (x: number, y: number, type: 'WEAPON' | 'CURRENCY', subtype?: WeaponType, currentItems?: Item[]) => {
    itemIdCounter.current++;
    const item: Item = { id: itemIdCounter.current, type, subtype, amount: type === 'CURRENCY' ? 100 : 0, pos: { x, y }, size: ITEM_SIZE };
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
    const upgradeCost = Math.floor(UPGRADE_COST_BASE * Math.pow(1.5, (newPlayer.upgradeLevel || 1) - 1));
    if (input.upgrade && newCurrency >= upgradeCost) {
        newCurrency -= upgradeCost;
        newPlayer.upgradeLevel = (newPlayer.upgradeLevel || 1) + 1;
        newPlayer.maxHealth += 100;
        newPlayer.health = newPlayer.maxHealth;
        newPlayer.damage += 40;
        newPlayer.speed += 0.5;
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "UPGRADE: ELITE TIER", COLOR_NEON_PURPLE, newParticles);
        audioManager.playSfx('loot');
        inputRef.current.upgrade = false;
    }

    if (input.buy && newCurrency >= HEAL_COST && newPlayer.health < newPlayer.maxHealth) {
        newCurrency -= HEAL_COST;
        newPlayer.health = Math.min(newPlayer.health + HEAL_AMOUNT, newPlayer.maxHealth);
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "REPAIRED", COLOR_NEON_GREEN, newParticles);
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

    // Combat Logic
    if (input.attack && newPlayer.attackCooldown <= 0) {
        newPlayer.isAttacking = true;
        newPlayer.attackCooldown = newPlayer.maxAttackCooldown;
        audioManager.playSfx('attack');
        const range = WEAPON_STATS[newPlayer.weapon].range;
        newEnemies.forEach(enemy => {
            const dist = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2), (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2));
            if (dist < range + 80) {
                const dmg = newPlayer.damage + Math.floor(Math.random()*60);
                enemy.health -= dmg;
                enemy.hitFlashTimer = 15;
                spawnFloatingText(enemy.pos.x, enemy.pos.y, `OVERDRIVE: -${dmg}`, "#ff0000", newParticles);
                audioManager.playSfx('hit');
                newShake = 40;
            }
        });
    }

    // Allies AI
    newAllies.forEach(ally => {
        if (ally.attackCooldown > 0) ally.attackCooldown--;
        else ally.isAttacking = false;
        const target = newEnemies[0];
        if (target) {
            const adx = (target.pos.x + target.size/2) - (ally.pos.x + ally.size/2);
            const ady = (target.pos.y + target.size/2) - (ally.pos.y + ally.size/2);
            const dist = Math.hypot(adx, ady);
            if (dist > 130) {
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
            const pDistX = newPlayer.pos.x - 70 - ally.pos.x;
            const pDistY = newPlayer.pos.y - ally.pos.y;
            const dist = Math.hypot(pDistX, pDistY);
            if (dist > 70) {
                ally.pos.x += (pDistX / dist) * ally.speed;
                ally.pos.y += (pDistY / dist) * ally.speed;
                ally.isMoving = true;
            } else { ally.isMoving = false; }
        }
    });

    // Loot
    newItems = newItems.filter(item => {
        const d = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (item.pos.x + item.size/2), (newPlayer.pos.y + newPlayer.size/2) - (item.pos.y + item.size/2));
        if (d < 75) {
            if (item.type === 'WEAPON' && item.subtype) {
                newPlayer.weapon = item.subtype;
                const s = WEAPON_STATS[item.subtype];
                newPlayer.damage = s.damage + (newPlayer.upgradeLevel || 1) * 35;
                newPlayer.maxAttackCooldown = s.cooldown;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `SYNC: ${s.name}`, s.color, newParticles);
            } else {
                newCurrency += item.amount || 100;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "+CREDITS", "#ffd60a", newParticles);
            }
            audioManager.playSfx('loot');
            return false;
        }
        return true;
    });

    // Enemies
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

            if (dist < 110 && frameCountRef.current % 25 === 0) {
                newPlayer.health -= enemy.damage;
                newPlayer.hitFlashTimer = 15;
                audioManager.playSfx('damage');
                spawnBloodSplat(newPlayer.pos.x + newPlayer.size/2, newPlayer.pos.y + newPlayer.size/2, newParticles);
                newShake = 30;
            }
        } else {
            newScore += 10000;
            newCurrency += 150;
            if (Math.random() > 0.6) spawnItem(enemy.pos.x, enemy.pos.y, 'WEAPON', [WeaponType.SWORD, WeaponType.HAMMER, WeaponType.DUAL_BLADES][Math.floor(Math.random()*3)], newItems);
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
                setGameState(p => ({ ...p, status: p.level >= 3 ? GameStatus.VICTORY : GameStatus.LEVEL_TRANSITION }));
            }
        }, 3000);
    }

    frameCountRef.current++;
    setGameState(prev => ({ ...prev, player: newPlayer, enemies: newEnemies, allies: newAllies, items: newItems, particles: newParticles, status: isCelebrating ? prev.status : newStatus, score: newScore, currency: newCurrency, shakeIntensity: newShake }));
  };

  const gameLoop = () => { updateGame(); loopRef.current = requestAnimationFrame(gameLoop); };
  useEffect(() => { if (gameState.status === GameStatus.PLAYING) loopRef.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(loopRef.current); }, [gameState.status, isCelebrating]);

  const startGame = async () => {
    audioManager.init();
    const lore = await generateLevelLore(1, true);
    startLevel(1, { ...gameState.player, health: 150, upgradeLevel: 1, weapon: WeaponType.FISTS }, 0, 0, lore);
  };

  const startLevel = (levelNum: number, pState: Entity, score: number, curr: number, lore: string) => {
    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG];
    const enemies: Entity[] = [];
    const allies: Entity[] = [];

    if (stateRef.current.hasRecruitedFriend) {
        allies.push({
            id: 'ally_gingo', type: EntityType.ALLY, pos: { x: 100, y: CANVAS_HEIGHT/2 },
            size: PLAYER_SIZE, speed: PLAYER_SPEED * 0.9, health: 1500, maxHealth: 1500,
            weapon: WeaponType.SWORD, damage: 60, attackCooldown: 0, maxAttackCooldown: 25, facing: 'right', visualUrl: ALLY_IMG_GOLD
        });
    }

    for(let i=0; i<config.bossCount; i++) {
        const uniqueSeed = `boss_${levelNum}_${i}_${Date.now()}`;
        enemies.push({
            id: `boss_${levelNum}_${i}`, type: EntityType.ENEMY_BOSS,
            pos: { x: Math.random() > 0.5 ? -400 : CANVAS_WIDTH + 400, y: Math.random() * CANVAS_HEIGHT },
            size: BOSS_SIZE * (0.7 + Math.random()*0.3), speed: config.enemySpeed * (0.9 + Math.random()*0.2), health: config.bossHealth, maxHealth: config.bossHealth,
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
              const lore = await generateLevelLore(nl, true);
              startLevel(nl, gameState.player, gameState.score, gameState.currency, lore);
          };
          next();
      }
  }, [gameState.status]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-[#010208] relative font-sans overflow-hidden">
      
      {/* Scaling Container to fix the "Picture Frame Exceeded Display" issue */}
      <div 
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'transform 0.3s ease-out' }} 
        className="flex flex-col items-center justify-center"
      >
        
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
                        alert("解析成功：获得 10 积分奖励。");
                    } else {
                        alert("逻辑链条断裂：系统硬重启中...");
                        window.location.reload();
                    }
                }}
            />
        )}

        {/* HUD Layer */}
        <div className="w-[800px] flex justify-between items-end mb-4 p-10 bg-[#0c0c1a]/95 rounded-t-[3.5rem] border-x-4 border-t-4 border-blue-500/30 backdrop-blur-3xl z-20 shadow-[0_-40px_100px_rgba(0,122,255,0.4)]">
            <div className="flex gap-14">
                <div className="flex flex-col">
                    <div className="flex items-center gap-6 text-blue-400 mb-4">
                        <Activity size={44} className="animate-pulse shadow-[0_0_30px_blue]" />
                        <span className="font-mono text-6xl font-black italic tracking-tighter">STRUCT: {Math.round(gameState.player.health)}</span>
                    </div>
                    <div className="w-96 h-6 bg-black/95 rounded-full border-2 border-blue-500/20 overflow-hidden shadow-inner p-1">
                        <div className="h-full bg-gradient-to-r from-blue-900 via-blue-400 to-white shadow-[0_0_30px_rgba(0,122,255,1)] transition-all duration-1000" style={{ width: `${(gameState.player.health/gameState.player.maxHealth)*100}%` }}></div>
                    </div>
                </div>
                
                <div className="flex gap-8">
                    <button onClick={() => inputRef.current.upgrade = true} className={`group flex flex-col items-center justify-center w-28 h-28 rounded-3xl border-2 transition-all active:scale-90 ${gameState.currency >= Math.floor(UPGRADE_COST_BASE * Math.pow(1.5, (gameState.player.upgradeLevel || 1) - 1)) ? 'bg-purple-800 border-white text-white shadow-[0_0_60px_rgba(223,36,255,1)]' : 'bg-gray-950 border-gray-800 text-gray-700'}`}>
                        <ArrowUpCircle size={40} className="mb-1" />
                        <span className="text-[11px] font-black uppercase">LV{gameState.player.upgradeLevel} [U]</span>
                    </button>
                    <button onClick={() => inputRef.current.buy = true} className={`group flex flex-col items-center justify-center w-28 h-28 rounded-3xl border-2 transition-all active:scale-90 ${gameState.currency >= HEAL_COST ? 'bg-green-800 border-white text-white shadow-[0_0_60px_rgba(57,255,20,0.8)]' : 'bg-gray-950 border-gray-800 text-gray-700'}`}>
                        <Heart size={40} className="mb-1" />
                        <span className="text-[11px] font-black uppercase">FIX [B]</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <div className="text-right">
                    <span className="block text-sm font-black text-blue-400 uppercase tracking-[0.5em] mb-3">Sync Credits</span>
                    <span className="text-6xl font-black italic flex items-center gap-4 text-white"><ShoppingBag size={40} className="text-blue-400"/> {gameState.currency}</span>
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
                    <h1 className="text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-400 to-blue-900 mb-14 italic tracking-tighter drop-shadow-[0_0_100px_rgba(0,122,255,1)]">
                        紫岚战队
                    </h1>
                    <p className="text-cyan-100/60 text-5xl mb-24 max-w-6xl italic font-thin tracking-widest border-y-2 border-blue-500/20 py-16 uppercase leading-tight">
                        "首要目标：清除竞技场内的3个头目。"
                    </p>
                    <button onClick={startGame} className="group relative px-40 py-14 bg-white text-blue-900 rounded-[2.5rem] font-black text-7xl transition-all hover:scale-110 hover:shadow-[0_0_200px_rgba(255,255,255,0.8)] flex items-center gap-14">
                        <Play size={100} fill="currentColor" /> 启动协议
                    </button>
                </div>
            )}

            {(gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.VICTORY) && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-[80px] ${gameState.status === GameStatus.VICTORY ? 'bg-blue-950/98 shadow-[inset_0_0_300px_blue]' : 'bg-red-950/98 shadow-[inset_0_0_300px_red]'}`}>
                    {gameState.status === GameStatus.VICTORY ? <Shield size={300} className="text-white mb-16 drop-shadow-[0_0_150px_cyan]"/> : <Zap size={300} className="text-white mb-16 animate-pulse drop-shadow-[0_0_150px_red]"/>}
                    <h2 className="text-[150px] font-black text-white mb-24 tracking-tighter italic uppercase">
                        {gameState.status === GameStatus.VICTORY ? 'SYNC COMPLETE' : 'CORE OFFLINE'}
                    </h2>
                    <button onClick={() => window.location.reload()} className="group flex items-center gap-12 px-32 py-14 bg-white text-black rounded-[2.5rem] font-black text-6xl hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_120px_rgba(255,255,255,0.6)]">
                        <RotateCcw size={80} className="group-hover:rotate-180 transition-transform duration-1000" /> 系统重启
                    </button>
                </div>
            )}
        </div>
        
        <div className="mt-14 flex justify-between w-[800px] text-blue-900 font-black text-[18px] tracking-[1.2em] uppercase opacity-20">
            <span>ZILAN_CORP // URBAN_STRIKE_HUB</span>
            <span className="flex items-center gap-10"><Volume2 size={36} /> SIGNAL: STEADY</span>
        </div>

      </div>
    </div>
  );
}
