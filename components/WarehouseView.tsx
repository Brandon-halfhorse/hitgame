
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Users, Info, ClipboardList, Send, CheckCircle, Search } from 'lucide-react';
import { ALLY_IMG_CYAN, ALLY_IMG_GOLD, ALLY_IMG_ROSE, COLOR_DREAMY_BLUE, COLOR_NEON_PURPLE, COLOR_NEON_CYAN } from '../constants';
import { Task } from '../types';

interface WarehouseViewProps {
    currency: number;
    tasks: Task[];
    onClose: () => void;
    onBuy: (item: string, cost: number) => void;
    onRecruit: () => void;
    onCompleteTask: (taskId: string) => void;
    onDeductionResult: (correct: boolean) => void;
    hasRecruited: boolean;
}

const TeammateSprite: React.FC<{ url: string; color: string; label: string; onClick: () => void }> = ({ url, color, label, onClick }) => (
    <motion.div 
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
        className="flex flex-col items-center cursor-pointer group"
    >
        <div className="relative w-48 h-56 mb-4">
            <div className="absolute inset-0 bg-white/5 rounded-3xl blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
            <motion.img 
                src={url} 
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(0,122,255,0.4)] relative z-10"
            />
            <div className="absolute -bottom-4 px-4 py-1.5 bg-black/90 border-2 border-white/20 rounded-full text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl z-20" style={{ color }}>
                {label}
            </div>
        </div>
    </motion.div>
);

