
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
  // On utilise directement process.env.API_KEY qui est peuplé par index.tsx
  // @ts-ignore
  const apiKey = process.env.API_KEY;

  // On laisse le SDK Gemini gérer l'appel
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  
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
    if (!text) throw new Error("Réponse vide de l'IA");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    
    if (!apiKey) {
      throw new Error("La clé API n'est pas détectée. Vérifiez que vous avez bien relancé un déploiement sur Netlify.");
    }

    if (error.message?.includes('API key not valid')) {
       throw new Error("La clé API configurée est invalide (vérifiez les espaces).");
    }

    if (error.message?.includes('413')) {
      throw new Error("Le document est trop volumineux pour être analysé.");
    }
    throw error;
  }
}
