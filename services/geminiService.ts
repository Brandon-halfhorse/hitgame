
import { GoogleGenAI } from "@google/genai";

export const generateLevelLore = async (level: number, isBoss: boolean): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Write a short (1 sentence) gritty cyberpunk combat update for a mission in a neon-lit urban street.
      Mission Level: ${level}. ${isBoss ? "The giant red-haired leader is in sight." : "More street thugs are emerging from the shadows."}
      Tone: Hardboiled, military, Chinese language.
      Squad Name: 紫岚战队.
      Do not use Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // text is a property access.
    return response.text?.trim() || `紫岚战队已抵达街区 ${level}，准备清除目标。`;
  } catch (error) {
    console.error("Gemini Lore Error:", error);
    return `前方战线已锁定。紫岚战队开始推进。`;
  }
};

export const generateVictoryMessage = async (): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Write a high-octane cyberpunk victory quote in Chinese (1 sentence).",
        });
        return response.text?.trim() || "目标已肃清，紫岚战队大捷。";
      } catch (error) {
        console.error("Gemini Victory Error:", error);
        return "街道已归于寂静。任务完成。";
      }
}
