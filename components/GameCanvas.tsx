
import React, { useMemo } from 'react';
import { Entity, EntityType, FloatingText, Item, WeaponType } from '../types';
import { WEAPON_STATS, ITEM_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_WHEAT, COLOR_GREEN, COLOR_PURPLE } from '../constants';
import { motion } from 'framer-motion';
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
            animate={isAttacking ? { 
                y: [-10, -45, -10], 
                scale: [1, 1.4, 1], 
                rotate: [0, -25, 35, 0] 
            } : { y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {type === WeaponType.HAMMER && <Hammer size={40} className="text-orange-800 drop-shadow-lg" />}
            {type === WeaponType.DUAL_BLADES && <Scissors size={36} className="text-lime-500 drop-shadow-lg rotate-90" />}
            {type === WeaponType.SWORD && <Sword size={38} className="text-emerald-500 drop-shadow-lg" />}
            {type === WeaponType.FISTS && <Crosshair size={32} className="text-purple-400 opacity-90" />}
        </motion.div>
    );
}

// 核心：拆分肢体动画系统 (Split-Body Animation)
const AnimatedCharacter: React.FC<{ entity: Entity; isCelebrating?: boolean }> = ({ entity, isCelebrating }) => {
    const isMoving = entity.isMoving && !isCelebrating;
    const isPlayer = entity.type === EntityType.PLAYER;

    return (
        <div className="relative w-full h-full origin-bottom">
            {/* 上半身 (Torso & Head) */}
            <motion.div 
                className="absolute inset-0 z-10"
                style={{ 
                    clipPath: 'inset(0 0 38% 0)', // 裁掉下半身
                    filter: entity.hitFlashTimer && entity.hitFlashTimer > 0 ? 'brightness(3) saturate(0)' : 'none'
                }}
                animate={isMoving ? { y: [0, -4, 0] } : { y: [0, -1, 0] }}
                transition={{ repeat: Infinity, duration: 0.45 }}
            >
                <img 
                    src={entity.visualUrl} 
                    alt="torso" 
                    className="w-full h-full object-contain" 
                    style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }} 
                />
            </motion.div>

            {/* 左腿 (Left Leg Clipping) */}
            <motion.div 
                className="absolute inset-0 origin-[50%_62%]"
                style={{ clipPath: 'inset(62% 50% 0 0)' }} 
                animate={isMoving ? { 
                    rotate: [25, -25, 25],
                    y: [0, -3, 0]
                } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut" }}
            >
                <img 
                    src={entity.visualUrl} 
                    alt="leg-l" 
                    className="w-full h-full object-contain" 
                    style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }} 
                />
            </motion.div>

            {/* 右腿 (Right Leg Clipping) */}
            <motion.div 
                className="absolute inset-0 origin-[50%_62%]"
                style={{ clipPath: 'inset(62% 0 0 50%)' }} 
                animate={isMoving ? { 
                    rotate: [-25, 25, -25],
                    y: [0, -3, 0]
                } : { rotate: 0 }}
                transition={{ repeat: Infinity, duration: 0.4, ease: "easeInOut", delay: 0.2 }}
            >
                <img 
                    src={entity.visualUrl} 
                    alt="leg-r" 
                    className="w-full h-full object-contain" 
                    style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }} 
                />
            </motion.div>

            {/* 手部武器 (Hand Position Up - 独立定位) */}
            <div 
                className={`absolute bottom-[48%] ${entity.facing === 'right' ? '-right-5' : '-left-5'} z-20`}
                style={{ transform: entity.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}
            >
                <WeaponVisual type={entity.weapon} isAttacking={entity.isAttacking} />
            </div>
        </div>
    );
};

const EntityRenderer: React.FC<{ entity: Entity; isCelebrating?: boolean }> = ({ entity, isCelebrating }) => {
  const isPlayer = entity.type === EntityType.PLAYER;
  
  return (
    <div
      className="absolute flex flex-col items-center justify-end"
      style={{
        width: entity.size,
        height: entity.size,
        left: 0,
        top: 0,
        transform: `translate(${entity.pos.x}px, ${entity.pos.y}px)`,
        // 层级堆叠：基于 Y 坐标
        zIndex: Math.floor(entity.pos.y + entity.size),
      }}
    >
        {/* 地面阴影 */}
        <div className="absolute bottom-2 w-[75%] h-[12%] bg-black/35 blur-md rounded-[100%]" />

        <AnimatedCharacter entity={entity} isCelebrating={isCelebrating} />

        {/* HUD */}
        <div className="absolute -top-10 w-full flex flex-col items-center gap-1 z-30 pointer-events-none">
            {isPlayer && (
                <span className="text-[11px] font-black text-white bg-purple-600/90 px-3 py-0.5 rounded-full border border-purple-300/50 italic shadow-[0_0_10px_purple]">
                    紫岚战队 LV.{entity.upgradeLevel || 1}
                </span>
            )}
            <div className="w-20 h-2 bg-black/70 rounded-full border border-gray-700 overflow-hidden shadow-inner">
                <div 
                    className={`h-full transition-all duration-300 ${isPlayer ? 'bg-gradient-to-r from-purple-500 to-green-400 shadow-[0_0_8px_#a855f7]' : 'bg-red-600 shadow-[0_0_8px_red]'}`} 
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
    for (let i = 0; i < 50; i++) {
        decors.push(
            <div key={`wheat-${i}`} className="absolute w-2 h-12 bg-[#dec090] rounded-t-full opacity-40" style={{
                left: Math.random() * width,
                top: Math.random() * height,
                transform: `rotate(${Math.random() * 20 - 10}deg)`,
                zIndex: 1
            }} />
        );
    }
    for (let i = 0; i < 18; i++) {
        decors.push(
            <div key={`patch-${i}`} className="absolute bg-[#3a5a30]/30 blur-3xl rounded-full" style={{
                left: Math.random() * width,
                top: Math.random() * height,
                width: 100 + Math.random() * 150,
                height: 50 + Math.random() * 100,
                zIndex: 0
            }} />
        );
    }
    return decors;
  }, [width, height]);

  return (
    <div 
        className="relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] rounded-lg border-[14px] border-[#333] bg-[#222]"
        style={{ 
            width, 
            height,
            transform: `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
        }}
    >
        <div className="absolute inset-0 bg-[#423a28] z-0" />
        {environmentDecor}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_115%)] z-10 pointer-events-none" />

        {/* 物品 */}
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
                <motion.div animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                    {item.type === 'WEAPON' && <WeaponVisual type={item.subtype || WeaponType.SWORD} />}
                    {item.type === 'CURRENCY' && <div className="w-6 h-6 bg-purple-500 border-2 border-purple-200 rounded-full shadow-[0_0_20px_#a855f7]" />}
                </motion.div>
            </motion.div>
        ))}

        {/* 实体堆叠 */}
        {[...enemies, player]
            .sort((a, b) => a.pos.y - b.pos.y)
            .map(entity => (
                <EntityRenderer key={entity.id} entity={entity} isCelebrating={isCelebrating} />
            ))
        }

        {/* 飘字 */}
        {particles.map(p => (
            <div 
                key={p.id}
                className="absolute font-black text-3xl pointer-events-none z-[2000] italic uppercase"
                style={{
                    left: p.x,
                    top: p.y,
                    color: p.color,
                    opacity: p.life / 40,
                    textShadow: '4px 4px 0px #000',
                    transform: `translateY(-${(40 - p.life) * 3}px)`
                }}
            >
                {p.text}
            </div>
        ))}
    </div>
  );
};
