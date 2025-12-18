
import React, { useMemo } from 'react';
import { Entity, EntityType, FloatingText, Item, WeaponType } from '../types';
import { WEAPON_STATS, ITEM_SIZE, COLOR_NEON_PURPLE, COLOR_NEON_GREEN } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Hammer, Scissors, Crosshair, Zap, Building2, Store, Car } from 'lucide-react';

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
    return (
        <motion.div
            animate={isAttacking ? { 
                y: [-5, -65, -5], 
                scale: [1, 1.8, 1], 
                rotate: [0, -60, 90, 0],
                filter: ['brightness(1) blur(0px)', 'brightness(2) blur(1px)', 'brightness(1) blur(0px)']
            } : { y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: "circOut" }}
            className="drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
        >
            {type === WeaponType.HAMMER && <Hammer size={48} className="text-orange-500" />}
            {type === WeaponType.DUAL_BLADES && <Scissors size={42} className="text-cyan-400 rotate-90" />}
            {type === WeaponType.SWORD && <Sword size={44} className="text-green-400" />}
            {type === WeaponType.FISTS && <Crosshair size={38} className="text-purple-400" />}
        </motion.div>
    );
}

const AnimatedCharacter: React.FC<{ entity: Entity; isCelebrating?: boolean }> = ({ entity, isCelebrating }) => {
    const isMoving = entity.isMoving && !isCelebrating;
    const isPlayer = entity.type === EntityType.PLAYER;

    // Natural walk parameters
    const walkDuration = 0.4;
    const bobHeight = isMoving ? -8 : -2;

    return (
        <motion.div 
            className="relative w-full h-full origin-bottom"
            animate={isMoving ? { 
                scaleY: [1, 0.94, 1.04, 1],
                scaleX: [1, 1.04, 0.96, 1],
                rotate: entity.facing === 'right' ? [0, 2, 0] : [0, -2, 0]
            } : { scaleY: [1, 0.98, 1] }}
            transition={{ repeat: Infinity, duration: walkDuration * 2, ease: "easeInOut" }}
        >
            {/* 1. Head - Independent slight delay for "floppiness" */}
            <motion.div 
                className="absolute inset-0 z-30"
                style={{ clipPath: 'inset(0 0 78% 0)' }}
                animate={isMoving ? { 
                    y: [0, -3, 0], 
                    rotate: [-3, 3, -3] 
                } : { y: [0, -1, 0] }}
                transition={{ repeat: Infinity, duration: walkDuration * 2, delay: 0.05 }}
            >
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>

            {/* 2. Torso - Core movement and hit flash */}
            <motion.div 
                className="absolute inset-0 z-20"
                style={{ 
                    clipPath: 'inset(22% 0 42% 0)',
                    filter: entity.hitFlashTimer && entity.hitFlashTimer > 0 ? 'brightness(5) hue-rotate(90deg)' : 'none'
                }}
                animate={isMoving ? { y: [0, bobHeight, 0] } : { y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: walkDuration, ease: "easeInOut" }}
            >
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>

            {/* 3. Left Leg - Smooth circular arc */}
            <motion.div 
                className="absolute inset-0 z-10 origin-[50%_58%]"
                style={{ clipPath: 'inset(58% 52% 0 0)' }}
                animate={isMoving ? { 
                    rotate: [35, -35, 35],
                    x: [0, 8, 0],
                    y: [0, -6, 0]
                } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: walkDuration, ease: "linear" }}
            >
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>

            {/* 4. Right Leg - Offset for natural alternating step */}
            <motion.div 
                className="absolute inset-0 z-10 origin-[50%_58%]"
                style={{ clipPath: 'inset(58% 0 0 52%)' }}
                animate={isMoving ? { 
                    rotate: [-35, 35, -35],
                    x: [0, -8, 0],
                    y: [0, -6, 0]
                } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: walkDuration, ease: "linear", delay: walkDuration/2 }}
            >
                <img src={entity.visualUrl} className="w-full h-full object-contain" style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }} />
            </motion.div>

            {/* 5. Hand/Weapon - Dynamic popping */}
            <div 
                className={`absolute bottom-[58%] ${entity.facing === 'right' ? '-right-8' : '-left-8'} z-40`}
                style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }}
            >
                <WeaponVisual type={entity.weapon} isAttacking={entity.isAttacking} />
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
        <div className="absolute bottom-1 w-[85%] h-[18%] bg-black/50 blur-2xl rounded-full" />
        <AnimatedCharacter entity={entity} isCelebrating={isCelebrating} />
        
        <div className="absolute -top-14 w-full flex flex-col items-center gap-1 z-50">
            {isPlayer && (
                <div className="bg-purple-600/90 text-white text-[10px] font-black px-3 py-1 rounded-sm border border-purple-300 shadow-[0_0_15px_#a855f7] italic tracking-widest uppercase">
                    SQUAD.{entity.upgradeLevel}
                </div>
            )}
            <div className="w-20 h-2 bg-black/80 rounded-full border border-gray-800 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-300 ${isPlayer ? 'bg-gradient-to-r from-purple-500 to-cyan-400' : 'bg-red-500'}`} 
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
    // 1. Perspective Grid (Road)
    for (let i = -10; i < 25; i++) {
        items.push(
            <div key={`line-${i}`} className="absolute h-[150%] w-[1px] bg-purple-500/15" 
                 style={{ left: `${(i/15)*100}%`, top: '-25%', transform: 'perspective(600px) rotateX(75deg)', transformOrigin: 'top' }} />
        );
    }
    // 2. Road Stripes
    for (let i = 0; i < 6; i++) {
        items.push(
            <div key={`stripe-${i}`} className="absolute w-[80px] h-[10px] bg-yellow-500/10" 
                 style={{ left: `${width/2 - 40}px`, top: `${(i/6)*100}%`, transform: 'perspective(600px) rotateX(75deg)' }} />
        );
    }
    // 3. Buildings & Cyber signs (Left/Right)
    const signs = [Store, Building2, Zap, Car];
    for (let i = 0; i < 10; i++) {
        const Icon = signs[Math.floor(Math.random()*signs.length)];
        const side = i % 2 === 0 ? 'left' : 'right';
        const topPos = (i / 10) * 100;
        const color = i % 3 === 0 ? 'text-purple-500' : i % 3 === 1 ? 'text-cyan-500' : 'text-green-500';
        items.push(
            <div key={`building-${i}`} className={`absolute ${side}-[-20px] opacity-15 ${color}`}
                 style={{ top: `${topPos}%`, transform: `scale(${1.2 + Math.random()}) perspective(500px) rotateY(${side === 'left' ? '30deg' : '-30deg'})` }}>
                <Icon size={64} />
            </div>
        );
    }
    return items;
  }, [width]);

  return (
    <div 
        className="relative overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] rounded-2xl border-[20px] border-[#0a0a0c] bg-[#020204] scanlines"
        style={{ 
            width, height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        {/* Background Layer with Depth */}
        <div className="absolute inset-0 z-0">
            <div className="absolute bottom-0 w-full h-[70%] bg-gradient-to-t from-[#080812] to-transparent" />
            <div className="absolute top-0 w-full h-[30%] bg-[#020205]" />
            {streetElements}
            {/* Ground reflections */}
            <div className="absolute bottom-20 left-[15%] w-64 h-16 bg-purple-900/5 blur-[80px] rounded-full" />
            <div className="absolute top-40 right-[15%] w-80 h-24 bg-cyan-900/5 blur-[100px] rounded-full" />
        </div>

        {/* Drops */}
        {items.map(item => (
            <motion.div key={item.id} className="absolute" style={{ left: item.pos.x, top: item.pos.y, zIndex: Math.floor(item.pos.y) }}>
                <motion.div 
                  animate={{ y: [0, -15, 0], filter: ['drop-shadow(0 0 5px purple)', 'drop-shadow(0 0 20px purple)', 'drop-shadow(0 0 5px purple)'] }} 
                  transition={{ repeat: Infinity, duration: 1.8 }}
                >
                    {item.type === 'WEAPON' && <WeaponVisual type={item.subtype || WeaponType.SWORD} />}
                    {item.type === 'CURRENCY' && <div className="w-10 h-10 bg-purple-700 border-2 border-white rounded-lg shadow-[0_0_25px_#a855f7] flex items-center justify-center font-black text-white text-sm">$$</div>}
                </motion.div>
                <div className="w-10 h-3 bg-black/50 blur-lg rounded-full mt-2 mx-auto" />
            </motion.div>
        ))}

        {/* Dynamic Entities sorted by Y */}
        {[...enemies, player]
            .sort((a, b) => a.pos.y - b.pos.y)
            .map(entity => <EntityRenderer key={entity.id} entity={entity} isCelebrating={isCelebrating} />)
        }

        {/* Combat Particles */}
        <AnimatePresence>
            {particles.map(p => (
                <motion.div 
                    key={p.id}
                    initial={{ scale: 0, rotate: -20, opacity: 1 }}
                    animate={{ scale: [1, 1.4, 1.2], y: -120, x: (Math.random()-0.5)*40, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute font-black text-5xl pointer-events-none z-[3000] italic"
                    style={{ left: p.x, top: p.y, color: p.color, textShadow: '6px 6px 0px #000, -2px -2px 0px #fff' }}
                >
                    {p.text}
                </motion.div>
            ))}
        </AnimatePresence>

        {/* Mood Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(168,85,247,0.15)_130%)] pointer-events-none" />
    </div>
  );
};
