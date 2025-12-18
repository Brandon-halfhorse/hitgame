import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
    if (apiKey) { ai = new GoogleGenAI({ apiKey }); }
  }
  return ai;
};

export const generateLevelLore = async (level: number, isBoss: boolean): Promise<string> => {
  try {
    const client = getAiClient();
    if (!client) return `战区 ${level}: 麦野遭遇战。清除所有威胁。`;

    const prompt = `
      Write a short (1 sentence) cinematic combat update for a special forces mission in a wheat field.
      Mission Level: ${level}. ${isBoss ? "The enemy leader is here." : "More thugs are closing in."}
      Tone: Gritty, military, Chinese language.
      Do not use Markdown.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || `战区 ${level} 已锁定，准备交火。`;
  } catch (error) {
    return `战区 ${level} 部署完毕。小心地雷。`;
  }
};

export const generateVictoryMessage = async (): Promise<string> => {
    try {
        const client = getAiClient();
        if (!client) return "全线大捷，撤离点已激活。";

        const response = await client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Write a high-stakes military victory quote in Chinese (1 sentence).",
        });
        return response.text || "任务圆满完成。";
      } catch (error) {
        return "大捷！";
      }
}