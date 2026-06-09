import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Transcribes audio and extracts structured ledger entries using Gemini 2.5 Flash
 * @param {string} filePath - Path to the audio file on disk
 * @param {string} mimeType - The mime type of the audio file (e.g. 'audio/wav', 'audio/webm')
 * @returns {Promise<object>} The structured ledger extraction result
 */
export const translateVoiceToLedger = async (filePath, mimeType) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
  }

  // Read the audio file and convert it to base64
  const audioBuffer = fs.readFileSync(filePath);
  const base64Audio = audioBuffer.toString('base64');

  const systemInstruction = `
You are a highly advanced multilingual financial assistant designed for the Indian populace (gig workers, rural micro-entrepreneurs, fixed-salaried employees, SHGs).
Your task is to transcribe the input voice audio (which may be in English, Hindi, Hinglish, or other local dialects) and extract financial transactions.

Guidelines:
1. Provide a clear, exact transcription in 'transcribedText'.
2. Identify all transactions mentioned in the speech.
3. For each transaction, classify:
   - type: 'income' or 'expense'
   - category: Use standard, clean financial categories (e.g., 'Gig Income', 'Fuel/Petrol', 'Salary', 'Groceries', 'Rent', 'Travel', 'Utilities').
   - source: The entity involved if mentioned (e.g., 'Swiggy', 'Zomato', 'Ola', 'Self').
   - amount: Numeric value (resolve words like "do hazaar paanch sau" to 2500, "teen sau" to 300).
   - mode: 'Digital' (if online/bank/upi transfer implied) or 'Cash'. Default to 'Cash' if not implied.
   - description: Brief transaction description in English.
4. Provide a warm, localized voice reply in 'voiceReply' (e.g., in friendly Hinglish like "Aaj aapne ₹2500 kamaye aur ₹300 petrol par kharch kiye. Aapka aaj ka munafa ₹2200 hai.") summarizing the actions.
5. Provide actionable budgeting suggestions in 'suggestions' (e.g., "Keep fuel expenses under 15% of your income to optimize savings.").
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType
          }
        },
        'Parse the transactions from this audio recording.'
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            transcribedText: { type: 'STRING' },
            voiceReply: { type: 'STRING' },
            transactions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  type: { type: 'STRING', enum: ['income', 'expense'] },
                  category: { type: 'STRING' },
                  source: { type: 'STRING' },
                  amount: { type: 'NUMBER' },
                  mode: { type: 'STRING', enum: ['Cash', 'Digital'] },
                  description: { type: 'STRING' }
                },
                required: ['type', 'category', 'amount', 'mode', 'description']
              }
            },
            suggestions: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['transcribedText', 'voiceReply', 'transactions', 'suggestions']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response received from Gemini API.');
    }

    return JSON.parse(resultText);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};
