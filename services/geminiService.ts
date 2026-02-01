
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
  // Sécurité sur le type MIME pour mobile
  const safeMimeType = mimeType === 'application/octet-stream' || !mimeType ? 
    (base64Data.startsWith('JVBER') ? 'application/pdf' : 'image/jpeg') : mimeType;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Tu es un assistant administratif expert en milieu scolaire. 
  Analyse ce document (certificat médical ou dispense EPS) et extrais les informations suivantes en JSON :
  
  - lastName: Nom de famille de l'élève (en MAJUSCULES)
  - firstName: Prénom de l'élève
  - studentClass: Classe (ex: 602, 3èmeB, T01, TermA, etc.)
  - durationDays: Durée totale de l'inaptitude en nombre de jours (entier)
  - startDate: Date de début au format YYYY-MM-DD
  - isTerminale: Boolean. Est-ce une classe de Terminale ? (Chercher les indices comme 'T', 'Term', 'Terminale', 'Baccalaureat', 'Examen')
  
  Règles impératives :
  1. Si une information est absente, mets null.
  2. Si plusieurs dates sont présentes, prends la date de début de l'inaptitude.
  3. Réponds uniquement avec le JSON.`;

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
    // On renvoie une erreur explicite pour que le formulaire puisse l'afficher
    if (error.message?.includes('413')) {
      throw new Error("Fichier trop volumineux pour l'IA.");
    }
    throw error;
  }
}
