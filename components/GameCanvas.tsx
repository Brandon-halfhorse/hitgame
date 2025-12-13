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
}

const WeaponVisual: React.FC<{ type: WeaponType }> = ({ type }) => {
    switch(type) {
        case WeaponType.HAMMER: return <Hammer size={24} className="text-yellow-500 drop-shadow-md" />;
        case WeaponType.DUAL_BLADES: return <Scissors size={24} className="text-green-500 drop-shadow-md rotate-90" />;
        case WeaponType.SWORD: return <Sword size={24} className="text-blue-500 drop-shadow-md" />;
        default: return null;
    }
}

const EntityRenderer: React.FC<{ entity: Entity }> = ({ entity }) => {
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
        zIndex: Math.floor(entity.pos.y),
      }}
    >
        {/* Shadow */}
        <div className="absolute bottom-0 w-[80%] h-[20%] bg-black/40 blur-sm rounded-[100%]" />

        {/* Character */}
        <div 
            className={`
                relative w-full aspect-square rounded-full border-4 overflow-hidden transition-all duration-75
                ${isPlayer ? 'border-blue-400' : 'border-red-500'}
                ${entity.hitFlashTimer && entity.hitFlashTimer > 0 ? 'brightness-200 sepia' : ''}
            `}
            style={{
                boxShadow: isPlayer 
                    ? '0px 6px 0px #1e3a8a, 0px 10px 10px rgba(0,0,0,0.5)' 
                    : '0px 6px 0px #7f1d1d, 0px 10px 10px rgba(0,0,0,0.5)',
                transform: `translateY(${entity.hitFlashTimer ? -5 : 0}px)`
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent z-10 pointer-events-none" />
            <img 
                src={entity.visualUrl} 
                alt="Entity" 
                className={`w-full h-full object-cover ${entity.facing === 'left' ? 'scale-x-[-1]' : ''}`}
            />
        </div>

        {/* Weapon Overlay (Held in hand) */}
        {entity.weapon !== WeaponType.FISTS && (
            <div 
                className={`absolute bottom-2 ${entity.facing === 'right' ? '-right-4' : '-left-4'} z-20`}
                style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : 'none' }}
            >
                <WeaponVisual type={entity.weapon} />
            </div>
        )}

        {/* Health Bar */}
        <div className="absolute -top-4 w-[120%] h-2 bg-gray-900 rounded-full border border-gray-600 overflow-hidden z-20">
            <div 
                className={`h-full ${isPlayer ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-orange-500'}`} 
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
                    className={`absolute bottom-1/2 ${entity.facing === 'right' ? '-right-10' : '-left-10'} w-24 h-8 blur-md rounded-full z-30`}
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

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, enemies, items, particles, width, height, shakeIntensity }) => {
  return (
    <div 
        className="relative overflow-hidden shadow-2xl rounded-xl border-8 border-slate-800 bg-[#1a1a1a]"
        style={{ 
            width, 
            height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        {/* Floor Grid */}
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(20deg) scale(1.5)',
                transformOrigin: 'top center'
            }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

        {/* Items on Ground */}
        {items.map(item => (
            <div
                key={item.id}
                className="absolute flex items-center justify-center animate-bounce"
                style={{
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    left: item.pos.x,
                    top: item.pos.y,
                    zIndex: Math.floor(item.pos.y),
                }}
            >
                {/* Glow under item */}
                <div className="absolute inset-0 bg-white/30 blur-md rounded-full" />
                
                {item.type === 'WEAPON' && item.subtype && <WeaponVisual type={item.subtype} />}
                {item.type === 'CURRENCY' && <div className="w-3 h-3 bg-purple-400 rotate-45 border border-purple-200 shadow-[0_0_10px_#a855f7]" />}
            </div>
        ))}

        {/* Entities */}
        {[...enemies, player]
            .sort((a, b) => a.pos.y - b.pos.y)
            .map(entity => (
                <EntityRenderer key={entity.id} entity={entity} />
            ))
        }

        {/* Particles */}
        {particles.map(p => (
            <div 
                key={p.id}
                className="absolute font-black text-2xl pointer-events-none z-50 text-stroke-sm"
                style={{
                    left: p.x,
                    top: p.y,
                    color: p.color,
                    opacity: p.life / 30,
                    textShadow: '2px 2px 0px #000',
                    transform: `translateY(-${(30 - p.life) * 2}px)`
                }}
            >
                {p.text}
            </div>
        ))}
    </div>
  );
};