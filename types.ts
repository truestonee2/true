
export enum SpeechType {
  NARRATION = '나레이션',
  ONE_ON_ONE = '1:1 대화',
  MULTI = '다중 대화',
}

export interface Character {
  id: string;
  name: string;
  persona: string;
  imageTouch?: string;
}

export interface ScriptLine {
  id: string;
  characterId: string;
  line: string;
  emotion: string;
  tone: string;
}

export interface NarrationRequest {
  type: SpeechType.NARRATION;
  scenario: string;
  persona: string;
  emotion: string;
  tone: string;
  environment: string;
}

export interface DialogueRequest {
  type: SpeechType.ONE_ON_ONE | SpeechType.MULTI;
  scenario: string;
  characters: Character[];
  script: ScriptLine[];
}

export type PromptRequest = NarrationRequest | DialogueRequest;

export interface GeneratedPrompt {
  json: object;
  integrated: string;
}