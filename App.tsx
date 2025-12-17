import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState, GameStatus, Entity, EntityType, FloatingText, WeaponType, Item } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG, WEAPON_STATS, ITEM_SIZE, SKILL_COOLDOWN_AMBUSH, HEAL_COST, HEAL_AMOUNT } from './constants';
import { generateLevelLore, generateVictoryMessage } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Skull, Zap, Volume2, ShoppingBag } from 'lucide-react';

export default function App() {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      health: 100,
      maxHealth: 100,
      damage: 20,
      weapon: WeaponType.FISTS,
      attackCooldown: 0,
      maxAttackCooldown: 20,
      facing: 'right',
      visualUrl: PLAYER_IMG,
      dashCooldown: 0
    },
    enemies: [],
    items: [],
    particles: [],
    level: 1,
    score: 0,
    currency: 0,
    status: GameStatus.IDLE,
    gameBounds: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    loreText: "准备好加入代号“麦芒”的行动了吗？",
    shakeIntensity: 0
  });

  const [isCelebrating, setIsCelebrating] = useState(false);

  // Refs for loop performance
  const stateRef = useRef<GameState>(gameState);
  const inputRef = useRef({ up: false, down: false, left: false, right: false, attack: false, skill1: false, buy: false });
  const loopRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);
  const itemIdCounter = useRef<number>(0);

  // Sync ref with state
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // --- Input Handling ---
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Helpers ---
  const spawnFloatingText = (x: number, y: number, text: string, color: string, currentParticles: FloatingText[]) => {
    particleIdCounter.current++;
    currentParticles.push({
        id: particleIdCounter.current,
        x,
        y,
        text,
        color,
        life: 45,
        velocity: { x: (Math.random() - 0.5) * 2, y: -2 }
    });
  };

  const spawnItem = (x: number, y: number, type: 'WEAPON' | 'CURRENCY', subtype?: WeaponType, currentItems?: Item[]) => {
    itemIdCounter.current++;
    const item: Item = {
        id: itemIdCounter.current,
        type,
        subtype,
        amount: type === 'CURRENCY' ? 10 : 0,
        pos: { x, y },
        size: ITEM_SIZE
    };
    if (currentItems) currentItems.push(item);
    return item;
  };

  // --- Game Loop Logic ---
  const updateGame = () => {
    const currentState = stateRef.current;
    if (currentState.status !== GameStatus.PLAYING) return;
    
    // Prevent updates during celebration delay
    if (isCelebrating) return; 

    const input = inputRef.current;
    let newPlayer = { ...currentState.player };
    let newEnemies = currentState.enemies.map(e => ({...e}));
    let newItems = [...currentState.items];
    let newParticles = currentState.particles.map(p => ({...p, x: p.x + p.velocity.x, y: p.y + p.velocity.y, life: p.life - 1})).filter(p => p.life > 0);
    let newStatus: GameStatus = currentState.status;
    let newScore = currentState.score;
    let newCurrency = currentState.currency;
    let newShake = Math.max(0, currentState.shakeIntensity - 2);

    // --- 0. Shop Logic ---
    if (input.buy) {
        if (newCurrency >= HEAL_COST && newPlayer.health < newPlayer.maxHealth) {
            newCurrency -= HEAL_COST;
            newPlayer.health = Math.min(newPlayer.health + HEAL_AMOUNT, newPlayer.maxHealth);
            spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "+HP", "#22c55e", newParticles);
            audioManager.playSfx('buy');
            inputRef.current.buy = false; // consume input
        }
    }

    // --- 1. Player Logic ---
    // Cooldowns
    if (newPlayer.attackCooldown > 0) newPlayer.attackCooldown--;
    else newPlayer.isAttacking = false;
    
    if (newPlayer.dashCooldown && newPlayer.dashCooldown > 0) newPlayer.dashCooldown--;
    if (newPlayer.hitFlashTimer && newPlayer.hitFlashTimer > 0) newPlayer.hitFlashTimer--;

    // Movement
    let dx = 0; let dy = 0;
    if (input.up) dy -= newPlayer.speed;
    if (input.down) dy += newPlayer.speed;
    if (input.left) { dx -= newPlayer.speed; newPlayer.facing = 'left'; }
    if (input.right) { dx += newPlayer.speed; newPlayer.facing = 'right'; }
    
    newPlayer.pos = {
        x: Math.min(Math.max(newPlayer.pos.x + dx, 0), CANVAS_WIDTH - newPlayer.size),
        y: Math.min(Math.max(newPlayer.pos.y + dy, 0), CANVAS_HEIGHT - newPlayer.size)
    };

    // Item Pickup
    newItems = newItems.filter(item => {
        const dist = Math.hypot(newPlayer.pos.x - item.pos.x, newPlayer.pos.y - item.pos.y);
        if (dist < newPlayer.size) {
            if (item.type === 'WEAPON' && item.subtype) {
                // Swap Weapon
                newPlayer.weapon = item.subtype;
                const stats = WEAPON_STATS[item.subtype];
                newPlayer.damage = stats.damage;
                newPlayer.maxAttackCooldown = stats.cooldown;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `GET ${item.subtype}!`, stats.color, newParticles);
                audioManager.playSfx('loot');
                return false; // Consume item
            }
            if (item.type === 'CURRENCY') {
                newCurrency += (item.amount || 10);
                audioManager.playSfx('loot');
                return false;
            }
        }
        return true;
    });

    // Attacks & Skills
    const weaponStats = WEAPON_STATS[newPlayer.weapon];
    const range = weaponStats.range;

    // SKILL 1: Ambush / Flash Strike
    if (input.skill1 && (!newPlayer.dashCooldown || newPlayer.dashCooldown <= 0)) {
        newPlayer.dashCooldown = SKILL_COOLDOWN_AMBUSH;
        audioManager.playSfx('skill');
        
        // Dash Effect
        const dashDist = 200;
        const dashDir = newPlayer.facing === 'right' ? 1 : -1;
        newPlayer.pos.x = Math.min(Math.max(newPlayer.pos.x + (dashDist * dashDir), 0), CANVAS_WIDTH - newPlayer.size);
        
        // Check for backstabs
        newEnemies.forEach(enemy => {
            const dist = Math.hypot(newPlayer.pos.x - enemy.pos.x, newPlayer.pos.y - enemy.pos.y);
            if (dist < 100) {
                // Check if behind
                const isBehind = (newPlayer.facing === enemy.facing); 
                const dmg = isBehind ? newPlayer.damage * 4 : newPlayer.damage; 
                
                enemy.health -= dmg;
                enemy.hitFlashTimer = 20;
                spawnFloatingText(enemy.pos.x, enemy.pos.y, isBehind ? `BACKSTAB! -${dmg}` : `-${dmg}`, isBehind ? '#ef4444' : '#ffffff', newParticles);
                
                if (isBehind) {
                    newShake = 20;
                    audioManager.playSfx('hit');
                }
            }
        });
    }

    // Normal Attack
    if (input.attack && newPlayer.attackCooldown <= 0) {
        newPlayer.isAttacking = true;
        newPlayer.attackCooldown = newPlayer.maxAttackCooldown;
        audioManager.playSfx('attack');
        
        const attackCenter = {
            x: newPlayer.pos.x + (newPlayer.size / 2) + (newPlayer.facing === 'right' ? range/2 : -range/2),
            y: newPlayer.pos.y + (newPlayer.size / 2)
        };

        newEnemies.forEach(enemy => {
            const enemyCenter = { x: enemy.pos.x + enemy.size/2, y: enemy.pos.y + enemy.size/2 };
            const dist = Math.hypot(attackCenter.x - enemyCenter.x, attackCenter.y - enemyCenter.y);
            
            if (dist < range) {
                const dmg = newPlayer.damage + Math.floor(Math.random() * 5);
                enemy.health -= dmg;
                enemy.hitFlashTimer = 10;
                spawnFloatingText(enemy.pos.x + enemy.size/2, enemy.pos.y, `-${dmg}`, '#ef4444', newParticles);
                audioManager.playSfx('hit');
                
                // Knockback
                const kDir = newPlayer.facing === 'right' ? 1 : -1;
                enemy.pos.x += kDir * (newPlayer.weapon === WeaponType.HAMMER ? 60 : 20);
                newShake += 2;
            }
        });
    }

    // --- 2. Enemy Logic ---
    const aliveEnemies: Entity[] = [];
    newEnemies.forEach(enemy => {
        if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
        
        if (enemy.health > 0) {
            aliveEnemies.push(enemy);
            
            // AI: Weapon Seeking
            let targetX = newPlayer.pos.x;
            let targetY = newPlayer.pos.y;
            let seekingWeapon = false;

            if (enemy.weapon === WeaponType.FISTS) {
                const closestWeapon = newItems.find(i => i.type === 'WEAPON');
                if (closestWeapon) {
                    targetX = closestWeapon.pos.x;
                    targetY = closestWeapon.pos.y;
                    seekingWeapon = true;
                }
            }

            // Move
            const centerX = targetX + (seekingWeapon ? 0 : newPlayer.size/2) - enemy.size/2;
            const centerY = targetY + (seekingWeapon ? 0 : newPlayer.size/2) - enemy.size/2;
            const angle = Math.atan2(centerY - enemy.pos.y, centerX - enemy.pos.x);
            
            const wiggle = Math.sin(frameCountRef.current * 0.1 + parseInt(enemy.id.split('_')[2] || '0')) * 0.5;
            enemy.pos.x += (Math.cos(angle) * enemy.speed) + wiggle;
            enemy.pos.y += (Math.sin(angle) * enemy.speed) + wiggle;
            enemy.facing = Math.cos(angle) > 0 ? 'right' : 'left';

            // Enemy Collision
            if (seekingWeapon) {
                 const d = Math.hypot(enemy.pos.x - targetX, enemy.pos.y - targetY);
                 if (d < 30) {
                     const wItemIndex = newItems.findIndex(i => i.type === 'WEAPON');
                     if (wItemIndex !== -1) {
                         const w = newItems[wItemIndex];
                         if (w.subtype) {
                             enemy.weapon = w.subtype;
                             const stats = WEAPON_STATS[w.subtype];
                             enemy.damage = stats.damage * 0.5; 
                             enemy.maxAttackCooldown = stats.cooldown + 30; // Enemy attacks much slower than player (Nerfed)
                             spawnFloatingText(enemy.pos.x, enemy.pos.y, "EQUIPPED!", "#fbbf24", newParticles);
                             newItems.splice(wItemIndex, 1);
                         }
                     }
                 }
            } else {
                // Attack Player
                const distToPlayer = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2), (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2));
                if (distToPlayer < (newPlayer.size/2 + enemy.size/3)) {
                     // Slower attack rate for enemies
                     if (frameCountRef.current % (enemy.maxAttackCooldown || 60) === 0) {
                        const enemyDmg = enemy.damage;
                        newPlayer.health -= enemyDmg;
                        newPlayer.hitFlashTimer = 10;
                        newShake = 15;
                        spawnFloatingText(newPlayer.pos.x + newPlayer.size/2, newPlayer.pos.y, `-${enemyDmg}`, '#ffffff', newParticles);
                        audioManager.playSfx('damage');
                     }
                }
            }

        } else {
            // Died
            newScore += 100;
            spawnItem(enemy.pos.x, enemy.pos.y, 'CURRENCY', undefined, newItems);
            spawnFloatingText(enemy.pos.x, enemy.pos.y, "击杀!", '#fbbf24', newParticles);
        }
    });
    newEnemies = aliveEnemies;

    // --- 3. Status Checks ---
    if (newPlayer.health <= 0) {
        newPlayer.health = 0;
        newStatus = GameStatus.GAME_OVER;
        audioManager.stopBgm();
        audioManager.playSfx('gameover');
    } else if (newEnemies.length === 0) {
        // TRIGGER VICTORY DANCE (Delay transition)
        if (!isCelebrating) {
            setIsCelebrating(true);
            audioManager.playSfx('victory');
            
            // Wait 2 seconds for celebration animation then transition
            setTimeout(() => {
                setIsCelebrating(false);
                if (currentState.level >= 5) {
                    newStatus = GameStatus.VICTORY;
                    audioManager.stopBgm();
                } else {
                    newStatus = GameStatus.LEVEL_TRANSITION;
                }
                // Need to force update state inside timeout because it's a closure
                setGameState(prev => ({ ...prev, status: newStatus }));
            }, 2000);
        }
    }

    frameCountRef.current++;
    setGameState(prev => ({
        ...prev,
        player: newPlayer,
        enemies: newEnemies,
        items: newItems,
        particles: newParticles,
        // Only update status if we aren't waiting for the celebration to finish
        status: isCelebrating ? prev.status : newStatus, 
        score: newScore,
        currency: newCurrency,
        shakeIntensity: newShake
    }));
  };

  const gameLoop = () => {
    updateGame();
    loopRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
        loopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(loopRef.current);
  }, [gameState.status, isCelebrating]); // Add isCelebrating dependency


  // --- Logic ---
  const startGame = async () => {
    audioManager.init();
    audioManager.playBgm(1);
    const freshPlayer = { ...stateRef.current.player, health: 100, weapon: WeaponType.FISTS, damage: 20, pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 } };
    const lore = await generateLevelLore(1, false);
    startLevel(1, freshPlayer, 0, 0, lore);
  };

  const startLevel = (levelNum: number, playerState: Entity, score: number, currency: number, lore: string) => {
    audioManager.playBgm(levelNum);
    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG];
    
    // Spawn Enemies
    const spawnedEnemies: Entity[] = [];
    for(let i=0; i<config.enemyCount; i++) {
        const isSide = Math.random() > 0.5;
        const x = isSide ? (Math.random() > 0.5 ? 0 : CANVAS_WIDTH - ENEMY_SIZE) : Math.random() * CANVAS_WIDTH;
        const y = isSide ? Math.random() * CANVAS_HEIGHT : (Math.random() > 0.5 ? 0 : CANVAS_HEIGHT - ENEMY_SIZE);
        
        spawnedEnemies.push({
            id: `enemy_${levelNum}_${i}`,
            type: EntityType.ENEMY_MELEE,
            pos: { x, y },
            size: ENEMY_SIZE,
            speed: config.enemySpeed + (Math.random() * 0.3),
            health: config.enemyHealth,
            maxHealth: config.enemyHealth,
            damage: 8, // Reduced damage
            weapon: WeaponType.FISTS,
            maxAttackCooldown: 80, // Slower attacks
            attackCooldown: 0,
            facing: x < CANVAS_WIDTH/2 ? 'right' : 'left',
            // Use 'seed' param for Pollinations AI to ensure variety but consistency
            visualUrl: `${ENEMY_IMG_BASE}&seed=${i}_${levelNum}`
        });
    }

    if (config.boss) {
         spawnedEnemies.push({
            id: `boss_${levelNum}`,
            type: EntityType.ENEMY_BOSS,
            pos: { x: CANVAS_WIDTH / 2, y: 50 },
            size: BOSS_SIZE,
            speed: config.enemySpeed * 0.8,
            health: config.enemyHealth * 5, 
            maxHealth: config.enemyHealth * 5,
            damage: 20,
            weapon: WeaponType.HAMMER, // Boss starts with Hammer
            maxAttackCooldown: 90,
            attackCooldown: 0,
            facing: 'left',
            visualUrl: BOSS_IMG
        });
    }

    // Spawn Center Weapon (The Scramble!)
    const items: Item[] = [];
    const weaponPool = [WeaponType.SWORD, WeaponType.HAMMER, WeaponType.DUAL_BLADES];
    const randomWeapon = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    
    // Always spawn a weapon in center for levels > 1
    if (levelNum >= 1) {
        itemIdCounter.current++;
        items.push({
            id: itemIdCounter.current,
            type: 'WEAPON',
            subtype: randomWeapon,
            pos: { x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT / 2 + 100 }, 
            size: ITEM_SIZE
        });
    }

    setGameState({
        player: playerState,
        enemies: spawnedEnemies,
        items: items,
        particles: [],
        level: levelNum,
        score: score,
        currency: currency,
        status: GameStatus.PLAYING,
        gameBounds: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        loreText: lore,
        shakeIntensity: 0
    });
    setIsCelebrating(false);
  };

  const nextLevel = async () => {
    const nextLvl = gameState.level + 1;
    setGameState(prev => ({ ...prev, status: GameStatus.IDLE })); 
    let lore = "";
    if (nextLvl <= 5) {
        lore = await generateLevelLore(nextLvl, LEVEL_CONFIG[nextLvl as keyof typeof LEVEL_CONFIG].boss);
        startLevel(nextLvl, gameState.player, gameState.score, gameState.currency, lore);
    }
  };
  
  const finishGame = async () => {
      const victoryMsg = await generateVictoryMessage();
      setGameState(prev => ({...prev, loreText: victoryMsg}));
  }

  useEffect(() => {
    if (gameState.status === GameStatus.LEVEL_TRANSITION) nextLevel();
    if (gameState.status === GameStatus.VICTORY) finishGame();
  }, [gameState.status]);

  // --- Render ---
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-slate-900 scanlines relative font-sans">
      
      {/* HUD */}
      <div className="w-[800px] flex justify-between items-start mb-2 p-4 bg-slate-800/90 rounded-lg border-2 border-slate-600 shadow-lg z-20">
        <div className="flex gap-6">
            <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2 text-red-400">
                    <Heart size={20} fill="currentColor" />
                    <span className="font-mono text-2xl font-bold">{Math.round(gameState.player.health)}</span>
                 </div>
                 <div className="w-40 h-2 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${(gameState.player.health/gameState.player.maxHealth)*100}%` }}></div>
                 </div>
            </div>
            
            {/* Skills HUD */}
            <div className="flex gap-2">
                <div className="relative group">
                    <div className={`w-12 h-12 rounded border-2 flex items-center justify-center transition-colors ${gameState.player.dashCooldown && gameState.player.dashCooldown > 0 ? 'border-gray-600 bg-gray-800 text-gray-500' : 'border-purple-400 bg-purple-900/50 text-purple-300 shadow-[0_0_10px_#a855f7]'}`}>
                        <span className="font-bold text-xl">1</span>
                    </div>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">影袭</span>
                </div>
                
                <div className="relative group">
                    <div className="w-12 h-12 rounded border-2 border-gray-600 bg-gray-800 flex items-center justify-center opacity-50">
                        <span className="font-bold text-xl">SPACE</span>
                    </div>
                     <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">攻击</span>
                </div>
            </div>
        </div>

        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <span className="block text-xs text-slate-500">CREDITS</span>
                    <span className="font-mono text-2xl font-bold text-purple-400 flex items-center justify-end gap-1">
                        <ShoppingBag size={16} /> {gameState.currency}
                    </span>
                </div>
                <div className="text-right">
                    <span className="block text-xs text-slate-500">SCORE</span>
                    <span className="font-mono text-2xl font-bold text-green-500">{gameState.score.toString().padStart(6, '0')}</span>
                </div>
            </div>
            {/* Shop Hint */}
            <div className="text-xs bg-black/50 px-2 py-1 rounded border border-gray-700 text-gray-400">
                [B] 购买补给 ({HEAL_COST})
            </div>
        </div>
      </div>

      <div className="relative z-10">
        <GameCanvas 
            player={gameState.player} 
            enemies={gameState.enemies} 
            items={gameState.items}
            particles={gameState.particles}
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            shakeIntensity={gameState.shakeIntensity}
            isCelebrating={isCelebrating}
        />
        
        {/* Status Overlays */}
        {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm z-30">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-300 mb-6 drop-shadow-lg">
                    现实回响：街头战线
                </h1>
                <p className="text-gray-200 mb-8 max-w-lg border-l-4 border-purple-500 pl-4 bg-white/5 p-4 rounded text-left">
                    {gameState.loreText}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-8 w-full max-w-md">
                    <div className="bg-gray-800 p-2 rounded border border-gray-700 text-center">
                        <span className="font-bold text-purple-400 block mb-1">技能 [1]</span>
                        <span>背后突袭造成4倍伤害</span>
                    </div>
                    <div className="bg-gray-800 p-2 rounded border border-gray-700 text-center">
                        <span className="font-bold text-yellow-400 block mb-1">夺取武器</span>
                        <span>不要让敌人拿到地图中央的武器!</span>
                    </div>
                </div>
                <button 
                    onClick={startGame}
                    className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center gap-2"
                >
                    <Play size={24} /> 开始战斗
                </button>
            </div>
        )}

        {/* Similar Overlays for GameOver/Victory... */}
        {(gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.VICTORY) && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md z-30 ${gameState.status === GameStatus.VICTORY ? 'bg-yellow-900/90' : 'bg-red-950/90'}`}>
                {gameState.status === GameStatus.VICTORY ? <Shield size={80} className="text-yellow-400 mb-4"/> : <Skull size={80} className="text-red-500 mb-4"/>}
                <h2 className="text-6xl font-black text-white mb-4">{gameState.status === GameStatus.VICTORY ? '任务完成' : '行动失败'}</h2>
                <button 
                    onClick={() => setGameState(prev => ({...prev, status: GameStatus.IDLE, loreText: "重新初始化..."}))}
                    className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded font-bold hover:bg-gray-200"
                >
                    <RotateCcw size={20} /> 返回大厅
                </button>
            </div>
        )}
      </div>
      
       <div className="mt-4 flex justify-between w-[800px] text-slate-500 text-xs font-mono">
        <span>NEON CITY OS v3.0</span>
        <span className="flex items-center gap-2"><Volume2 size={12} /> AUDIO: ACTIVE</span>
      </div>
    </div>
  );
}