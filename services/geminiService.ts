
import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedData {
  lastName: string | null;
  firstName: string | null;
  studentClass: string | null;
  durationDays: number | null;
  startDate: string | null; // YYYY-MM-DD
  isTerminale: boolean;
}

/**
 * Fonction de délai pour le retry
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function extractExemptionData(base64Data: string, mimeType: string = 'image/jpeg'): Promise<ExtractedData> {
  // @ts-ignore
  const apiKey = (window as any).process?.env?.API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Clé API introuvable. Vérifiez votre configuration Netlify.");
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

  // Logique de retry (3 tentatives max)
  let lastError: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        // Passage à un modèle plus stable pour éviter les erreurs 503 "Overloaded"
        model: 'gemini-2.5-flash-lite-latest', 
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
      lastError = error;
      const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
      const isRateLimit = error.message?.includes('429');

      if ((isOverloaded || isRateLimit) && attempt < 3) {
        console.warn(`Tentative ${attempt} échouée (Serveur occupé). Nouvelle tentative dans ${attempt}s...`);
        await delay(1000 * attempt); // Attente progressive
        continue;
      }
      break;
    }
  }

  // Si on arrive ici, c'est que toutes les tentatives ont échoué
  console.error("Gemini Final Error:", lastError);
  
  if (lastError.message?.includes('503') || lastError.message?.includes('overloaded')) {
    throw new Error("Les serveurs de Google sont temporairement surchargés. Réessayez dans 30 secondes.");
  }

  if (lastError.message?.includes('API key not valid')) {
    throw new Error("Clé API invalide sur Netlify.");
  }

  throw new Error(lastError.message || "Erreur lors de l'analyse du document.");
}
