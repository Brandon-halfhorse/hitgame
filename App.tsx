import React, { useState, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState, GameStatus, Entity, EntityType, FloatingText } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, ATTACK_RANGE, LEVEL_CONFIG, PLAYER_IMG, ENEMY_IMG_BASE, ATTACK_COOLDOWN, ENEMY_SIZE, BOSS_SIZE, BOSS_IMG } from './constants';
import { generateLevelLore, generateVictoryMessage } from './services/geminiService';
import { audioManager } from './services/audioService';
import { Play, RotateCcw, Shield, Heart, Skull, Zap, Volume2 } from 'lucide-react';

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
      damage: 25,
      facing: 'right',
      visualUrl: PLAYER_IMG
    },
    enemies: [],
    particles: [],
    level: 1,
    score: 0,
    status: GameStatus.IDLE,
    gameBounds: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    loreText: "准备好加入紫岚战队了吗？按开始键进入。",
    shakeIntensity: 0
  });

  // Refs for loop performance
  const stateRef = useRef<GameState>(gameState);
  const inputRef = useRef({ up: false, down: false, left: false, right: false, attack: false });
  const loopRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);

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
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': inputRef.current.up = false; break;
        case 's': case 'arrowdown': inputRef.current.down = false; break;
        case 'a': case 'arrowleft': inputRef.current.left = false; break;
        case 'd': case 'arrowright': inputRef.current.right = false; break;
        case ' ': case 'j': inputRef.current.attack = false; break;
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
        life: 30, // 0.5 seconds at 60fps
        velocity: { x: (Math.random() - 0.5) * 2, y: -2 }
    });
  };

  // --- Game Loop Logic ---
  const updateGame = () => {
    const currentState = stateRef.current;
    if (currentState.status !== GameStatus.PLAYING) return;

    const input = inputRef.current;
    let newPlayer = { ...currentState.player };
    let newEnemies = currentState.enemies.map(e => ({...e}));
    let newParticles = currentState.particles.map(p => ({...p, x: p.x + p.velocity.x, y: p.y + p.velocity.y, life: p.life - 1})).filter(p => p.life > 0);
    let newStatus: GameStatus = currentState.status;
    let newScore = currentState.score;
    let newShake = Math.max(0, currentState.shakeIntensity - 2); // Decay shake

    // Handle Player Hit Flash Decay
    if (newPlayer.hitFlashTimer && newPlayer.hitFlashTimer > 0) newPlayer.hitFlashTimer--;
    newEnemies.forEach(e => { if (e.hitFlashTimer && e.hitFlashTimer > 0) e.hitFlashTimer--; });

    // 1. Player Movement
    let dx = 0; 
    let dy = 0;
    if (input.up) dy -= newPlayer.speed;
    if (input.down) dy += newPlayer.speed;
    if (input.left) { dx -= newPlayer.speed; newPlayer.facing = 'left'; }
    if (input.right) { dx += newPlayer.speed; newPlayer.facing = 'right'; }

    // Boundary check
    newPlayer.pos = {
        x: Math.min(Math.max(newPlayer.pos.x + dx, 0), CANVAS_WIDTH - newPlayer.size),
        y: Math.min(Math.max(newPlayer.pos.y + dy, 0), CANVAS_HEIGHT - newPlayer.size)
    };

    // 2. Player Attack Logic
    if (newPlayer.attackCooldown && newPlayer.attackCooldown > 0) {
        newPlayer.attackCooldown--;
        if (newPlayer.attackCooldown < 5) newPlayer.isAttacking = false; 
    }

    if (input.attack && (!newPlayer.attackCooldown || newPlayer.attackCooldown === 0)) {
        newPlayer.isAttacking = true;
        newPlayer.attackCooldown = ATTACK_COOLDOWN;
        audioManager.playSfx('attack'); // Attack Sound
        
        // Hit detection
        const attackCenter = {
            x: newPlayer.pos.x + (newPlayer.size / 2) + (newPlayer.facing === 'right' ? 40 : -40),
            y: newPlayer.pos.y + (newPlayer.size / 2)
        };

        let hitCount = 0;
        newEnemies.forEach(enemy => {
            const enemyCenter = { x: enemy.pos.x + enemy.size/2, y: enemy.pos.y + enemy.size/2 };
            const dist = Math.hypot(attackCenter.x - enemyCenter.x, attackCenter.y - enemyCenter.y);
            
            if (dist < ATTACK_RANGE) {
                // Apply Damage
                const dmg = newPlayer.damage + Math.floor(Math.random() * 10);
                enemy.health -= dmg;
                enemy.hitFlashTimer = 10;
                hitCount++;

                // Visuals
                spawnFloatingText(enemy.pos.x + enemy.size/2, enemy.pos.y, `-${dmg}`, '#ef4444', newParticles);
                audioManager.playSfx('hit'); // Hit Sound
                
                // Knockback
                const knockbackDir = newPlayer.facing === 'right' ? 1 : -1;
                enemy.pos.x += knockbackDir * 30; 
            }
        });

        if (hitCount > 0) {
            newShake = 10 + (hitCount * 2); // Screen shake on hit
        }
    }

    // 3. Enemy AI & Cleanup
    const aliveEnemies: Entity[] = [];
    newEnemies.forEach(enemy => {
        if (enemy.health > 0) {
            aliveEnemies.push(enemy);
        } else {
            // Enemy Died
            newScore += 100;
            spawnFloatingText(enemy.pos.x, enemy.pos.y, "击杀!", '#fbbf24', newParticles);
        }
    });
    newEnemies = aliveEnemies;

    newEnemies.forEach(enemy => {
        // Simple AI: Move directly towards player
        const centerX = newPlayer.pos.x + newPlayer.size/2 - enemy.size/2;
        const centerY = newPlayer.pos.y + newPlayer.size/2 - enemy.size/2;
        
        const angle = Math.atan2(centerY - enemy.pos.y, centerX - enemy.pos.x);
        
        // Wiggle movement for "swarming" feel
        const wiggle = Math.sin(frameCountRef.current * 0.1 + parseInt(enemy.id.split('_')[2] || '0')) * 0.5;
        
        enemy.pos.x += (Math.cos(angle) * enemy.speed) + wiggle;
        enemy.pos.y += (Math.sin(angle) * enemy.speed) + wiggle;
        enemy.facing = Math.cos(angle) > 0 ? 'right' : 'left';

        // Collision with Player (Damage)
        const distToPlayer = Math.hypot(
            (newPlayer.pos.x + newPlayer.size/2) - (enemy.pos.x + enemy.size/2),
            (newPlayer.pos.y + newPlayer.size/2) - (enemy.pos.y + enemy.size/2)
        );

        if (distToPlayer < (newPlayer.size/2 + enemy.size/3)) {
            if (frameCountRef.current % 30 === 0) { // Damage tick
                const enemyDmg = 5 + currentState.level * 2; // Damage scales with level
                newPlayer.health -= enemyDmg;
                newPlayer.hitFlashTimer = 10;
                newShake = 15; // Hard shake when player hit
                spawnFloatingText(newPlayer.pos.x + newPlayer.size/2, newPlayer.pos.y, `-${enemyDmg}`, '#ffffff', newParticles);
                audioManager.playSfx('damage'); // Player Hurt Sound
            }
        }
    });

    // 4. Game Over / Level Clear Check
    if (newPlayer.health <= 0) {
        newPlayer.health = 0;
        newStatus = GameStatus.GAME_OVER;
        audioManager.stopBgm();
        audioManager.playSfx('gameover');
    } else if (newEnemies.length === 0) {
        // Level cleared
        if (currentState.level >= 5) {
            newStatus = GameStatus.VICTORY;
            audioManager.stopBgm();
            audioManager.playSfx('victory');
        } else {
            newStatus = GameStatus.LEVEL_TRANSITION;
        }
    }

    // Update refs and state
    frameCountRef.current++;
    setGameState(prev => ({
        ...prev,
        player: newPlayer,
        enemies: newEnemies,
        particles: newParticles,
        status: newStatus,
        score: newScore,
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
  }, [gameState.status]);


  // --- Game Flow Control ---

  const startGame = async () => {
    // Init Audio Context on user gesture
    audioManager.init();
    audioManager.playBgm(1);

    // Reset player
    const freshPlayer = {
        ...stateRef.current.player,
        health: 100,
        pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    };
    
    // Load Level 1
    const lore = await generateLevelLore(1, false);
    startLevel(1, freshPlayer, 0, lore);
  };

  const startLevel = (levelNum: number, playerState: Entity, score: number, lore: string) => {
    // Update BGM Intensity
    audioManager.playBgm(levelNum);

    const config = LEVEL_CONFIG[levelNum as keyof typeof LEVEL_CONFIG];
    
    // Spawn Enemies
    const spawnedEnemies: Entity[] = [];
    for(let i=0; i<config.enemyCount; i++) {
        // Random edge spawn
        const isSide = Math.random() > 0.5;
        const x = isSide ? (Math.random() > 0.5 ? 0 : CANVAS_WIDTH - ENEMY_SIZE) : Math.random() * CANVAS_WIDTH;
        const y = isSide ? Math.random() * CANVAS_HEIGHT : (Math.random() > 0.5 ? 0 : CANVAS_HEIGHT - ENEMY_SIZE);
        
        spawnedEnemies.push({
            id: `enemy_${levelNum}_${i}`,
            type: EntityType.ENEMY_MELEE,
            pos: { x, y },
            size: ENEMY_SIZE,
            speed: config.enemySpeed + (Math.random() * 0.5),
            health: config.enemyHealth,
            maxHealth: config.enemyHealth,
            damage: 10,
            facing: x < CANVAS_WIDTH/2 ? 'right' : 'left',
            // Fix: Use '&' because base url already has '?'
            visualUrl: `${ENEMY_IMG_BASE}&random=${i}${levelNum}`
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
            damage: 25,
            facing: 'left',
            visualUrl: BOSS_IMG
        });
    }

    setGameState({
        player: playerState,
        enemies: spawnedEnemies,
        particles: [],
        level: levelNum,
        score: score,
        status: GameStatus.PLAYING,
        gameBounds: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
        loreText: lore,
        shakeIntensity: 0
    });
  };

  const nextLevel = async () => {
    const nextLvl = gameState.level + 1;
    setGameState(prev => ({ ...prev, status: GameStatus.IDLE })); 
    
    let lore = "";
    if (nextLvl <= 5) {
        lore = await generateLevelLore(nextLvl, LEVEL_CONFIG[nextLvl as keyof typeof LEVEL_CONFIG].boss);
        startLevel(nextLvl, gameState.player, gameState.score, lore);
    }
  };
  
  const finishGame = async () => {
      const victoryMsg = await generateVictoryMessage();
      setGameState(prev => ({...prev, loreText: victoryMsg}));
  }

  // Effect to trigger next level logic
  useEffect(() => {
    if (gameState.status === GameStatus.LEVEL_TRANSITION) {
        nextLevel();
    }
    if (gameState.status === GameStatus.VICTORY) {
        finishGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.status]);

  // --- Render ---

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center text-white bg-slate-900 scanlines relative font-sans">
      
      {/* Header / HUD */}
      <div className="w-[800px] flex justify-between items-center mb-4 p-4 bg-slate-800 rounded-lg border-2 border-slate-600 shadow-lg z-20">
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase tracking-widest">操作员</span>
                <span className="text-xl font-bold text-blue-400">HERO-01</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-600 mx-2"></div>
            <div className="flex flex-col">
                 <div className="flex items-center gap-2 text-red-400">
                    <Heart size={20} fill="currentColor" />
                    <span className="font-mono text-2xl font-bold">{Math.max(0, Math.round(gameState.player.health))}</span>
                 </div>
                 <div className="w-48 h-3 bg-slate-900 rounded-full mt-1 border border-slate-700 relative overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                        style={{ width: `${Math.max(0, gameState.player.health)}%` }}
                    ></div>
                 </div>
            </div>
        </div>

        <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400">当前任务</span>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <span className="block text-xs text-slate-500">关卡</span>
                    <span className="font-mono text-2xl font-bold text-yellow-500">0{gameState.level}</span>
                </div>
                <div className="text-right">
                    <span className="block text-xs text-slate-500">分数</span>
                    <span className="font-mono text-2xl font-bold text-green-500">{gameState.score.toString().padStart(6, '0')}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10">
        <GameCanvas 
            player={gameState.player} 
            enemies={gameState.enemies} 
            particles={gameState.particles}
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            shakeIntensity={gameState.shakeIntensity}
        />

        {/* Overlays */}
        {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm z-30">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-300 mb-6 tracking-tight drop-shadow-lg">
                    现实回响：五重试炼
                </h1>
                <p className="text-gray-200 max-w-lg mb-10 text-xl leading-relaxed border-l-4 border-blue-500 pl-4 text-left bg-white/5 p-4 rounded-r">
                    {gameState.loreText}
                </p>
                <div className="flex gap-6 text-base text-gray-300 mb-10">
                    <div className="flex flex-col items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <span className="font-bold text-blue-400 mb-1">WASD / 方向键</span>
                        <span>移动</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <span className="font-bold text-red-400 mb-1">空格 Space</span>
                        <span>攻击</span>
                    </div>
                </div>
                <button 
                    onClick={startGame}
                    className="group relative px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.6)] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="flex items-center gap-3 relative z-10"><Play size={24} fill="currentColor" /> 开始链接</span>
                </button>
            </div>
        )}

        {gameState.status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md z-30">
                <Skull size={80} className="text-red-500 mb-6 animate-pulse" />
                <h2 className="text-7xl font-black text-white mb-4 tracking-widest uppercase drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">任务失败</h2>
                <p className="text-red-200 text-2xl mb-8">同步率在第 {gameState.level} 层中断</p>
                <button 
                    onClick={() => setGameState(prev => ({...prev, status: GameStatus.IDLE, loreText: "系统正在重启..."}))}
                    className="flex items-center gap-2 px-8 py-3 bg-white text-red-900 hover:bg-gray-200 rounded font-bold transition-colors text-xl"
                >
                    <RotateCcw size={24} /> 重启系统
                </button>
            </div>
        )}

        {gameState.status === GameStatus.VICTORY && (
            <div className="absolute inset-0 bg-yellow-900/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md z-30">
                <div className="relative mb-6">
                    <Shield size={80} className="text-yellow-400 relative z-10" />
                    <Zap size={40} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" fill="currentColor"/>
                </div>
                <h2 className="text-6xl font-black text-white mb-4 tracking-widest drop-shadow-lg">任务完成</h2>
                <p className="text-yellow-100 text-xl max-w-lg mb-8 italic">"{gameState.loreText}"</p>
                <div className="text-5xl font-mono text-yellow-300 mb-10 drop-shadow-md">最终得分: {gameState.score}</div>
                <button 
                    onClick={() => setGameState(prev => ({...prev, status: GameStatus.IDLE, loreText: "欢迎回来，英雄。"}))}
                    className="flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded font-bold transition-colors text-xl"
                >
                    <RotateCcw size={24} /> 再次挑战
                </button>
            </div>
        )}
        
        {/* Loading / Transition */}
        {gameState.status === GameStatus.LEVEL_TRANSITION && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center z-30">
                <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-3xl font-mono text-blue-400 animate-pulse">正在生成第 {gameState.level + 1} 层数据...</h3>
            </div>
        )}
      </div>

      {/* Controls Hint Footer */}
      <div className="mt-6 flex justify-between w-[800px] text-slate-500 text-xs font-mono tracking-widest">
        <span>SYSTEM VER: 5.0.2 // LATENCY: 0ms</span>
        <span className="flex items-center gap-2"><Volume2 size={12} /> AUDIO SYNTHESIZER: ONLINE</span>
      </div>

    </div>
  );
}