
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
  // @ts-ignore
  const apiKey = (window as any).process?.env?.API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Clé API introuvable. Étape 1: Vérifiez VITE_GEMINI_API_KEY sur Netlify. Étape 2: Relancez 'Clear cache and deploy'.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const safeMimeType = mimeType === 'application/octet-stream' || !mimeType ? 
    (base64Data.startsWith('JVBER') ? 'application/pdf' : 'image/jpeg') : mimeType;

  const prompt = `Tu es un assistant administratif expert en milieu scolaire français. 
  Analyse ce document (certificat médical ou dispense EPS) et extrais les informations suivantes en JSON :
  
  - lastName: Nom de famille de l'élève (en MAJUSCULES)
  - firstName: Prénom de l'élève
  - studentClass: Classe (ex: 602, 3èmeB, T01, TermA, etc.)
  - durationDays: Durée totale de l'inaptitude en nombre de jours (entier)
  - startDate: Date de début au format YYYY-MM-DD
  - isTerminale: Boolean. Est-ce une classe de Terminale ?
  
  Règles :
  1. Si absent, mettre null.
  2. Réponds uniquement avec le JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [
        {
          parts: [
            { inlineData: { mimeType: safeMimeType, data: base64Data } },
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
          },
          required: ["isTerminale"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("L'IA n'a pas pu lire le document.");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    if (error.message?.includes('API key not valid')) {
       throw new Error("La clé API fournie à Netlify est invalide (vérifiez s'il n'y a pas un espace au début ou à la fin).");
    }

    throw new Error(error.message || "Erreur lors de l'analyse du document.");
  }
}
