import React, { useMemo } from 'react';
import { Entity, EntityType, FloatingText, Item, WeaponType } from '../types';
import { WEAPON_STATS, ITEM_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
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
  isCelebrating?: boolean;
}

const WeaponVisual: React.FC<{ type: WeaponType }> = ({ type }) => {
    switch(type) {
        case WeaponType.HAMMER: return <Hammer size={24} className="text-orange-600 drop-shadow-lg" />;
        case WeaponType.DUAL_BLADES: return <Scissors size={24} className="text-emerald-500 drop-shadow-lg rotate-90" />;
        case WeaponType.SWORD: return <Sword size={24} className="text-cyan-500 drop-shadow-lg" />;
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
        transform: `translate(${entity.pos.x}px, ${entity.pos.y}px)`,
        zIndex: Math.floor(entity.pos.y + entity.size),
      }}
    >
        {/* Contact Shadow */}
        <div className="absolute bottom-2 w-[90%] h-[20%] bg-black/70 blur-md rounded-[100%] scale-x-110" />

        <motion.div 
            className={`
                relative w-full h-full transition-all duration-75 origin-bottom
                ${entity.hitFlashTimer && entity.hitFlashTimer > 0 ? 'brightness-150 contrast-125 saturate-0' : ''}
            `}
            animate={isCelebrating && isPlayer ? {
                y: [0, -60, 0, -30, 0],
                rotate: [0, -15, 15, -10, 10, 0],
                scale: [1, 1.2, 1]
            } : {
                // Running bobbing effect
                y: entity.speed > 0 ? [0, -4, 0] : 0
            }}
            transition={{ 
                duration: isCelebrating ? 1.5 : 0.4, 
                repeat: isCelebrating ? 0 : Infinity 
            }}
        >
            <div className={`w-full h-full overflow-visible`}>
                <img 
                    src={entity.visualUrl} 
                    alt="Entity" 
                    className={`
                        w-full h-full object-contain 
                        ${entity.facing === 'left' ? 'scale-x-[-1]' : ''}
                        drop-shadow-2xl
                    `}
                />
            </div>

            {/* Weapon Overlay */}
            {entity.weapon !== WeaponType.FISTS && (
                <div 
                    className={`absolute bottom-[35%] ${entity.facing === 'right' ? '-right-4' : '-left-4'} z-20`}
                    style={{ transform: entity.facing === 'left' ? 'scaleX(-1) rotate(-15deg)' : 'rotate(15deg)' }}
                >
                    <WeaponVisual type={entity.weapon} />
                </div>
            )}
        </motion.div>

        {/* Health Bar */}
        <div className="absolute -top-4 w-[120%] h-1.5 bg-black/80 rounded-sm border border-gray-800 overflow-hidden z-30">
            <div 
                className={`h-full ${isPlayer ? 'bg-cyan-400' : 'bg-rose-500'}`} 
                style={{ width: `${(entity.health / entity.maxHealth) * 100}%` }}
            />
        </div>

        {/* Attack Effect */}
        <AnimatePresence>
            {entity.isAttacking && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: entity.facing === 'right' ? -45 : 45 }}
                    animate={{ opacity: 1, scale: 1.8, rotate: entity.facing === 'right' ? 45 : -45 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className={`absolute bottom-1/2 ${entity.facing === 'right' ? '-right-10' : '-left-10'} w-40 h-16 blur-md rounded-[100%] z-40`}
                    style={{ 
                        transformOrigin: 'center',
                        backgroundColor: WEAPON_STATS[entity.weapon].color,
                        mixBlendMode: 'screen'
                    }}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, enemies, items, particles, width, height, shakeIntensity, isCelebrating }) => {
  
  // Memoize static street decorations so they don't re-render every frame
  const streetDecorations = useMemo(() => {
    const decors = [];
    // Graffiti
    for (let i = 0; i < 6; i++) {
        decors.push(
            <div key={`graf-${i}`} className="absolute font-black opacity-30 select-none" style={{
                left: Math.random() * (width - 100),
                top: Math.random() * (height - 100),
                fontSize: 40 + Math.random() * 60,
                transform: `rotate(${Math.random() * 360}deg) scaleY(0.5)`, // Flattened for perspective
                color: ['#ef4444', '#a855f7', '#3b82f6', '#eab308'][Math.floor(Math.random() * 4)],
                filter: 'blur(1px)'
            }}>
                {['RISE', 'RUN', 'FIGHT', 'CYBER', 'X', '77'][i]}
            </div>
        );
    }
    // Cracks/Manholes
    for(let i=0; i<8; i++) {
        decors.push(
            <div key={`crack-${i}`} className="absolute bg-black/40 rounded-full blur-[2px]" style={{
                left: Math.random() * width,
                top: Math.random() * height,
                width: 20 + Math.random() * 40,
                height: 5 + Math.random() * 10,
                transform: `rotate(${Math.random() * 180}deg)`
            }} />
        )
    }
    return decors;
  }, [width, height]);

  return (
    <div 
        className="relative overflow-hidden shadow-2xl rounded-sm border-8 border-neutral-900 bg-[#0a0a0a]"
        style={{ 
            width, 
            height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        {/* --- REALISTIC STREET ENVIRONMENT --- */}
        
        {/* 1. Asphalt Base */}
        <div className="absolute inset-0 bg-[#1c1c1e] z-0">
             {/* Grain Texture */}
             <div className="absolute inset-0 opacity-40" 
                  style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/asphalt-dark.png")' }}></div>
        </div>

        {/* 2. Street Markings & Details */}
        <div className="absolute inset-0 z-0 pointer-events-none perspective-[1000px]">
             {/* Crosswalk / Lines */}
             <div className="absolute top-0 bottom-0 left-[15%] w-4 bg-white/10 blur-[1px]"></div>
             <div className="absolute top-0 bottom-0 right-[15%] w-4 bg-white/10 blur-[1px]"></div>
             
             {/* Center Yellow Lines */}
             <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 flex flex-col items-center gap-24 opacity-60">
                 {Array.from({ length: 10 }).map((_, i) => (
                     <div key={i} className="w-4 h-32 bg-yellow-600 rounded-sm shadow-[0_0_15px_rgba(202,138,4,0.3)]" />
                 ))}
             </div>
             
             {/* Street Decor (Graffiti etc) */}
             {streetDecorations}
        </div>

        {/* 3. Dynamic Shadows / Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_90%)] z-10 pointer-events-none" />
        
        {/* 4. Neon Atmosphere Reflection */}
        <div className="absolute inset-0 z-10 opacity-20 pointer-events-none bg-gradient-to-tr from-purple-900/40 via-transparent to-blue-900/40 mixed-blend-overlay" />

        {/* Items */}
        {items.map(item => (
            <motion.div
                key={item.id}
                className="absolute flex items-center justify-center"
                style={{
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    left: item.pos.x,
                    top: item.pos.y,
                    zIndex: Math.floor(item.pos.y),
                }}
            >
                <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="relative"
                >
                    {/* Item Glow */}
                    <div className="absolute inset-0 bg-white/50 blur-xl rounded-full" />
                    
                    {item.type === 'WEAPON' && item.subtype && <WeaponVisual type={item.subtype} />}
                    {item.type === 'CURRENCY' && (
                         <div className="w-4 h-8 bg-cyan-400 border border-white shadow-[0_0_15px_cyan] skew-x-12" />
                    )}
                </motion.div>
                <div className="absolute bottom-[-5px] w-6 h-1.5 bg-black/60 blur-sm rounded-full" />
            </motion.div>
        ))}

        {/* Entities */}
        {[...enemies, player]
            .sort((a, b) => a.pos.y - b.pos.y)
            .map(entity => (
                <EntityRenderer key={entity.id} entity={entity} isCelebrating={isCelebrating} />
            ))
        }

        {/* Floating Text */}
        {particles.map(p => (
            <div 
                key={p.id}
                className="absolute font-black text-3xl pointer-events-none z-50 italic tracking-tighter"
                style={{
                    left: p.x,
                    top: p.y,
                    color: p.color,
                    opacity: p.life / 30,
                    textShadow: '3px 3px 0px #000',
                    transform: `translateY(-${(45 - p.life) * 3}px) rotate(${Math.random() * 10 - 5}deg)`
                }}
            >
                {p.text}
            </div>
        ))}
    </div>
  );
};