
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Users, Info, ClipboardList, Send, CheckCircle } from 'lucide-react';
import { ALLY_IMG_CYAN, ALLY_IMG_GOLD, ALLY_IMG_ROSE, COLOR_DREAMY_BLUE, COLOR_NEON_PURPLE, COLOR_NEON_CYAN } from '../constants';
import { Task } from '../types';

interface WarehouseViewProps {
    currency: number;
    tasks: Task[];
    onClose: () => void;
    onBuy: (item: string, cost: number) => void;
    onRecruit: () => void;
    onCompleteTask: (taskId: string) => void;
    hasRecruited: boolean;
}

const TeammateSprite: React.FC<{ url: string; color: string; label: string; onClick: () => void }> = ({ url, color, label, onClick }) => (
    <motion.div 
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
        className="flex flex-col items-center cursor-pointer group"
    >
        <div className="relative w-40 h-48 mb-2">
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl group-hover:bg-white/10 transition-colors" />
            <motion.img 
                src={url} 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            />
            <div className="absolute -bottom-2 px-3 py-1 bg-black/80 border border-white/20 rounded text-[10px] font-black uppercase tracking-widest" style={{ color }}>
                {label}
            </div>
        </div>
    </motion.div>
);

export const WarehouseView: React.FC<WarehouseViewProps> = ({ currency, tasks, onClose, onBuy, onRecruit, onCompleteTask, hasRecruited }) => {
    const [dialog, setDialog] = useState<{ name: string; text: string; options?: { label: string; action: () => void }[] } | null>(null);
    const [view, setView] = useState<'MAIN' | 'TASKS'>('MAIN');

    const teammates = [
        { 
            name: "阿夸 (Aqua)", 
            img: ALLY_IMG_CYAN, 
            color: COLOR_NEON_CYAN,
            dialog: "需要物资吗？只要你通过任务获取足够的积分，这里的战备包随你挑。",
            action: () => setDialog({ 
                name: "阿夸", 
                text: "通过任务获取积分来买物资吧！",
                options: [{ label: "打开商店", action: () => setView('TASKS') }] 
            })
        },
        { 
            name: "金戈 (Gingo)", 
            img: ALLY_IMG_GOLD, 
            color: "#ffca28",
            dialog: "战场很危险，你要不要交一个朋友？我可以和你并肩作战。",
            action: () => setDialog({ 
                name: "金戈", 
                text: "战场需要队友，你要和我交个朋友吗？",
                options: hasRecruited ? [] : [
                    { label: "A: 交朋友", action: () => { onRecruit(); setDialog({ name: "金戈", text: "很好，接下来我会掩护你的后方！" }); } },
                    { label: "B: 拒绝", action: () => setDialog({ name: "金戈", text: "没关系，如果你改变主意再来找我。" }) }
                ] 
            })
        },
        { 
            name: "玫瑰 (Rose)", 
            img: ALLY_IMG_ROSE, 
            color: "#ff4081",
            dialog: "听着，那个大家伙（Boss）虽然强，但它的散热口就在背后的装甲缝隙里...",
            action: () => setDialog({ name: "玫瑰", text: "记住了，Boss的弱点在背后，攻击那里能造成双倍伤害。" })
        }
    ];

    return (
        <div className="absolute inset-0 z-[5000] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center p-12">
            {/* Dreamy Blue Lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.15)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="w-full max-w-6xl relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-16 border-b border-blue-500/30 pb-6">
                    <div>
                        <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white drop-shadow-[0_0_30px_rgba(0,122,255,0.5)]">
                            梦幻蓝·战备基地
                        </h2>
                        <p className="text-blue-200/60 font-mono tracking-widest mt-2">DREAMY BLUE CYBER-DEPOT // SAFE ZONE</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-black/50 border border-blue-500/50 px-6 py-3 rounded-xl flex flex-col items-end">
                            <span className="text-[10px] text-blue-400 font-black uppercase">Operation Credits</span>
                            <span className="text-3xl font-black text-white">{currency} P</span>
                        </div>
                        <button onClick={onClose} className="bg-blue-600 hover:bg-blue-400 text-white font-black px-10 py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(0,122,255,0.5)]">
                            返回战场
                        </button>
                    </div>
                </div>

                {view === 'MAIN' ? (
                    <div className="grid grid-cols-3 gap-12">
                        {teammates.map(tm => (
                            <TeammateSprite key={tm.name} url={tm.img} color={tm.color} label={tm.name} onClick={tm.action} />
                        ))}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-black/40 rounded-3xl p-10 border border-blue-500/20 h-[400px] overflow-y-auto">
                        <div className="flex items-center gap-4 mb-8 text-blue-400 border-b border-blue-500/10 pb-4">
                            <ClipboardList size={32} />
                            <h3 className="text-3xl font-black italic">战术任务面板</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {tasks.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-blue-900/10 p-6 rounded-2xl border border-blue-500/10 group hover:border-blue-400/50 transition-all">
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-1">{t.title}</h4>
                                        <p className="text-sm text-blue-200/50">{t.description}</p>
                                    </div>
                                    {t.completed ? (
                                        <div className="flex items-center gap-2 text-green-400 font-bold">
                                            <CheckCircle size={24} /> 已完成
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onCompleteTask(t.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-black flex items-center gap-2 active:scale-95 transition-all"
                                        >
                                            <Send size={18} /> 执行 (+{t.reward} P)
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setView('MAIN')} className="mt-8 text-blue-400 font-bold hover:underline">返回对话</button>
                    </motion.div>
                )}

                {/* Dialog Overlay */}
                <AnimatePresence>
                    {dialog && (
                        <motion.div 
                            initial={{ y: 50, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: 50, opacity: 0 }}
                            className="absolute bottom-[-150px] left-0 right-0 bg-black/90 border-t-4 border-blue-500 p-10 rounded-3xl shadow-[0_-20px_50px_rgba(0,122,255,0.3)] z-[6000]"
                        >
                            <h4 className="text-2xl font-black italic text-blue-400 mb-4">{dialog.name} 说:</h4>
                            <p className="text-2xl text-white/90 mb-10 leading-relaxed italic">"{dialog.text}"</p>
                            <div className="flex gap-4">
                                {dialog.options ? dialog.options.map((opt, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => { opt.action(); }}
                                        className="bg-blue-600 hover:bg-white hover:text-blue-900 text-white px-10 py-4 rounded-xl font-black transition-all"
                                    >
                                        {opt.label}
                                    </button>
                                )) : (
                                    <button onClick={() => setDialog(null)} className="bg-white text-black px-10 py-4 rounded-xl font-black transition-all">确认</button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
