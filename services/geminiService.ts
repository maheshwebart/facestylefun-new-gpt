import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold, Type } from "@google/genai";
import { ImageData } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Define strict safety settings to prevent unsafe content generation.
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

// System instruction to prevent processing images of minors.
const systemInstruction = "You are a responsible AI image editing assistant. Your most critical safety rule is to never process, edit, or generate images that depict children or individuals who appear to be under 18 years of age. If an uploaded image seems to contain a minor, you must strictly refuse the request. Do not proceed with the edit. Instead, reply with only the following text: 'Error: Image appears to contain a child and cannot be processed.'";


export const editImageWithGemini = async (originalImage: ImageData, prompt: string, referenceImage: ImageData | null): Promise<string> => {
  try {
    const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [
        {
            inlineData: {
                data: originalImage.base64,
                mimeType: originalImage.mimeType,
            },
        },
    ];

    if (referenceImage) {
        parts.push({
            inlineData: {
                data: referenceImage.base64,
                mimeType: referenceImage.mimeType,
            },
        });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        safetySettings,
        systemInstruction,
      },
    });

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data; // Success, return image data
        }
      }
    }
    
    // If no image is returned, check for our specific child-related error text
    const responseText = response.text;
    if (responseText && responseText.includes('Image appears to contain a child')) {
        throw new Error("For safety, images of children cannot be processed. Please upload a different image.");
    }
    
    throw new Error("The AI did not return an image. This might be due to a safety filter blocking the result. Please try a different prompt or image.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        // Pass our specific user-friendly error through
        if (error.message.includes("images of children cannot be processed")) {
            throw error;
        }
        // Provide a more generic error for other safety violations.
        if (error.message.toUpperCase().includes('SAFETY') || error.message.toUpperCase().includes('BLOCKED')) {
            throw new Error("Your request was blocked for safety reasons. Please adjust your prompt or use a different image.");
        }
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
};


export const detectGenderWithGemini = async (image: ImageData): Promise<'male' | 'female'> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: image.base64,
                        mimeType: image.mimeType,
                    },
                },
                { text: "Analyze the person in this image and determine their most likely gender. Respond with only a JSON object containing a single key 'gender' with a value of either 'male' or 'female'." },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    gender: {
                        type: Type.STRING,
                        enum: ['male', 'female'],
                    },
                },
            },
            // Disable thinking for this simple, fast task.
            thinkingConfig: { thinkingBudget: 0 },
        },
    });
    
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);

    if (result.gender && (result.gender === 'male' || result.gender === 'female')) {
        return result.gender;
    }
    
    throw new Error('AI did not return a valid gender.');

  } catch (error) {
      console.error("Error in gender detection:", error);
      throw new Error("Could not automatically determine gender. Please select one manually.");
  }
};