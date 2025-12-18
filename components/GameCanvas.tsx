
import React, { useMemo } from 'react';
import { Entity, EntityType, FloatingText, Item, WeaponType } from '../types';
import { WEAPON_STATS, ITEM_SIZE, COLOR_NEON_PURPLE, COLOR_NEON_GREEN, COLOR_NEON_CYAN } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Hammer, Scissors, Crosshair, Zap, Building2, Store, Car, Radio, Cpu } from 'lucide-react';

interface GameCanvasProps {
  player: Entity;
  enemies: Entity[];
  items: Item[];
  particles: FloatingText[];
  width: number;
  height: number;
  shakeIntensity: number;
  isCelebrating?: boolean;
}

const WeaponVisual: React.FC<{ type: WeaponType; isAttacking?: boolean }> = ({ type, isAttacking }) => {
    const color = type === WeaponType.SWORD ? COLOR_NEON_GREEN : 
                  type === WeaponType.DUAL_BLADES ? COLOR_NEON_CYAN : 
                  type === WeaponType.HAMMER ? '#ff9f0a' : COLOR_NEON_PURPLE;

    return (
        <motion.div
            animate={isAttacking ? { 
                y: [-5, -70, -5], 
                scale: [1, 1.9, 1], 
                rotate: [0, -70, 110, 0],
                filter: [`drop-shadow(0 0 15px ${color}) brightness(2)`, `drop-shadow(0 0 35px ${color}) brightness(3)`, `drop-shadow(0 0 15px ${color}) brightness(2)`]
            } : { 
                y: [0, -3, 0],
                filter: `drop-shadow(0 0 8px ${color})` 
            }}
            transition={{ duration: isAttacking ? 0.22 : 2, repeat: isAttacking ? 0 : Infinity }}
            className="relative"
        >
            {type === WeaponType.HAMMER && <Hammer size={52} style={{ color }} />}
            {type === WeaponType.DUAL_BLADES && <Scissors size={46} className="rotate-90" style={{ color }} />}
            {type === WeaponType.SWORD && <Sword size={48} style={{ color }} />}
            {type === WeaponType.FISTS && <Crosshair size={40} style={{ color }} />}
            
            {/* Energy Core Effect */}
            <motion.div 
                className="absolute inset-0 blur-xl opacity-50"
                style={{ backgroundColor: color }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
            />
        </motion.div>
    );
}

const AnimatedCharacter: React.FC<{ entity: Entity; isCelebrating?: boolean }> = ({ entity, isCelebrating }) => {
    const isMoving = entity.isMoving && !isCelebrating;
    const isPlayer = entity.type === EntityType.PLAYER;

    const walkDuration = 0.38;

    return (
        <motion.div 
            className="relative w-full h-full origin-bottom"
            animate={isMoving ? { 
                scaleY: [1, 0.92, 1.05, 1],
                rotate: entity.facing === 'right' ? [0, 3, 0] : [0, -3, 0],
            } : { 
                scaleY: [1, 0.97, 1] 
            }}
            transition={{ repeat: Infinity, duration: walkDuration * 2 }}
        >
            {/* Body parts clipping & animation */}
            <motion.div 
                className="absolute inset-0 z-30" 
                style={{ clipPath: 'inset(0 0 78% 0)' }}
                animate={isMoving ? { y: [0, -4, 0] } : { y: [0, -1, 0] }}
                transition={{ repeat: Infinity, duration: walkDuration }}
            >
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>

            <motion.div 
                className="absolute inset-0 z-20"
                style={{ 
                    clipPath: 'inset(22% 0 42% 0)',
                    filter: entity.hitFlashTimer && entity.hitFlashTimer > 0 ? `drop-shadow(0 0 20px ${COLOR_NEON_PURPLE}) brightness(5)` : 'none'
                }}
                animate={isMoving ? { y: [0, -6, 0] } : { y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: walkDuration }}
            >
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>

            {/* Legs */}
            <motion.div className="absolute inset-0 z-10 origin-[50%_60%]" style={{ clipPath: 'inset(58% 50% 0 0)' }} animate={isMoving ? { rotate: [40, -40, 40], x: [0, 10, 0], y: [0, -5, 0] } : {}} transition={{ repeat: Infinity, duration: walkDuration, ease: "linear" }}>
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>
            <motion.div className="absolute inset-0 z-10 origin-[50%_60%]" style={{ clipPath: 'inset(58% 0 0 50%)' }} animate={isMoving ? { rotate: [-40, 40, -40], x: [0, -10, 0], y: [0, -5, 0] } : {}} transition={{ repeat: Infinity, duration: walkDuration, ease: "linear", delay: walkDuration/2 }}>
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>

            {/* Weapon */}
            <div className={`absolute bottom-[58%] ${entity.facing === 'right' ? '-right-10' : '-left-10'} z-40`}>
                <div style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }}>
                    <WeaponVisual type={entity.weapon} isAttacking={entity.isAttacking} />
                </div>
            </div>
        </motion.div>
    );
};

