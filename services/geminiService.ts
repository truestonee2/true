import { GoogleGenAI, Type } from "@google/genai";
import type { PromptRequest, GeneratedPrompt, NarrationRequest, DialogueRequest } from '../types';
import { SpeechType } from '../types';
import type { Language } from '../i18n';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const NARRATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "Should be 'narration'." },
    scenario: { type: Type.STRING, description: "A brief summary of the scene or context." },
    persona: { type: Type.STRING, description: "The personality or role of the narrator." },
    content: { type: Type.STRING, description: "The full text of the narration." },
    emotion: { type: Type.STRING, description: "The primary emotion to convey (e.g., 'Sad', 'Joyful', 'Tense')." },
    tones: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of vocal tones or styles (e.g., 'Whispering', 'Booming', 'Fast-paced')." },
    environment: { type: Type.STRING, description: "The physical setting or acoustic environment for the narration (e.g., 'In a vast cave', 'Small room', 'Outdoors in a storm')." },
    integrated_text: {type: Type.STRING, description: "A single string combining all elements into a comprehensive prompt for a text-to-speech engine, formatted for readability."}
  },
  required: ["type", "scenario", "persona", "content", "emotion", "tones", "environment", "integrated_text"],
};

const DIALOGUE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, description: "Should be 'dialogue'." },
    scenario: { type: Type.STRING, description: "A brief summary of the scene or context for the dialogue." },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          persona: { type: Type.STRING, description: "The personality or role of the character." },
        },
        required: ["name", "persona"],
      },
    },
    script: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          character: { type: Type.STRING, description: "The name of the character speaking." },
          line: { type: Type.STRING, description: "The dialogue line." },
          emotion: { type: Type.STRING, description: "The primary emotion for this line." },
          tone: { type: Type.STRING, description: "A specific vocal tone or parenthetical direction." },
        },
        required: ["character", "line", "emotion", "tone"],
      },
    },
    integrated_text: {type: Type.STRING, description: "A single string combining all elements into a comprehensive prompt for a text-to-speech engine, formatted as a script."}
  },
  required: ["type", "scenario", "characters", "script", "integrated_text"],
};

const SYSTEM_INSTRUCTION = `You are a master scriptwriter for 'cosplay' style voice acting and advanced text-to-speech generation. Your goal is to create vivid, emotionally-rich, and character-driven scenarios. You must generate a detailed prompt based on the user's specifications. The final output must be a single JSON object that strictly adheres to the provided schema. The 'integrated_text' field must be a complete, well-formatted string combining all information into a final, readable script or narration prompt.`;

