import React from 'react';
import { Entity, EntityType, FloatingText, Item, WeaponType } from '../types';
import { WEAPON_STATS, ITEM_SIZE } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Hammer, Scissors } from 'lucide-react';

interface GameCanvasProps {
  player: Entity;
  enemies: Entity[];
  items: Item[];
  particles: FloatingText[];
  width: number;
  height: number;
  shakeIntensity: number;
  isCelebrating?: boolean; // New prop for victory dance
}

const WeaponVisual: React.FC<{ type: WeaponType }> = ({ type }) => {
    switch(type) {
        case WeaponType.HAMMER: return <Hammer size={24} className="text-yellow-500 drop-shadow-lg" />;
        case WeaponType.DUAL_BLADES: return <Scissors size={24} className="text-green-500 drop-shadow-lg rotate-90" />;
        case WeaponType.SWORD: return <Sword size={24} className="text-blue-500 drop-shadow-lg" />;
        default: return null;
    }
}

const EntityRenderer: React.FC<{ entity: Entity; isCelebrating?: boolean }> = ({ entity, isCelebrating }) => {
  const isPlayer = entity.type === EntityType.PLAYER;
  
  return (
    <div
      className="absolute flex flex-col items-center justify-end transition-transform will-change-transform"
      style={{
        width: entity.size,
        height: entity.size,
        left: 0,
        top: 0,
        // Y-sorting via zIndex + transform
        transform: `translate(${entity.pos.x}px, ${entity.pos.y}px)`,
        zIndex: Math.floor(entity.pos.y + entity.size),
      }}
    >
        {/* Realistic Shadow to ground entity */}
        <div className="absolute bottom-1 w-[80%] h-[15%] bg-black/60 blur-sm rounded-[100%] scale-x-125" />

        {/* Character Container with 3D Pop effect */}
        <motion.div 
            className={`
                relative w-full h-full transition-all duration-75 origin-bottom
                ${entity.hitFlashTimer && entity.hitFlashTimer > 0 ? 'brightness-200 sepia contrast-150' : ''}
            `}
            animate={isCelebrating && isPlayer ? {
                y: [0, -40, 0, -20, 0],
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        >
            {/* The Image (Billboard) */}
            <div className={`
                w-full h-full overflow-visible
                ${isPlayer ? 'drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]'}
            `}>
                <img 
                    src={entity.visualUrl} 
                    alt="Entity" 
                    className={`
                        w-full h-full object-contain 
                        ${entity.facing === 'left' ? 'scale-x-[-1]' : ''}
                        filter drop-shadow-md
                    `}
                    style={{
                        // Slight tilt for 2.5D effect if desired, but billboard looks best for sprites
                    }}
                />
            </div>

            {/* Weapon Overlay (Held in hand) */}
            {entity.weapon !== WeaponType.FISTS && (
                <div 
                    className={`absolute bottom-[30%] ${entity.facing === 'right' ? '-right-2' : '-left-2'} z-20`}
                    style={{ transform: entity.facing === 'left' ? 'scaleX(-1) rotate(-15deg)' : 'rotate(15deg)' }}
                >
                    <WeaponVisual type={entity.weapon} />
                </div>
            )}
        </motion.div>

        {/* Health Bar (Floating above head) */}
        <div className="absolute -top-6 w-[100%] h-2 bg-slate-900/80 rounded-full border border-slate-700 overflow-hidden z-30 shadow-sm">
            <div 
                className={`h-full ${isPlayer ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-600'}`} 
                style={{ width: `${(entity.health / entity.maxHealth) * 100}%` }}
            />
        </div>

        {/* Attack Effect */}
        <AnimatePresence>
            {entity.isAttacking && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: entity.facing === 'right' ? -45 : 45 }}
                    animate={{ opacity: 1, scale: 1.5, rotate: entity.facing === 'right' ? 45 : -45 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute bottom-1/2 ${entity.facing === 'right' ? '-right-12' : '-left-12'} w-32 h-12 blur-md rounded-full z-40`}
                    style={{ 
                        transformOrigin: 'center',
                        backgroundColor: WEAPON_STATS[entity.weapon].color
                    }}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, enemies, items, particles, width, height, shakeIntensity, isCelebrating }) => {
  return (
    <div 
        className="relative overflow-hidden shadow-2xl rounded-xl border-4 border-slate-900 bg-[#1a1a1a]"
        style={{ 
            width, 
            height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        {/* --- 3D CITY ENVIRONMENT --- */}
        
        {/* 1. Base / Sidewalks (Dark concrete) */}
        <div className="absolute inset-0 bg-slate-800 z-0">
            {/* Texture pattern */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
        </div>

        {/* 2. The Road (Main playable area visual guide) */}
        <div className="absolute top-0 bottom-0 left-[10%] right-[10%] bg-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] z-0 border-x-4 border-slate-600">
             {/* Asphalt texture */}
             <div className="absolute inset-0 opacity-30" 
                  style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/asphalt-dark.png")' }}></div>
             
             {/* Yellow Lines (Center) */}
             <div className="absolute top-0 bottom-0 left-1/2 w-4 -translate-x-1/2 flex flex-col items-center gap-12 pt-4">
                 {Array.from({ length: 20 }).map((_, i) => (
                     <div key={i} className="w-2 h-16 bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.4)] rounded-sm" />
                 ))}
             </div>
             
             {/* White Lines (Edges) */}
             <div className="absolute top-0 bottom-0 left-2 w-2 bg-white/20" />
             <div className="absolute top-0 bottom-0 right-2 w-2 bg-white/20" />
        </div>

        {/* 3. Lighting / Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-purple-900/20 pointer-events-none z-10 mixed-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-10" />


        {/* Items on Ground */}
        {items.map(item => (
            <motion.div
                key={item.id}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute flex items-center justify-center"
                style={{
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    left: item.pos.x,
                    top: item.pos.y,
                    zIndex: Math.floor(item.pos.y),
                }}
            >
                {/* Floating Animation */}
                <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-white/40 blur-lg rounded-full" />
                    {item.type === 'WEAPON' && item.subtype && <WeaponVisual type={item.subtype} />}
                    {item.type === 'CURRENCY' && (
                        <div className="relative">
                             <div className="w-6 h-6 bg-purple-500 rotate-45 border-2 border-white shadow-[0_0_15px_#a855f7]" />
                             <div className="absolute inset-0 bg-purple-300 rotate-45 scale-50" />
                        </div>
                    )}
                </motion.div>
                
                {/* Item Shadow */}
                <div className="absolute bottom-[-10px] w-8 h-2 bg-black/50 blur-sm rounded-full" />
            </motion.div>
        ))}

        {/* Entities */}
        {[...enemies, player]
            .sort((a, b) => a.pos.y - b.pos.y) // Y-Sort for pseudo-3D
            .map(entity => (
                <EntityRenderer key={entity.id} entity={entity} isCelebrating={isCelebrating} />
            ))
        }

        {/* Particles */}
        {particles.map(p => (
            <div 
                key={p.id}
                className="absolute font-black text-2xl pointer-events-none z-50 text-stroke-sm font-mono"
                style={{
                    left: p.x,
                    top: p.y,
                    color: p.color,
                    opacity: p.life / 30,
                    textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
                    transform: `translateY(-${(45 - p.life) * 2}px) scale(${1 + (45-p.life)/100})`
                }}
            >
                {p.text}
            </div>
        ))}
    </div>
  );
};