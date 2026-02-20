
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

// NOTE: API_KEY is obtained exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface FileData {
  mimeType: string;
  data: string; // base64 string
}

export const generateQuestionsWithAI = async (
  topic: string, 
  count: number = 5,
  fileData?: FileData,
  questionType: 'mcq' | 'true_false' | 'short_answer' | 'essay' | 'mixed' = 'mixed'
): Promise<Question[]> => {
  // Use gemini-3-pro-preview for complex reasoning tasks (educational content generation)
  const model = "gemini-3-pro-preview";
  
  let typeInstruction = "";
  if (questionType === 'mcq') {
    typeInstruction = "Semua soal harus bertipe Pilihan Ganda (mcq) dengan 4 opsi.";
  } else if (questionType === 'true_false') {
    typeInstruction = "Semua soal harus bertipe Benar/Salah (true_false).";
  } else if (questionType === 'short_answer') {
    typeInstruction = "Semua soal harus bertipe Isian Singkat (short_answer).";
  } else if (questionType === 'essay') {
    typeInstruction = "Semua soal harus bertipe Esai (essay).";
  } else {
    typeInstruction = "Buat variasi tipe soal: Pilihan Ganda, Benar/Salah, Isian Singkat, dan Esai.";
  }

  // Konstruksi Prompt berdasarkan keberadaan dokumen
  let promptText = "";
  const basePrompt = `
    Buatkan ${count} soal ujian tentang topik "${topic}" untuk siswa SMA dalam Bahasa Indonesia.
    ${typeInstruction}
    
    Format Output JSON yang diharapkan untuk setiap soal:
    - type: 'mcq' | 'true_false' | 'short_answer' | 'essay'
    - text: Pertanyaan soal
    - points: Bobot nilai (10-20)
    - explanation: Penjelasan jawaban
    - topic: Topik spesifik soal
    - difficulty: 'easy' | 'medium' | 'hard'
    
    Untuk MCQ:
    - options: Array 4 pilihan jawaban
    - correctAnswerIndex: Index jawaban benar (0-3)
    
    Untuk True/False:
    - trueFalseAnswer: boolean (true untuk Benar, false untuk Salah)
    
    Untuk Short Answer:
    - shortAnswer: Kunci jawaban singkat (1-3 kata)
    
    Untuk Essay:
    - essayAnswer: Poin-poin kunci jawaban atau rubrik penilaian
  `;

  if (fileData) {
    promptText = `
      Berdasarkan dokumen yang dilampirkan:
      ${basePrompt}
      Pastikan pertanyaan merujuk langsung pada materi di dalam dokumen.
    `;
  } else {
    promptText = basePrompt;
  }

  const parts: any[] = [{ text: promptText }];
  
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['mcq', 'true_false', 'short_answer', 'essay'] },
              text: { type: Type.STRING },
              points: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              trueFalseAnswer: { type: Type.BOOLEAN },
              shortAnswer: { type: Type.STRING },
              essayAnswer: { type: Type.STRING }
            },
            required: ["type", "text", "points", "explanation"]
          }
        }
      }
    });

    // Access text property directly (not as a method)
    if (response.text) {
      const rawData = JSON.parse(response.text);
      return rawData.map((q: any, index: number) => ({
        ...q,
        // Ensure required points property exists
        points: q.points || 10,
        id: `ai-${Date.now()}-${index}`
      }));
    }
    return [];
  } catch (error) {
    console.error("Gagal generate soal:", error);
    throw error;
  }
};