const EntityRenderer: React.FC<{ entity: Entity; isCelebrating?: boolean }> = ({ entity, isCelebrating }) => {
  const isPlayer = entity.type === EntityType.PLAYER;
  
  return (
    <div
      className="absolute flex flex-col items-center justify-end pointer-events-none"
      style={{
        width: entity.size,
        height: entity.size,
        left: 0,
        top: 0,
        transform: `translate(${entity.pos.x}px, ${entity.pos.y}px)`,
        zIndex: Math.floor(entity.pos.y + entity.size),
      }}
    >
        <div className="absolute bottom-0 w-[90%] h-[20%] bg-purple-900/20 blur-2xl rounded-full" />
        <AnimatedCharacter entity={entity} isCelebrating={isCelebrating} />
        
        <div className="absolute -top-16 w-full flex flex-col items-center gap-1 z-50">
            {isPlayer && (
                <div className="bg-black/60 text-cyan-400 text-[10px] font-black px-2 py-0.5 rounded border border-cyan-400/50 shadow-[0_0_10px_cyan] italic uppercase tracking-tighter">
                    LNK: STABLE.{entity.upgradeLevel}
                </div>
            )}
            <div className="w-24 h-2 bg-black/90 rounded-full border border-gray-800 overflow-hidden p-[1px]">
                <div 
                    className={`h-full transition-all duration-300 rounded-full ${isPlayer ? 'bg-gradient-to-r from-purple-600 via-cyan-400 to-white shadow-[0_0_10px_#a855f7]' : 'bg-gradient-to-r from-red-600 to-orange-400 shadow-[0_0_10px_red]'}`} 
                    style={{ width: `${(entity.health / entity.maxHealth) * 100}%` }}
                />
            </div>
        </div>
    </div>
  );
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, enemies, items, particles, width, height, shakeIntensity, isCelebrating }) => {
  
  const streetElements = useMemo(() => {
    const items = [];
    // 3D Perspective Grid
    for (let i = -20; i < 40; i++) {
        items.push(
            <div key={`v-line-${i}`} className="absolute h-[200%] w-[1px] bg-purple-500/10" 
                 style={{ left: `${(i/20)*100}%`, top: '-50%', transform: 'perspective(1000px) rotateX(85deg)', transformOrigin: 'top' }} />
        );
    }
    // Neon Floaters
    for (let i = 0; i < 20; i++) {
        items.push(
            <motion.div 
                key={`float-${i}`} 
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                animate={{ y: [height, -100], x: [Math.random()*width, Math.random()*width], opacity: [0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 3 + Math.random()*4, delay: Math.random()*5 }}
                style={{ left: Math.random()*width, top: height }}
            />
        );
    }
    const icons = [Building2, Store, Car, Radio, Cpu];
    for (let i = 0; i < 12; i++) {
        const Icon = icons[i % icons.length];
        const side = i % 2 === 0 ? 'left' : 'right';
        const color = i % 2 === 0 ? 'text-purple-500' : 'text-cyan-500';
        items.push(
            <div key={`deco-${i}`} className={`absolute ${side}-[-40px] opacity-10 ${color}`}
                 style={{ top: `${(i/12)*100}%`, transform: `scale(${1.5 + Math.random()*2}) perspective(800px) rotateY(${side === 'left' ? '45deg' : '-45deg'})` }}>
                <Icon size={128} />
            </div>
        );
    }
    return items;
  }, [width, height]);

  return (
    <div 
        className="relative overflow-hidden shadow-[0_0_150px_rgba(168,85,247,0.3)] rounded-3xl border-[24px] border-[#08080c] bg-[#010102] scanlines"
        style={{ 
            width, height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        <div className="absolute inset-0 z-0">
            <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-[#050510] via-transparent to-[#010103]" />
            {streetElements}
            {/* Perspective Fog */}
            <div className="absolute top-0 w-full h-[40%] bg-gradient-to-b from-black to-transparent" />
        </div>

        {/* Loot */}
        {items.map(item => (
            <motion.div key={item.id} className="absolute" style={{ left: item.pos.x, top: item.pos.y, zIndex: Math.floor(item.pos.y) }}>
                <motion.div animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    {item.type === 'WEAPON' && <WeaponVisual type={item.subtype || WeaponType.SWORD} />}
                    {item.type === 'CURRENCY' && <div className="w-12 h-12 bg-black border-2 border-cyan-400 rounded-lg shadow-[0_0_20px_cyan] flex items-center justify-center font-black text-cyan-400 text-lg">P</div>}
                </motion.div>
                <div className="w-12 h-4 bg-cyan-900/20 blur-xl rounded-full mt-4 mx-auto" />
            </motion.div>
        ))}

        {/* Entities */}
        {[...enemies, player]
            .sort((a, b) => a.pos.y - b.pos.y)
            .map(entity => <EntityRenderer key={entity.id} entity={entity} isCelebrating={isCelebrating} />)
        }

        {/* Combat VFX / Blood / Particles */}
        <AnimatePresence>
            {particles.map(p => (
                <motion.div 
                    key={p.id}
                    initial={{ scale: 0, opacity: 1, rotate: Math.random()*360 }}
                    animate={{ scale: [1, 1.5, 0.8], y: -150, x: (Math.random()-0.5)*100, opacity: 0 }}
                    className={`absolute font-black pointer-events-none z-[4000] ${p.text.includes('-') ? 'text-4xl' : 'text-5xl'}`}
                    style={{ 
                        left: p.x, 
                        top: p.y, 
                        color: p.color, 
                        textShadow: `0 0 15px ${p.color}, 3px 3px 0px #000`,
                        fontStyle: 'italic'
                    }}
                >
                    {p.text}
                </motion.div>
            ))}
        </AnimatePresence>

        {/* Vignette & Glitch HUD Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.7)_130%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
    </div>
  );
};
