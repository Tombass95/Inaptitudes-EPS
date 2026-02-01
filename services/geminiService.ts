
import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedData {
  lastName: string | null;
  firstName: string | null;
  studentClass: string | null;
  durationDays: number | null;
  startDate: string | null; // YYYY-MM-DD
  isTerminale: boolean;
}

export async function extractExemptionData(base64Data: string, mimeType: string = 'image/jpeg'): Promise<ExtractedData> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analyse ce document (certificat médical ou dispense EPS). Extrais en JSON :
  - lastName: Nom de famille (MAJUSCULES)
  - firstName: Prénom
  - studentClass: Classe (ex: 602, 3èmeB, T01, TermA)
  - durationDays: Durée en jours (entier)
  - startDate: Date début (YYYY-MM-DD)
  - isTerminale: Boolean. Est-ce une classe de Terminale ? (Détecter via T, TERM, TERMINALE, ou contexte Bac)
  
  IMPORTANT : Si une information est illisible ou absente, retourne null.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [
        {
          parts: [
            { inlineData: { mimeType: mimeType, data: base64Data } },
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
            startDate: { type: Type.STRING, nullable: true },
            isTerminale: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { lastName: null, firstName: null, studentClass: null, durationDays: null, startDate: null, isTerminale: false };
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { lastName: null, firstName: null, studentClass: null, durationDays: null, startDate: null, isTerminale: false };
  }
}
