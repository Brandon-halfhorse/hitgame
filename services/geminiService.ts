import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    // Safety check: process might not be defined in standard browser environments
    // This prevents the "ReferenceError: process is not defined" crash
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
    
    if (apiKey) {
      ai = new GoogleGenAI({ apiKey });
    }
  }
  return ai;
};

export const generateLevelLore = async (level: number, isBoss: boolean): Promise<string> => {
  try {
    const client = getAiClient();
    if (!client) {
      // Fallback if no API key is present
      return `第 ${level} 关 - 准备战斗 (系统离线模式)`;
    }

    const prompt = `
      为一款黑暗风格的3D动作网页游戏写一段简短的中文介绍（1句话）。
      当前是第 ${level} 关。
      背景：玩家是一名孤独的幸存者，正在对抗被腐蚀的虚拟体。
      ${isBoss ? "这是最后一关，有一个巨大的BOSS。" : "敌人变得越来越快。"}
      不要使用Markdown，只返回纯文本。
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || `第 ${level} 关 - 准备战斗`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `第 ${level} 关启动。祝你好运。`;
  }
};

export const generateVictoryMessage = async (): Promise<string> => {
    try {
        const client = getAiClient();
        if (!client) return "所有试炼已完成。胜利！";

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: "为一位拯救了数字世界的英雄写一句史诗般的中文胜利祝贺语。",
        });
        return response.text || "胜利属于你！";
      } catch (error) {
        return "所有试炼已完成。胜利！";
      }
}