export const generatePrompt = async (request: PromptRequest): Promise<GeneratedPrompt> => {
  let userPrompt: string;
  let schema: object;
  
  const durationConstraint = (duration: string | undefined): string => {
    if (!duration) return '';
    const parsedDuration = parseInt(duration, 10);
    if (!isNaN(parsedDuration) && parsedDuration > 0) {
        return `\n- The total length should be approximately ${parsedDuration} seconds.`;
    }
    return '';
  };

  if (request.type === SpeechType.NARRATION) {
    const r = request as NarrationRequest;
    userPrompt = `
      Generate a speech prompt for a narration.
      - Scenario: ${r.scenario}
      - Narrator's Persona: ${r.persona}
      - Primary Emotion: ${r.emotion}
      - Vocal Tones: ${r.tone}
      - Environment: ${r.environment}
      The narration should be descriptive, immersive, and set a clear mood based on these details. The environment should influence the tone and description.${durationConstraint(r.duration)}`;
    schema = NARRATION_SCHEMA;
  } else {
    const r = request as DialogueRequest;
    const characterDescriptions = r.characters.map(c => `- ${c.name}: ${c.persona}`).join('\n');
    
    const hasScript = r.script && r.script.length > 0 && r.script.some(l => l.line.trim() !== '');

    if (hasScript) {
        const characterMap = new Map(r.characters.map(c => [c.id, c.name]));
        const scriptContent = r.script
            .filter(line => line.line.trim() !== '')
            .map(line => {
                const charName = characterMap.get(line.characterId) || 'Unknown Character';
                return `${charName}: "${line.line}" (Emotion: ${line.emotion || 'not specified'}, Tone: ${line.tone || 'not specified'})`;
            })
            .join('\n');

        userPrompt = `
          Generate and format a speech prompt for a dialogue based on the user-provided script.
          - Scenario: ${r.scenario}
          - Characters:\n${characterDescriptions}
          - User-provided Script:\n${scriptContent}
          
          Your task is to take the provided script and format it perfectly into the required JSON structure.
          Refine the emotion and tone descriptions to be more evocative and detailed where appropriate, but strictly adhere to the dialogue lines and character assignments from the script.
          The 'integrated_text' should be a clean, readable script format of the final dialogue.${durationConstraint(r.duration)}`;
    } else {
        userPrompt = `
          Generate a speech prompt for a dialogue.
          - Scenario: ${r.scenario}
          - Characters:\n${characterDescriptions}
          The dialogue should be dramatic and engaging. Each line in the script must have a specified character, the line of dialogue, a primary emotion, and a specific tone/direction.
          Generate a complete script from scratch based on the scenario and characters provided.${durationConstraint(r.duration)}`;
    }
    schema = DIALOGUE_SCHEMA;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    return {
      json: parsedJson,
      integrated: parsedJson.integrated_text || "Failed to generate integrated text.",
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};

export const generateScenarioSuggestion = async (theme: string, lang: Language): Promise<string> => {
  try {
    const prompt = lang === 'ko'
      ? `주제 "${theme}"를 바탕으로, 나레이션을 위한 매력적이고 서술적인 시나리오를 한 문단으로 생성해주세요.`
      : `Based on the theme "${theme}", generate an engaging and descriptive one-paragraph scenario for a narration.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating scenario suggestion:", error);
    throw new Error("Failed to generate scenario suggestion.");
  }
};

const NARRATOR_DETAILS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        persona: { type: Type.STRING, description: "A suitable persona for the narrator (e.g., 'Tired traveler', 'Excited scientist')." },
        emotion: { type: Type.STRING, description: "The primary emotion the narrator should convey (e.g., 'Sadness', 'Wonder')." },
        tone: { type: Type.STRING, description: "The vocal tone or style of the narration (e.g., 'Whispering tone', 'Booming voice')." },
        environment: { type: Type.STRING, description: "The physical acoustic environment for the narration (e.g., 'In a vast cave', 'Outdoors in a storm')." },
    },
    required: ["persona", "emotion", "tone", "environment"],
};

export const generateNarratorDetailsSuggestion = async (scenario: string, lang: Language): Promise<{ persona: string; emotion: string; tone: string; environment: string; }> => {
    try {
        const prompt = lang === 'ko'
          ? `다음 나레이션 시나리오를 보고, 이상적인 나레이터 정보를 제안해주세요.
            시나리오: "${scenario}"
            
            적절한 페르소나, 주요 감정, 구체적인 목소리 톤, 그리고 어울리는 음향 환경을 제공해주세요.`
          : `Based on the following narration scenario, suggest the ideal narrator details.
            Scenario: "${scenario}"
            
            Provide an appropriate persona, primary emotion, a specific vocal tone, and a suitable acoustic environment.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: NARRATOR_DETAILS_SCHEMA,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating narrator details:", error);
        throw new Error("Failed to generate narrator details.");
    }
};

export const generateImageTouchSuggestion = async (characterName: string, characterPersona: string, lang: Language): Promise<string> => {
  try {
    const prompt = lang === 'ko'
      ? `캐릭터 이름 "${characterName}"(페르소나: ${characterPersona})에 대해, 세계적인 립싱크 전문가 코스플레이어가 연기한다고 가정하고 섬세한 '이미지 터치'를 제안해주세요. 여기에는 표정, 강조를 위한 주요 입 모양, 미묘한 제스처, 메이크업 디테일 등 연기를 향상시킬 구체적인 제안이 포함되어야 합니다.`
      : `For a character named "${characterName}" with the persona "${characterPersona}", suggest some detailed 'image touches' assuming they are portrayed by a world-class lip-sync expert cosplayer. This should include specific suggestions for facial expressions, key lip shapes for emphasis, subtle gestures, and makeup details that would enhance their performance.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating image touch suggestion:", error);
    throw new Error("Failed to generate image touch suggestion.");
  }
};