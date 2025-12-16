import { GoogleGenAI } from "@google/genai";
import { FileNode, ChatMessage } from "../types";

// Fallback key provided by user for debugging purposes
const FALLBACK_KEY = "AIzaSyAx97CIiFExxL_HEX7G5B-3lwEkgiP5DY4";

export const generateAIResponse = async (
  query: string, 
  contextFiles: FileNode[],
  history: ChatMessage[]
): Promise<string> => {
  try {
    // 1. Retrieve Key: Check environment variables first, then fallback to the provided key
    // We also use .trim() to remove accidental spaces from copy-pasting
    let apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.trim() === "") {
        console.log("[Vaultify] Env var missing, using fallback key.");
        apiKey = FALLBACK_KEY;
    }
    
    apiKey = apiKey ? apiKey.trim() : "";
    
    // 2. Debug Logging (visible in Browser Console F12)
    if (apiKey) {
      console.log(`[Vaultify] AI Service initialized with Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
    } else {
      console.error("[Vaultify] AI Service: No API Key found.");
      return "Configuration Error: API Key is missing.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Calculate total storage for context
    const totalUsed = contextFiles.reduce((acc, f) => acc + (f.size || 0), 0);
    const totalUsedMB = (totalUsed / 1024 / 1024).toFixed(2);

    // Construct a context-aware file summary
    const fileSummary = contextFiles.length > 0 
      ? contextFiles.map(f => 
          `- ${f.name} (${f.type}, ${f.size ? (f.size / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}, Owner: ${f.ownerName})`
        ).join('\n')
      : "No files available.";

    // Define the persona and context
    const systemInstruction = `
      You are Vaultify AI, the intelligent, professional, and helpful assistant for the Vaultify cloud storage platform.
      
      PLATFORM CONTEXT:
      - Vaultify is a secure, enterprise-grade cloud storage platform similar to Google Drive.
      - Key Features: Real-time file management, AI-powered organization, visual storage analytics, and secure sharing.
      
      YOUR KNOWLEDGE BASE:
      - You have access to the user's current file list metadata.
      - Total Storage Used: ${totalUsedMB} MB
      
      USER'S FILES:
      ${fileSummary}
      
      GUIDELINES:
      - Answer the user's question directly and concisely.
      - If the user asks about storage usage, use the Total Storage Used value provided above.
      - If the user asks to organize files, suggest a folder structure based on file types or names.
      - Be conversational and polite.
    `;

    // specific type mapping for the SDK
    const contents = history
      .filter(msg => msg.id !== 'welcome')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    // Add the current user query to the contents
    contents.push({
      role: 'user',
      parts: [{ text: query }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      contents: contents
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error: any) {
    console.error("[Vaultify] Gemini API Error:", error);
    
    const errorMessage = error.message || error.toString();

    // Specific error handling
    if (errorMessage.includes('API key') || errorMessage.includes('403') || errorMessage.includes('401')) {
        return `Authentication Error: Google refused the key.
        1. Check that 'Generative Language API' is ENABLED in Google Cloud Console.
        2. Check if the key has IP/Referrer restrictions.
        3. Try creating a new key at aistudio.google.com.`;
    }
    
    if (errorMessage.includes('404')) {
         return "Model Error: The 'gemini-2.5-flash' model is not available with your current key or region.";
    }

    return "I'm having trouble connecting to the intelligence server. Please check your network connection.";
  }
};

export const suggestFolderStructure = async (files: FileNode[]): Promise<string> => {
  try {
     let apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
     if (!apiKey || apiKey.trim() === "") apiKey = FALLBACK_KEY;
     apiKey = apiKey.trim();

     if (!apiKey) return "";

     const ai = new GoogleGenAI({ apiKey });
     const fileNames = files.map(f => f.name).join(', ');
     const prompt = `Given these files: ${fileNames}. Suggest a clean folder structure to organize them in JSON format (just the structure names).`;
     
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error(error);
    return "";
  }
}