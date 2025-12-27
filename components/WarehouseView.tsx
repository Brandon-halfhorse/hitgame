
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Users, Info, ClipboardList, Send, CheckCircle, Search, Terminal } from 'lucide-react';
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
        <div className="relative w-56 h-64 mb-6">
            <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] blur-3xl group-hover:bg-blue-500/30 transition-all duration-700" />
            <motion.img 
                src={url} 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(0,122,255,0.5)] relative z-10"
            />
            <div className="absolute -bottom-6 px-6 py-2 bg-black/95 border-2 border-white/30 rounded-full text-[14px] font-black uppercase tracking-[0.3em] shadow-2xl z-20" style={{ color }}>
                {label}
            </div>
        </div>
    </motion.div>
);

export const WarehouseView: React.FC<WarehouseViewProps> = ({ currency, tasks, onClose, onBuy, onRecruit, onCompleteTask, onDeductionResult, hasRecruited }) => {
    const [dialog, setDialog] = useState<{ name: string; text: string; profile: string; options?: { label: string; action: () => void }[] } | null>(null);
    const [view, setView] = useState<'MAIN' | 'TASKS' | 'DEDUCTION'>('MAIN');
    
    // Randomize deduction target each time
    const correctDeductionName = useMemo(() => {
        const names = ["阿夸", "金戈", "玫瑰"];
        return names[Math.floor(Math.random() * names.length)];
    }, []);

    const teammates = [
        { 
            name: "阿夸", 
            img: ALLY_IMG_CYAN, 
            color: COLOR_NEON_CYAN,
            clue: "系统监测到我这里的能源核心频率异常，可能是推演的目标。",
            action: () => setDialog({ 
                name: "阿夸", 
                profile: ALLY_IMG_CYAN,
                text: "后勤补给已就位。通过执行高优先级任务获取足够的同步积分解锁物资。目前的系统环境有些古怪，你得留心。",
                options: [{ label: "打开任务面板", action: () => setView('TASKS') }] 
            })
        },
        { 
            name: "金戈", 
            img: ALLY_IMG_GOLD, 
            color: "#ffca28",
            clue: "阿夸的控制台在发亮，去看看那是不是你要找的。但我感觉玫瑰在掩盖什么。",
            action: () => setDialog({ 
                name: "金戈", 
                profile: ALLY_IMG_GOLD,
                text: "战场不留任何余地。如果你觉得独自突围太冒险，我可以作为先锋掩护你。前提是，我们得达成同步协议。",
                options: hasRecruited ? [] : [
                    { label: "A: 确认交友/招募", action: () => { onRecruit(); setDialog({ name: "金戈", profile: ALLY_IMG_GOLD, text: "招募成功。我将在接下来的攻势中担任你的侧翼支撑。" }); } },
                    { label: "B: 暂时婉拒", action: () => setDialog({ name: "金戈", profile: ALLY_IMG_GOLD, text: "尊重你的判断。如果你需要绝对火力，随时回来找我。" }) }
                ] 
            })
        },
        { 
            name: "玫瑰", 
            img: ALLY_IMG_ROSE, 
            color: "#ff4081",
            clue: "数据流向了金戈的方向，但阿夸的话更值得深思。真正的答案在阴影里。",
            action: () => setDialog({ 
                name: "玫瑰", 
                profile: ALLY_IMG_ROSE,
                text: "所有的Boss都有核心脆弱点。那个大家伙的散热口藏在背甲缝隙。另外，仓库里有个逻辑陷阱，你敢尝试找出那个异常目标吗？", 
                options: [{ label: "启动推演挑战", action: () => setView('DEDUCTION') }] 
            })
        }
    ];

    return (
        <div className="absolute inset-0 z-[5000] bg-[#000510]/98 backdrop-blur-[60px] flex flex-col items-center justify-center p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.25)_0%,transparent_85%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
            
            <div className="w-full max-w-7xl relative z-10">
                <div className="flex justify-between items-end mb-20 border-b-4 border-blue-500/10 pb-12">
                    <div>
                        <h2 className="text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-600 drop-shadow-[0_0_50px_rgba(0,122,255,0.8)]">
                            ZILAN_DEPOT
                        </h2>
                        <p className="text-blue-400 font-mono tracking-[1.5em] mt-6 uppercase text-base opacity-70">Tactical Resupply Hub // Sector Alpha-Zero</p>
                    </div>
                    <div className="flex gap-10">
                        <div className="bg-blue-950/30 border-2 border-blue-400/40 px-10 py-6 rounded-[2.5rem] flex flex-col items-end shadow-[0_0_50px_rgba(0,122,255,0.2)]">
                            <span className="text-xs text-blue-300 font-black uppercase tracking-[0.4em] mb-2">Op Credits</span>
                            <span className="text-7xl font-black text-white italic tracking-tighter">{currency}<span className="text-blue-500 ml-2">P</span></span>
                        </div>
                        <button onClick={onClose} className="bg-white text-blue-950 font-black px-16 py-7 rounded-3xl transition-all hover:bg-blue-500 hover:text-white hover:shadow-[0_0_80px_rgba(255,255,255,0.4)] text-2xl active:scale-95 italic">
                            退出 HUB
                        </button>
                    </div>
                </div>

                {view === 'MAIN' ? (
                    <div className="grid grid-cols-3 gap-24">
                        {teammates.map(tm => (
                            <TeammateSprite key={tm.name} url={tm.img} color={tm.color} label={tm.name} onClick={tm.action} />
                        ))}
                    </div>
                ) : view === 'TASKS' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-blue-900/10 rounded-[4rem] p-16 border-2 border-blue-400/20 h-[500px] overflow-y-auto relative shadow-2xl">
                        <div className="flex items-center gap-8 mb-12 text-blue-400 border-b-2 border-blue-400/10 pb-8">
                            <Terminal size={60} />
                            <h3 className="text-5xl font-black italic tracking-tighter">任务面板 // OP_LIST</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                            {tasks.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-black/60 p-10 rounded-[2.5rem] border-2 border-blue-500/10 group hover:border-blue-400 transition-all duration-500 shadow-2xl">
                                    <div>
                                        <h4 className="text-3xl font-black text-white mb-3 italic uppercase tracking-widest">{t.title}</h4>
                                        <p className="text-blue-200/50 text-xl font-medium tracking-tight">{t.description}</p>
                                    </div>
                                    {t.completed ? (
                                        <div className="flex items-center gap-4 text-green-400 font-black text-2xl italic uppercase tracking-tighter">
                                            <CheckCircle size={40} /> 数据已同步
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onCompleteTask(t.id)}
                                            className="bg-blue-600 hover:bg-white hover:text-blue-900 text-white px-14 py-6 rounded-2xl font-black flex items-center gap-4 active:scale-95 transition-all text-2xl italic shadow-2xl"
                                        >
                                            <Send size={30} /> 确认执行 (+{t.reward} P)
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setView('MAIN')} className="mt-12 text-blue-400 font-black hover:text-white transition-colors text-xl italic tracking-[0.5em] uppercase">返回主界面</button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12">
                        <div className="mb-16">
                            <h3 className="text-7xl font-black text-cyan-400 italic mb-6 tracking-tighter">秘密推演挑战 // LOGIC_TEST</h3>
                            <p className="text-blue-200/70 text-2xl max-w-3xl mx-auto italic leading-relaxed">
                                点击你认为拥有"真实逻辑"的角色。正确奖励 +10P。错误将引发灾难性的系统崩溃（游戏重启）。
                            </p>
                            <div className="flex justify-center gap-8 mt-10">
                                {teammates.map(tm => (
                                    <div key={tm.name} className="bg-blue-900/20 border border-blue-400/20 p-4 rounded-xl text-xs text-blue-300 font-mono italic">
                                        {tm.name}: "{tm.clue}"
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center gap-28">
                            {teammates.map(tm => (
                                <motion.div key={tm.name} onClick={() => onDeductionResult(tm.name === correctDeductionName)} className="cursor-pointer">
                                    <TeammateSprite url={tm.img} color={tm.color} label={tm.name} onClick={() => {}} />
                                </motion.div>
                            ))}
                        </div>
                        <button onClick={() => setView('MAIN')} className="mt-16 text-gray-600 font-black hover:text-white uppercase tracking-[1em] text-sm">取消本次推演</button>
                    </motion.div>
                )}

                <AnimatePresence>
                    {dialog && (
                        <motion.div 
                            initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 150, opacity: 0 }}
                            className="absolute bottom-[-220px] left-0 right-0 bg-black/98 border-t-[10px] border-blue-700 p-14 rounded-[4rem] shadow-[0_-50px_150px_rgba(0,122,255,0.5)] z-[6000] flex gap-12 items-center"
                        >
                            {/* Profile Picture in Dialog */}
                            <div className="w-40 h-40 bg-blue-500/10 rounded-3xl border-2 border-blue-500/30 overflow-hidden flex-shrink-0">
                                <img src={dialog.profile} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex-grow">
                                <div className="flex justify-between items-start mb-6">
                                    <h4 className="text-5xl font-black italic text-blue-400 uppercase tracking-tighter">{dialog.name} // COMMS</h4>
                                    <div className="text-blue-600/30 font-mono text-sm uppercase tracking-[0.8em]">Link Secured</div>
                                </div>
                                <p className="text-4xl text-white/95 mb-14 leading-tight italic font-black tracking-tighter">"{dialog.text}"</p>
                                <div className="flex gap-8">
                                    {dialog.options ? dialog.options.map((opt, i) => (
                                        <button 
                                            key={i} onClick={() => opt.action()}
                                            className="bg-blue-600 hover:bg-white hover:text-blue-950 text-white px-16 py-7 rounded-3xl font-black transition-all text-3xl active:scale-90 shadow-2xl italic"
                                        >
                                            {opt.label}
                                        </button>
                                    )) : (
                                        <button onClick={() => setDialog(null)} className="bg-white text-blue-950 px-20 py-7 rounded-3xl font-black transition-all text-3xl hover:bg-blue-500 hover:text-white italic">接收指令</button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
