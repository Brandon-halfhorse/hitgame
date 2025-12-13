import React from 'react';
import { Entity, EntityType, FloatingText } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface GameCanvasProps {
  player: Entity;
  enemies: Entity[];
  particles: FloatingText[];
  width: number;
  height: number;
  shakeIntensity: number;
}

const EntityRenderer: React.FC<{ entity: Entity }> = ({ entity }) => {
  const isPlayer = entity.type === EntityType.PLAYER;
  const isBoss = entity.type === EntityType.ENEMY_BOSS;
  
  // 3D Token Effect:
  // We use a container with a transformation to simulate a standing "chip" or "miniature"
  // The shadow at the bottom helps ground it.
  
  return (
    <div
      className="absolute flex flex-col items-center justify-end transition-transform will-change-transform"
      style={{
        width: entity.size,
        height: entity.size, // Render height slightly taller for 3D effect
        left: 0,
        top: 0,
        transform: `translate(${entity.pos.x}px, ${entity.pos.y}px)`,
        zIndex: Math.floor(entity.pos.y), // Simple depth sorting
      }}
    >
        {/* Shadow Blob */}
        <div className="absolute bottom-0 w-[80%] h-[20%] bg-black/40 blur-sm rounded-[100%]" />

        {/* Character Token */}
        <div 
            className={`
                relative w-full aspect-square rounded-full border-4 overflow-hidden transition-all duration-75
                ${isPlayer ? 'border-blue-400' : 'border-red-500'}
                ${entity.hitFlashTimer && entity.hitFlashTimer > 0 ? 'brightness-200 sepia' : ''}
            `}
            style={{
                // "3D Coin" look using box-shadows
                boxShadow: isPlayer 
                    ? '0px 6px 0px #1e3a8a, 0px 10px 10px rgba(0,0,0,0.5)' 
                    : '0px 6px 0px #7f1d1d, 0px 10px 10px rgba(0,0,0,0.5)',
                transform: `translateY(${entity.hitFlashTimer ? -5 : 0}px)` // Hop when hit
            }}
        >
             {/* Glossy Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent z-10 pointer-events-none" />

            <img 
                src={entity.visualUrl} 
                alt="Entity" 
                className={`w-full h-full object-cover ${entity.facing === 'left' ? 'scale-x-[-1]' : ''}`}
            />
        </div>

        {/* Health Bar (Floating above head) */}
        <div className="absolute -top-4 w-[120%] h-2 bg-gray-900 rounded-full border border-gray-600 overflow-hidden z-20">
            <div 
                className={`h-full ${isPlayer ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-red-600 to-orange-500'}`} 
                style={{ width: `${(entity.health / entity.maxHealth) * 100}%` }}
            />
        </div>

        {/* Attack Effect: A slash overlay */}
        <AnimatePresence>
            {entity.isAttacking && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: entity.facing === 'right' ? -45 : 45 }}
                    animate={{ opacity: 1, scale: 1.5, rotate: entity.facing === 'right' ? 45 : -45 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute bottom-1/2 ${entity.facing === 'right' ? '-right-10' : '-left-10'} w-24 h-8 bg-white/80 blur-md rounded-full z-30`}
                    style={{ transformOrigin: 'center' }}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, enemies, particles, width, height, shakeIntensity }) => {
  return (
    <div 
        className="relative overflow-hidden shadow-2xl rounded-xl border-8 border-slate-800 bg-[#1a1a1a]"
        style={{ 
            width, 
            height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        {/* Isometric Grid Floor */}
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(20deg) scale(1.5)',
                transformOrigin: 'top center'
            }}
        />

        {/* Dynamic Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

        {/* Render Enemies sorted by Y for pseudo-3D depth */}
        {[...enemies, player]
            .sort((a, b) => a.pos.y - b.pos.y)
            .map(entity => (
                <EntityRenderer key={entity.id} entity={entity} />
            ))
        }

        {/* Floating Damage Text */}
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