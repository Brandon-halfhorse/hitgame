
import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState, GameStatus, Entity, EntityType, FloatingText, WeaponType, Item } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG, WEAPON_STATS, ITEM_SIZE, SKILL_COOLDOWN_AMBUSH, HEAL_COST, HEAL_AMOUNT, UPGRADE_COST_BASE } from './constants';
import { generateLevelLore, generateVictoryMessage } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Skull, Volume2, ShoppingBag, ArrowUpCircle } from 'lucide-react';

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
      damage: 35,
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
    loreText: "紫岚战队，全员待命。麦野前线情况危急，立即切入战区。",
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
    const item: Item = { id: itemIdCounter.current, type, subtype, amount: type === 'CURRENCY' ? 25 : 0, pos: { x, y }, size: ITEM_SIZE };
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
        newPlayer.maxHealth += 30;
        newPlayer.health = newPlayer.maxHealth;
        newPlayer.damage += 15;
        newPlayer.speed += 0.2;
        spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, "POWER UP!", "#a855f7", newParticles);
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

    // Attack
    if (input.attack && newPlayer.attackCooldown <= 0) {
        newPlayer.isAttacking = true;
        newPlayer.attackCooldown = newPlayer.maxAttackCooldown;
        audioManager.playSfx('attack');
        const range = WEAPON_STATS[newPlayer.weapon].range;
        
        newEnemies.forEach(enemy => {
            const dist = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2), (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2));
            if (dist < range + 40) {
                const finalDmg = newPlayer.damage + Math.floor(Math.random() * 10);
                enemy.health -= finalDmg;
                enemy.hitFlashTimer = 10;
                spawnFloatingText(enemy.pos.x, enemy.pos.y, `-${finalDmg}`, "#f87171", newParticles);
                audioManager.playSfx('hit');
                newShake = 15;
            }
        });
    }

    // Item Pickup
    newItems = newItems.filter(item => {
        const d = Math.hypot((newPlayer.pos.x + newPlayer.size/2) - (item.pos.x + item.size/2), (newPlayer.pos.y + newPlayer.size/2) - (item.pos.y + item.size/2));
        if (d < 45) {
            if (item.type === 'WEAPON' && item.subtype) {
                newPlayer.weapon = item.subtype;
                const s = WEAPON_STATS[item.subtype];
                newPlayer.damage = s.damage + (newPlayer.upgradeLevel || 1) * 10;
                newPlayer.maxAttackCooldown = s.cooldown;
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `GET ${item.subtype}`, s.color, newParticles);
            } else {
                newCurrency += item.amount || 25;
            }
            audioManager.playSfx('loot');
            return false;
        }
        return true;
    });

    // --- Enemy Logic ---
    const aliveEnemies: Entity[] = [];
    newEnemies.forEach(enemy => {
        if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
        if (enemy.health > 0) {
            aliveEnemies.push(enemy);
            const edx = (newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2);
            const edy = (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2);
            const dist = Math.hypot(edx, edy);
            
            enemy.isMoving = dist > 45;
            if (dist > 40) {
                enemy.pos.x += (edx / dist) * enemy.speed;
                enemy.pos.y += (edy / dist) * enemy.speed;
                enemy.facing = edx > 0 ? 'right' : 'left';
            }

            if (dist < 70 && frameCountRef.current % 45 === 0) {
                newPlayer.health -= enemy.damage;
                newPlayer.hitFlashTimer = 10;
                audioManager.playSfx('damage');
                spawnFloatingText(newPlayer.pos.x, newPlayer.pos.y, `HIT -${enemy.damage}`, "#ffffff", newParticles);
                newShake = 12;
            }
        } else {
            newScore += 200;
            newCurrency += 30;
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
            id: `e_${levelNum}_${i}`, type: EntityType.ENEMY_MELEE,
            pos: { x: Math.random() * CANVAS_WIDTH, y: Math.random() > 0.5 ? -180 : CANVAS_HEIGHT + 180 },
            size: ENEMY_SIZE, speed: config.enemySpeed, health: config.enemyHealth, maxHealth: config.enemyHealth,
            weapon: WeaponType.FISTS, damage: 12 + levelNum, attackCooldown: 0, maxAttackCooldown: 60, facing: 'right',
            visualUrl: `${ENEMY_IMG_BASE}&seed=zilan_${levelNum}_${i}`
        });
    }
    if (config.boss) {
        enemies.push({
            id: 'boss', type: EntityType.ENEMY_BOSS, pos: { x: CANVAS_WIDTH/2 - BOSS_SIZE/2, y: 50 },
            size: BOSS_SIZE, speed: config.enemySpeed * 0.7, health: config.enemyHealth * 5, maxHealth: config.enemyHealth * 5,
            weapon: WeaponType.HAMMER, damage: 35, attackCooldown: 0, maxAttackCooldown: 90, facing: 'left', visualUrl: BOSS_IMG
        });
    }
    const items: Item[] = [];
    if (levelNum > 1) {
        items.push({ id: Date.now(), type: 'WEAPON', subtype: [WeaponType.SWORD, WeaponType.HAMMER, WeaponType.DUAL_BLADES][Math.floor(Math.random()*3)], pos: { x: CANVAS_WIDTH/2 - 20, y: CANVAS_HEIGHT/2 - 20 }, size: ITEM_SIZE });
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
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-[#1a1c14] relative font-sans overflow-hidden">
      
      {/* HUD */}
      <div className="w-[800px] flex justify-between items-end mb-2 p-4 bg-gradient-to-t from-[#2a301a] to-[#4a5429] rounded-t-xl border-x-4 border-t-4 border-[#6a7a4a] shadow-2xl z-20">
        <div className="flex gap-6">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 text-green-300 mb-1">
                    <Heart size={20} fill="currentColor" />
                    <span className="font-mono text-2xl font-black">HP: {Math.round(gameState.player.health)}</span>
                </div>
                <div className="w-56 h-4 bg-black/50 rounded-full border border-[#6a7a4a] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_15px_green]" style={{ width: `${(gameState.player.health/gameState.player.maxHealth)*100}%` }}></div>
                </div>
            </div>
            
            <button 
                onClick={() => inputRef.current.upgrade = true}
                className={`flex items-center gap-3 px-4 py-1 rounded-lg border-2 transition-all hover:scale-105 active:scale-95 ${gameState.currency >= UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1) ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_#a855f7]' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
            >
                <ArrowUpCircle size={22} />
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] opacity-70">UPGRADE [U]</span>
                    <span className="text-sm font-black">COST: {UPGRADE_COST_BASE * (gameState.player.upgradeLevel || 1)}</span>
                </div>
            </button>
        </div>

        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-6 text-wheat-200 font-mono">
                <div className="text-right">
                    <span className="block text-[11px] font-bold text-purple-400">PURPLE SHARDS</span>
                    <span className="text-2xl font-black flex items-center justify-end gap-2"><ShoppingBag size={18}/> {gameState.currency}</span>
                </div>
                <div className="text-right">
                    <span className="block text-[11px] font-bold text-green-500">SCORE</span>
                    <span className="text-2xl font-black">{gameState.score.toLocaleString()}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="relative z-10 shadow-[0_0_100px_rgba(0,0,0,1)]">
        <GameCanvas 
            player={gameState.player} enemies={gameState.enemies} items={gameState.items} particles={gameState.particles}
            width={CANVAS_WIDTH} height={CANVAS_HEIGHT} shakeIntensity={gameState.shakeIntensity} isCelebrating={isCelebrating}
        />
        
        {/* Overlays */}
        {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-md">
                <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-green-400 mb-6 italic tracking-tighter drop-shadow-2xl">
                    紫岚战队：麦野风云
                </h1>
                <p className="text-wheat-100/90 text-xl mb-10 max-w-xl italic border-l-8 border-purple-700 pl-6 py-2 bg-white/5 rounded-r-lg shadow-inner leading-relaxed">
                    {gameState.loreText}
                </p>
                <div className="grid grid-cols-2 gap-6 mb-12 max-w-lg">
                    <div className="bg-gray-900/80 p-4 rounded-xl border border-purple-500/30 flex flex-col">
                        <span className="text-purple-400 font-black uppercase text-xs mb-2">行动指令</span>
                        <span className="text-sm">[WASD] 全向机动 | [SPACE] 战术开火</span>
                    </div>
                    <div className="bg-gray-900/80 p-4 rounded-xl border border-green-500/30 flex flex-col">
                        <span className="text-green-400 font-black uppercase text-xs mb-2">物资补给</span>
                        <span className="text-sm">[U] 属性进化 | [B] 战地医疗</span>
                    </div>
                </div>
                <button onClick={startGame} className="group relative px-16 py-5 bg-gradient-to-r from-purple-700 to-green-700 text-white rounded-full font-black text-2xl shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_60px_rgba(168,85,247,0.8)] flex items-center gap-3">
                    <Play size={32} className="fill-current" /> 立即突入
                </button>
            </div>
        )}

        {(gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.VICTORY) && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 backdrop-blur-xl ${gameState.status === GameStatus.VICTORY ? 'bg-purple-900/90' : 'bg-red-950/90'}`}>
                {gameState.status === GameStatus.VICTORY ? <Shield size={100} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_gold]"/> : <Skull size={100} className="text-white mb-6 drop-shadow-[0_0_30px_red]"/>}
                <h2 className="text-7xl font-black text-white mb-10 tracking-tight uppercase italic underline decoration-8 decoration-purple-500 underline-offset-8">
                    {gameState.status === GameStatus.VICTORY ? '作战大捷' : '通讯中断'}
                </h2>
                <button onClick={() => window.location.reload()} className="flex items-center gap-3 px-14 py-5 bg-white text-black rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl">
                    <RotateCcw size={28} /> 再次集结
                </button>
            </div>
        )}
      </div>
      
       <div className="mt-6 flex justify-between w-[800px] text-purple-500 font-black text-xs tracking-[0.3em] uppercase opacity-60">
        <span>ZILAN SQUAD TACTICAL OS v5.0</span>
        <span className="flex items-center gap-3"><Volume2 size={16} /> COMMS: ENCRYPTED</span>
      </div>
    </div>
  );
}