export const WarehouseView: React.FC<WarehouseViewProps> = ({ currency, tasks, onClose, onBuy, onRecruit, onCompleteTask, onDeductionResult, hasRecruited }) => {
    const [dialog, setDialog] = useState<{ name: string; text: string; options?: { label: string; action: () => void }[] } | null>(null);
    const [view, setView] = useState<'MAIN' | 'TASKS' | 'DEDUCTION'>('MAIN');
    const [correctDeduction, setCorrectDeduction] = useState("");

    useEffect(() => {
        // Randomly pick one teammate to be the "deduction" target
        const names = ["阿夸", "金戈", "玫瑰"];
        setCorrectDeduction(names[Math.floor(Math.random() * names.length)]);
    }, []);

    const teammates = [
        { 
            name: "阿夸", 
            img: ALLY_IMG_CYAN, 
            color: COLOR_NEON_CYAN,
            text: "需要物资吗？只要你通过任务获取足够的积分，这里的战备包随你挑。",
            clue: "虽然我管着后勤，但我总觉得系统里混进了不该有的代码...",
            action: () => setDialog({ 
                name: "阿夸", 
                text: "通过任务获取积分来买物资吧！目前库存充足。",
                options: [{ label: "查看面板", action: () => setView('TASKS') }] 
            })
        },
        { 
            name: "金戈", 
            img: ALLY_IMG_GOLD, 
            color: "#ffca28",
            text: "战场很危险，你要不要交一个朋友？我可以和你并肩作战。",
            clue: "我是来战斗的，不是来猜谜的。不过，玫瑰看起来似乎知道些什么...",
            action: () => setDialog({ 
                name: "金戈", 
                text: "战场需要可靠的队友。你愿意接受我的支援吗？",
                options: hasRecruited ? [] : [
                    { label: "A: 交个朋友", action: () => { onRecruit(); setDialog({ name: "金戈", text: "协议达成。我会准时出现在你的下一场战斗中。" }); } },
                    { label: "B: 拒绝", action: () => setDialog({ name: "金戈", text: "理解。独自突围也是勇士的选择。" }) }
                ] 
            })
        },
        { 
            name: "玫瑰", 
            img: ALLY_IMG_ROSE, 
            color: "#ff4081",
            text: "那个红发Boss的弱点在背后的装甲缝隙里。记住，攻击那里有奇效。",
            clue: "所有的答案都写在梦幻蓝的阴影里，你真的看清谁才是那个'推演'目标吗？",
            action: () => setDialog({ name: "玫瑰", text: "记住：Boss的弱点在背后。另外，仓库里似乎藏着一个秘密，你想试试自己的眼力吗？", options: [{ label: "开始寻找秘密", action: () => setView('DEDUCTION') }] })
        }
    ];

    return (
        <div className="absolute inset-0 z-[5000] bg-[#00040a]/95 backdrop-blur-[40px] flex flex-col items-center justify-center p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.2)_0%,transparent_80%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
            
            <div className="w-full max-w-6xl relative z-10">
                <div className="flex justify-between items-end mb-16 border-b-2 border-blue-500/20 pb-10">
                    <div>
                        <h2 className="text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-500 drop-shadow-[0_0_40px_rgba(0,122,255,0.6)]">
                            CYBER-DEPOT
                        </h2>
                        <p className="text-blue-400 font-mono tracking-[1em] mt-4 uppercase text-sm opacity-60">Dreamy Blue Safe Zone // Sector 01</p>
                    </div>
                    <div className="flex gap-6">
                        <div className="bg-blue-900/20 border-2 border-blue-400/30 px-8 py-4 rounded-3xl flex flex-col items-end shadow-[0_0_30px_rgba(0,122,255,0.1)]">
                            <span className="text-[11px] text-blue-300 font-black uppercase tracking-widest opacity-60">Op Credits</span>
                            <span className="text-5xl font-black text-white italic">{currency}<span className="text-blue-400 ml-2">P</span></span>
                        </div>
                        <button onClick={onClose} className="bg-white text-blue-900 font-black px-12 py-5 rounded-2xl transition-all hover:bg-blue-400 hover:text-white hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] text-xl active:scale-95 italic">
                            返回战场
                        </button>
                    </div>
                </div>

                {view === 'MAIN' ? (
                    <div className="grid grid-cols-3 gap-20">
                        {teammates.map(tm => (
                            <TeammateSprite key={tm.name} url={tm.img} color={tm.color} label={tm.name} onClick={tm.action} />
                        ))}
                    </div>
                ) : view === 'TASKS' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-950/20 rounded-[3rem] p-12 border-2 border-blue-400/20 h-[450px] overflow-y-auto relative">
                        <div className="flex items-center gap-6 mb-10 text-blue-400 border-b-2 border-blue-400/10 pb-6">
                            <ClipboardList size={48} />
                            <h3 className="text-4xl font-black italic tracking-tight">任务面板 // MISSIONS</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {tasks.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-black/40 p-8 rounded-[2rem] border-2 border-blue-500/10 group hover:border-blue-400 transition-all duration-300 shadow-xl">
                                    <div>
                                        <h4 className="text-2xl font-black text-white mb-2 italic uppercase tracking-wider">{t.title}</h4>
                                        <p className="text-blue-200/40 text-lg font-medium">{t.description}</p>
                                    </div>
                                    {t.completed ? (
                                        <div className="flex items-center gap-3 text-green-400 font-black text-xl italic uppercase">
                                            <CheckCircle size={32} /> 已同步
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onCompleteTask(t.id)}
                                            className="bg-blue-600 hover:bg-white hover:text-blue-900 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-all text-xl italic shadow-lg"
                                        >
                                            <Send size={24} /> 执行 (+{t.reward} P)
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setView('MAIN')} className="mt-10 text-blue-400 font-black hover:text-white transition-colors text-lg italic tracking-widest uppercase">返回战备区</button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-10">
                        <div className="mb-12">
                            <h3 className="text-5xl font-black text-cyan-400 italic mb-4">秘密推演 // DEDUCTION GAME</h3>
                            <p className="text-blue-200/60 text-xl max-w-2xl mx-auto italic">这三个人中，只有一个人拥有真正的线索。点击正确的角色获得 +10P。如果猜错，系统将触发硬重启（游戏重置）。</p>
                        </div>
                        <div className="flex justify-center gap-20">
                            {teammates.map(tm => (
                                <motion.div key={tm.name} onClick={() => onDeductionResult(tm.name === correctDeduction)} className="cursor-pointer">
                                    <TeammateSprite url={tm.img} color={tm.color} label={tm.name} onClick={() => {}} />
                                </motion.div>
                            ))}
                        </div>
                        <button onClick={() => setView('MAIN')} className="mt-12 text-gray-500 font-bold hover:text-white uppercase tracking-widest">取消推演</button>
                    </motion.div>
                )}

                <AnimatePresence>
                    {dialog && (
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            className="absolute bottom-[-180px] left-0 right-0 bg-black/95 border-t-8 border-blue-600 p-12 rounded-[3rem] shadow-[0_-40px_100px_rgba(0,122,255,0.4)] z-[6000]"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h4 className="text-4xl font-black italic text-blue-400 uppercase tracking-tighter">{dialog.name}</h4>
                                <div className="text-blue-500/20 font-mono text-xs uppercase tracking-[0.5em]">Syncing Communications...</div>
                            </div>
                            <p className="text-3xl text-white/90 mb-12 leading-snug italic font-medium tracking-tight">"{dialog.text}"</p>
                            <div className="flex gap-6">
                                {dialog.options ? dialog.options.map((opt, i) => (
                                    <button 
                                        key={i} onClick={() => opt.action()}
                                        className="bg-blue-600 hover:bg-white hover:text-blue-900 text-white px-12 py-6 rounded-2xl font-black transition-all text-2xl active:scale-90 shadow-xl italic"
                                    >
                                        {opt.label}
                                    </button>
                                )) : (
                                    <button onClick={() => setDialog(null)} className="bg-white text-blue-950 px-14 py-6 rounded-2xl font-black transition-all text-2xl hover:bg-blue-400 hover:text-white italic">确认接收</button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
