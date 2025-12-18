import React, { useMemo } from 'react';
import { Entity, EntityType, FloatingText, Item, WeaponType } from '../types';
import { WEAPON_STATS, ITEM_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_WHEAT, COLOR_GREEN, COLOR_DARK_GREEN } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Hammer, Scissors, Crosshair } from 'lucide-react';

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
            animate={isAttacking ? { y: -20, scale: 1.4, rotate: [0, -10, 20, 0] } : { y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            {type === WeaponType.HAMMER && <Hammer size={32} className="text-orange-700 drop-shadow-lg" />}
            {type === WeaponType.DUAL_BLADES && <Scissors size={28} className="text-lime-500 drop-shadow-lg rotate-90" />}
            {type === WeaponType.SWORD && <Sword size={30} className="text-green-500 drop-shadow-lg" />}
            {type === WeaponType.FISTS && <Crosshair size={24} className="text-wheat-200 opacity-50" />}
        </motion.div>
    );
}

const EntityRenderer: React.FC<{ entity: Entity; isCelebrating?: boolean }> = ({ entity, isCelebrating }) => {
  const isPlayer = entity.type === EntityType.PLAYER;
  
  return (
    <div
      className="absolute flex flex-col items-center justify-end will-change-transform"
      style={{
        width: entity.size,
        height: entity.size,
        left: 0,
        top: 0,
        transform: `translate(${entity.pos.x}px, ${entity.pos.y}px)`,
        // DEPTH STACKING: Using Y position to determine render order
        zIndex: Math.floor(entity.pos.y + entity.size),
      }}
    >
        {/* Contact Shadow */}
        <div className="absolute bottom-2 w-[80%] h-[15%] bg-black/40 blur-lg rounded-[100%]" />

        <motion.div 
            className={`relative w-full h-full transition-all duration-75 origin-bottom ${entity.hitFlashTimer && entity.hitFlashTimer > 0 ? 'brightness-200 saturate-0' : ''}`}
            // RUN TO STAND TRANSITION
            animate={isCelebrating && isPlayer ? {
                y: [0, -50, 0],
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1]
            } : {
                rotate: entity.isMoving ? (entity.facing === 'right' ? 8 : -8) : 0,
                y: entity.isMoving ? [0, -6, 0] : 0,
                scaleX: entity.facing === 'left' ? -1 : 1
            }}
            transition={{ 
                duration: entity.isMoving ? 0.3 : 1, 
                repeat: Infinity 
            }}
        >
            <div className="w-full h-full">
                <img 
                    src={entity.visualUrl} 
                    alt="Character" 
                    className="w-full h-full object-contain drop-shadow-xl"
                />
            </div>

            {/* HANDS UP / WEAPON POSE */}
            <div 
                className={`absolute bottom-[40%] ${entity.facing === 'right' ? '-right-2' : '-left-2'} z-20`}
                style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : '' }}
            >
                <WeaponVisual type={entity.weapon} isAttacking={entity.isAttacking} />
            </div>
        </motion.div>

        {/* HUD Overlay for Entity */}
        <div className="absolute -top-6 w-[100%] flex flex-col items-center gap-1 z-30">
            {isPlayer && entity.upgradeLevel && entity.upgradeLevel > 0 && (
                <span className="text-[10px] font-bold text-yellow-400 bg-black/50 px-1 rounded">LVL {entity.upgradeLevel}</span>
            )}
            <div className="w-full h-1.5 bg-black/60 rounded-full border border-gray-800 overflow-hidden shadow-sm">
                <div 
                    className={`h-full transition-all duration-300 ${isPlayer ? 'bg-green-400 shadow-[0_0_5px_green]' : 'bg-red-500'}`} 
                    style={{ width: `${(entity.health / entity.maxHealth) * 100}%` }}
                />
            </div>
        </div>
    </div>
  );
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, enemies, items, particles, width, height, shakeIntensity, isCelebrating }) => {
  
  const environmentDecor = useMemo(() => {
    const decors = [];
    // Wheat Grass
    for (let i = 0; i < 40; i++) {
        decors.push(
            <div key={`wheat-${i}`} className="absolute w-2 h-8 bg-[#d4b483] rounded-t-full opacity-60" style={{
                left: Math.random() * width,
                top: Math.random() * height,
                transform: `rotate(${Math.random() * 20 - 10}deg) skewX(${Math.random() * 20}deg)`,
                zIndex: 1
            }} />
        );
    }
    // Moss Patches (Green)
    for (let i = 0; i < 12; i++) {
        decors.push(
            <div key={`moss-${i}`} className="absolute bg-[#2d5a27]/40 blur-xl rounded-full" style={{
                left: Math.random() * width,
                top: Math.random() * height,
                width: 50 + Math.random() * 100,
                height: 30 + Math.random() * 60,
                zIndex: 0
            }} />
        );
    }
    return decors;
  }, [width, height]);

  return (
    <div 
        className="relative overflow-hidden shadow-2xl rounded-sm border-8 border-[#3d3d3d] bg-[#1a1a1a]"
        style={{ 
            width, 
            height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        {/* Environment - Wheat Fields */}
        <div className="absolute inset-0 bg-[#4a412a] z-0">
             <div className="absolute inset-0 opacity-20" 
                  style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/asphalt-dark.png")' }}></div>
        </div>

        {/* Decorative Layers */}
        {environmentDecor}
        
        {/* Dirt Paths */}
        <div className="absolute top-1/2 left-0 right-0 h-32 bg-[#3a3020] -translate-y-1/2 blur-2xl opacity-40" />

        {/* Shadows and Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)] z-10 pointer-events-none" />

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
                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    {item.type === 'WEAPON' && <WeaponVisual type={item.subtype || WeaponType.SWORD} />}
                    {item.type === 'CURRENCY' && <div className="w-6 h-6 bg-yellow-400 border-2 border-yellow-600 rounded-sm rotate-45 shadow-[0_0_10px_gold]" />}
                </motion.div>
                <div className="absolute bottom-[-5px] w-6 h-1.5 bg-black/40 blur-sm rounded-full" />
            </motion.div>
        ))}

        {/* Entities: STACKED by Y position */}
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
                className="absolute font-black text-2xl pointer-events-none z-[1000] italic"
                style={{
                    left: p.x,
                    top: p.y,
                    color: p.color,
                    opacity: p.life / 30,
                    textShadow: '2px 2px 0px #000',
                    transform: `translateY(-${(45 - p.life) * 2}px)`
                }}
            >
                {p.text}
            </div>
        ))}
    </div>
  );
};