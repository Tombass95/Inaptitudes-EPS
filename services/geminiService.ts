
import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedData {
  lastName: string | null;
  firstName: string | null;
  studentClass: string | null;
  durationDays: number | null;
  startDate: string | null; // YYYY-MM-DD
}

export async function extractExemptionData(base64Image: string): Promise<ExtractedData> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const prompt = `Analyse ce certificat médical EPS. Extrais en JSON :
  - lastName: Nom de famille (MAJUSCULES)
  - firstName: Prénom
  - studentClass: Classe (ex: 602, 3èmeB)
  - durationDays: Durée en jours (entier)
  - startDate: Date début (YYYY-MM-DD)
  
  IMPORTANT : Si une information est illisible ou absente, retourne null (valeur JSON null, pas le texte "null").`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lastName: { type: Type.STRING, nullable: true },
            firstName: { type: Type.STRING, nullable: true },
            studentClass: { type: Type.STRING, nullable: true },
            durationDays: { type: Type.NUMBER, nullable: true },
            startDate: { type: Type.STRING, nullable: true }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { lastName: null, firstName: null, studentClass: null, durationDays: null, startDate: null };
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { lastName: null, firstName: null, studentClass: null, durationDays: null, startDate: null };
  }
}
