import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState, GameStatus, Entity, EntityType, FloatingText, WeaponType, Item } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG, WEAPON_STATS, ITEM_SIZE, SKILL_COOLDOWN_AMBUSH, HEAL_COST, HEAL_AMOUNT, UPGRADE_COST_BASE } from './constants';
import { generateLevelLore, generateVictoryMessage } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Skull, Zap, Volume2, ShoppingBag, ArrowUpCircle } from 'lucide-react';

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
      damage: 25,
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
    loreText: "麦野中的最后防线已部署。特种兵，准备迎战。",
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
    currentParticles.push({ id: particleIdCounter.current, x, y, text, color, life: 40, velocity: { x: (Math.random() - 0.5) * 2, y: -2.5 } });
  };

  const spawnItem = (x: number, y: number, type: 'WEAPON' | 'CURRENCY', subtype?: WeaponType, currentItems?: Item[]) => {
    itemIdCounter.current++;
    const item: Item = { id: itemIdCounter.current, type, subtype, amount: type === 'CURRENCY' ? 15 : 0, pos: { x, y }, size: ITEM_SIZE };
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
    let newParticles = currentState.particles.map(p => ({...p, x: p.x + p.velocity.x, y: p.y + p.velocity.y, life: p.life - 1})).filter(p => p.life > 0);
    let newStatus: GameStatus = currentState.status;
    let newScore = currentState.score;
    let newCurrency = currentState.currency;
    let newShake = Math.max(0, currentState.shakeIntensity - 1);

    // --- Upgrade Logic ---
    const upgradeCost = UPGRADE_COST_BASE * (newPlayer.upgradeLevel || 1);
    if (input.upgrade && newCurrency >= upgradeCost) {
        newCurrency -= upgradeCost;
        newPlayer.upgradeLevel = (newPlayer.upgradeLevel || 1) + 1;
        newPlayer.maxHealth += 20;
        newPlayer.health += 20;
        newPlayer.damage += 10;
        newPlayer.speed += 0.2;
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "UPGRADED!", "#fbbf24", newParticles);
        audioManager.playSfx('loot');
        inputRef.current.upgrade = false;
    }

    if (input.buy && newCurrency >= HEAL_COST && newPlayer.health < newPlayer.maxHealth) {
        newCurrency -= HEAL_COST;
        newPlayer.health = Math.min(newPlayer.health + HEAL_AMOUNT, newPlayer.maxHealth);
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "+HP", "#22c55e", newParticles);
        audioManager.playSfx('buy');
        inputRef.current.buy = false;
    }

    // --- Player Logic ---
    if (newPlayer.attackCooldown > 0) newPlayer.attackCooldown--;
    else newPlayer.isAttacking = false;
    if (newPlayer.dashCooldown && newPlayer.dashCooldown > 0) newPlayer.dashCooldown--;
    if (newPlayer.hitFlashTimer && newPlayer.hitFlashTimer > 0) newPlayer.hitFlashTimer--;

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

    // Item Pickup
    newItems = newItems.filter(item => {
        const dist = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (item.pos.x + item.size/2), (newPlayer.pos.y + newPlayer.size/2) - (item.pos.y + item.size/2));
        if (dist < 40) {
            if (item.type === 'WEAPON' && item.subtype) {
                newPlayer.weapon = item.subtype;
                const stats = WEAPON_STATS[item.subtype];
                newPlayer.damage = stats.damage + (newPlayer.upgradeLevel || 0) * 5;
                newPlayer.maxAttackCooldown = stats.cooldown;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `WEAPON: ${item.subtype}`, stats.color, newParticles);
                audioManager.playSfx('loot');
                return false;
            }
            if (item.type === 'CURRENCY') {
                newCurrency += item.amount || 15;
                audioManager.playSfx('loot');
                return false;
            }
        }
        return true;
    });

    // Attack
    if (input.attack && newPlayer.attackCooldown <= 0) {
        newPlayer.isAttacking = true;
        newPlayer.attackCooldown = newPlayer.maxAttackCooldown;
        audioManager.playSfx('attack');
        const range = WEAPON_STATS[newPlayer.weapon].range;
        const attackBox = { x: newPlayer.pos.x + (newPlayer.facing === 'right' ? newPlayer.size : -range), y: newPlayer.pos.y, w: range, h: newPlayer.size };
        
        newEnemies.forEach(enemy => {
            const dist = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2), (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2));
            if (dist < range + 20) {
                enemy.health -= newPlayer.damage;
                enemy.hitFlashTimer = 10;
                spawnFloatingText(enemy.pos.x, enemy.pos.y, `-${newPlayer.damage}`, "#ef4444", newParticles);
                audioManager.playSfx('hit');
                newShake = 10;
            }
        });
    }

    // --- Enemy Logic ---
    const aliveEnemies: Entity[] = [];
    newEnemies.forEach(enemy => {
        if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
        if (enemy.health > 0) {
            aliveEnemies.push(enemy);
            const dx = (newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2);
            const dy = (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2);
            const dist = Math.hypot(dx, dy);
            
            enemy.isMoving = dist > 50;
            if (dist > 40) {
                enemy.pos.x += (dx / dist) * enemy.speed;
                enemy.pos.y += (dy / dist) * enemy.speed;
                enemy.facing = dx > 0 ? 'right' : 'left';
            }

            if (dist < 60 && frameCountRef.current % 45 === 0) {
                newPlayer.health -= enemy.damage;
                newPlayer.hitFlashTimer = 10;
                audioManager.playSfx('damage');
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `-${enemy.damage}`, "#ffffff", newParticles);
            }
        } else {
            newScore += 100;
            newCurrency += 20;
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
        }, 2000);
    }

    frameCountRef.current++;
    setGameState(prev => ({ ...prev, player: newPlayer, enemies: newEnemies, items: newItems, particles: newParticles, status: isCelebrating ? prev.status : newStatus, score: newScore, currency: newCurrency, shakeIntensity: newShake }));
  };

  const gameLoop = () => { updateGame(); loopRef.current = requestAnimationFrame(gameLoop); };
  useEffect(() => { if (gameState.status === GameStatus.PLAYING) loopRef.current = requestAnimationFrame(gameLoop); return () => cancelAnimationFrame(loopRef.current); }, [gameState.status, isCelebrating]);

  const startGame = async () => {
    audioManager.init();
    const lore = await generateLevelLore(1, false);
    startLevel(1, { ...gameState.player, health: 100, upgradeLevel: 1 }, 0, 0, lore);
  };

  const startLevel = (levelNum: number, pState: Entity, score: number, curr: number, lore: string) => {
    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG];
    const enemies: Entity[] = [];
    for(let i=0; i<config.enemyCount; i++) {
        enemies.push({
            id: `e_${i}`, type: EntityType.ENEMY_MELEE,
            pos: { x: Math.random() * CANVAS_WIDTH, y: Math.random() > 0.5 ? -100 : CANVAS_HEIGHT + 100 },
            size: ENEMY_SIZE, speed: config.enemySpeed, health: config.enemyHealth, maxHealth: config.enemyHealth,
            weapon: WeaponType.FISTS, damage: 10, attackCooldown: 0, maxAttackCooldown: 60, facing: 'right',
            visualUrl: `${ENEMY_IMG_BASE}&seed=${levelNum}_${i}`
        });
    }
    if (config.boss) {
        enemies.push({
            id: 'boss', type: EntityType.ENEMY_BOSS, pos: { x: CANVAS_WIDTH/2, y: 100 },
            size: BOSS_SIZE, speed: config.enemySpeed * 0.7, health: config.enemyHealth * 4, maxHealth: config.enemyHealth * 4,
            weapon: WeaponType.HAMMER, damage: 25, attackCooldown: 0, maxAttackCooldown: 90, facing: 'left', visualUrl: BOSS_IMG
        });
    }
    const items: Item[] = [];
    if (levelNum > 1) {
        items.push({ id: 999, type: 'WEAPON', subtype: [WeaponType.SWORD, WeaponType.HAMMER, WeaponType.DUAL_BLADES][Math.floor(Math.random()*3)], pos: { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2 }, size: ITEM_SIZE });
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
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-[#0f110c] relative font-sans overflow-hidden">
      
      {/* HUD */}
      <div className="w-[800px] flex justify-between items-end mb-2 p-3 bg-gradient-to-t from-[#242b1a] to-[#3a4429] rounded-t-lg border-x-4 border-t-4 border-[#5a6a4a] shadow-2xl z-20">
        <div className="flex gap-4">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 text-green-300 mb-1">
                    <Heart size={18} fill="currentColor" />
                    <span className="font-mono text-xl font-bold">HP: {Math.round(gameState.player.health)}</span>
                </div>
                <div className="w-48 h-3 bg-black/40 rounded-sm border border-[#5a6a4a] overflow-hidden">
                    <div className="h-full bg-green-500 shadow-[0_0_10px_green]" style={{ width: `${(gameState.player.health/gameState.player.maxHealth)*100}%` }}></div>
                </div>
            </div>
            
            <button 
                onClick={() => inputRef.current.upgrade = true}
                className={`flex items-center gap-2 px-3 py-1 rounded border-2 transition-all ${gameState.currency >= UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1) ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
            >
                <ArrowUpCircle size={18} />
                <span className="text-xs font-bold">UPGRADE [U] ({UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1)})</span>
            </button>
        </div>

        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-4 text-wheat-200 font-mono">
                <div className="text-right">
                    <span className="block text-[10px] opacity-60">SHARDS</span>
                    <span className="text-xl font-bold flex items-center gap-1"><ShoppingBag size={14}/> {gameState.currency}</span>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] opacity-60">SCORE</span>
                    <span className="text-xl font-bold text-green-400">{gameState.score}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="relative z-10">
        <GameCanvas 
            player={gameState.player} enemies={gameState.enemies} items={gameState.items} particles={gameState.particles}
            width={CANVAS_WIDTH} height={CANVAS_HEIGHT} shakeIntensity={gameState.shakeIntensity} isCelebrating={isCelebrating}
        />
        
        {/* Overlays */}
        {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center z-50">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-wheat-200 to-green-400 mb-4 italic">代号：麦芒行动</h1>
                <p className="text-wheat-100/80 mb-8 max-w-md italic border-l-4 border-green-600 pl-4">{gameState.loreText}</p>
                <div className="flex flex-col gap-2 mb-8">
                    <div className="text-xs text-green-400 font-bold uppercase tracking-widest">操作手册</div>
                    <div className="text-sm text-gray-400">[WASD] 移动 | [SPACE] 信号枪射击 | [U] 属性强化</div>
                </div>
                <button onClick={startGame} className="px-12 py-4 bg-green-700 hover:bg-green-600 text-white rounded font-bold text-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2">
                    <Play size={24} /> 部署作战
                </button>
            </div>
        )}

        {(gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.VICTORY) && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 text-center z-50">
                {gameState.status === GameStatus.VICTORY ? <Shield size={80} className="text-green-400 mb-4"/> : <Skull size={80} className="text-red-600 mb-4"/>}
                <h2 className="text-6xl font-black text-white mb-6 tracking-tighter">{gameState.status === GameStatus.VICTORY ? '作战大捷' : '通讯中断'}</h2>
                <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-10 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
                    <RotateCcw size={20} /> 重新部署
                </button>
            </div>
        )}
      </div>
      
       <div className="mt-4 flex justify-between w-[800px] text-green-900 font-bold text-[10px] tracking-widest uppercase">
        <span>Tactical Deployment v4.2</span>
        <span className="flex items-center gap-2"><Volume2 size={12} /> Biosignal: Online</span>
      </div>
    </div>
  );
}